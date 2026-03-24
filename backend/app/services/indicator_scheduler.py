"""Indicator calculation scheduler service."""
import asyncio
from datetime import datetime, date, timedelta
from typing import List, Dict, Optional
import threading

from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import SessionLocal
from app.models.indicator import Indicator, IndicatorValue
from app.models.price_data import PriceData
from app.indicators.registry import create_processor


class IndicatorScheduler:
    """
    Scheduler for automatic indicator calculations.
    """
    
    def __init__(self):
        self._running = False
        self._lock = threading.Lock()
        self._last_run: Optional[datetime] = None
        self._results: List[Dict] = []
    
    @property
    def is_running(self) -> bool:
        """Check if calculation is currently running."""
        with self._lock:
            return self._running
    
    @property
    def last_run(self) -> Optional[datetime]:
        """Get timestamp of last successful run."""
        return self._last_run
    
    def calculate_indicator(
        self,
        indicator_id: int,
        start: date = None,
        end: date = None,
        db: Session = None
    ) -> Dict:
        """
        Calculate values for a single indicator.
        
        Args:
            indicator_id: Indicator ID
            start: Start date (default: 1 year ago)
            end: End date (default: today)
            db: Database session
        
        Returns:
            Calculation result dict
        """
        close_db = False
        if db is None:
            db = SessionLocal()
            close_db = True
        
        try:
            indicator = db.query(Indicator).filter(Indicator.id == indicator_id).first()
            if not indicator:
                return {
                    "indicator_id": indicator_id,
                    "status": "error",
                    "message": "Indicator not found"
                }
            
            template = indicator.template
            if not template:
                return {
                    "indicator_id": indicator_id,
                    "status": "error",
                    "message": "Template not found"
                }
            
            # Determine date range
            if end is None:
                end = date.today()
            if start is None:
                start = end - timedelta(days=365)
            
            print(f"Calculating {indicator.name} ({template.name}): {start} to {end}")
            
            # Create processor
            processor = create_processor(template.id, indicator.params)
            if not processor:
                return {
                    "indicator_id": indicator_id,
                    "status": "error",
                    "message": f"Processor not found: {template.id}"
                }
            
            # Check if price data exists for this asset
            price_count = db.query(PriceData).filter(
                PriceData.asset_id == indicator.asset_id,
                PriceData.date >= start,
                PriceData.date <= end
            ).count()
            
            if price_count == 0:
                return {
                    "indicator_id": indicator_id,
                    "status": "skipped",
                    "message": f"No price data for {indicator.asset_id} in date range"
                }
            
            # Run calculation
            results = asyncio.run(processor.calculate(indicator.asset_id, start, end))
            
            if not results:
                return {
                    "indicator_id": indicator_id,
                    "status": "success",
                    "message": "No values calculated",
                    "count": 0
                }
            
            # Save to database
            inserted = 0
            updated = 0
            
            for result in results:
                existing = db.query(IndicatorValue).filter(
                    IndicatorValue.indicator_id == indicator_id,
                    IndicatorValue.date == result.date
                ).first()
                
                if existing:
                    existing.value = result.value
                    existing.value_text = result.value_text
                    existing.grade = result.grade
                    existing.grade_label = result.grade_label
                    existing.extra_data = result.extra_data or {}
                    existing.timestamp = result.timestamp
                    updated += 1
                else:
                    db_value = IndicatorValue(
                        indicator_id=indicator_id,
                        date=result.date,
                        timestamp=result.timestamp,
                        value=result.value,
                        value_text=result.value_text,
                        grade=result.grade,
                        grade_label=result.grade_label,
                        extra_data=result.extra_data or {},
                        source="calculation"
                    )
                    db.add(db_value)
                    inserted += 1
            
            # Update indicator last_calculated_at
            indicator.last_calculated_at = datetime.utcnow()
            db.commit()
            
            return {
                "indicator_id": indicator_id,
                "indicator_name": indicator.name,
                "status": "success",
                "count": len(results),
                "inserted": inserted,
                "updated": updated,
                "start_date": results[0].date if results else None,
                "end_date": results[-1].date if results else None
            }
            
        except Exception as e:
            db.rollback()
            return {
                "indicator_id": indicator_id,
                "status": "error",
                "message": str(e)
            }
        finally:
            if close_db:
                db.close()
    
    def calculate_all(
        self,
        indicator_ids: List[int] = None,
        start: date = None,
        end: date = None,
        force: bool = False
    ) -> List[Dict]:
        """
        Calculate all indicators or specified ones.
        
        Args:
            indicator_ids: Specific indicator IDs (None = all active)
            start: Start date
            end: End date
            force: Run even if already running
        
        Returns:
            List of calculation results
        """
        with self._lock:
            if self._running and not force:
                print("Calculation already in progress, skipping...")
                return []
            self._running = True
        
        try:
            print(f"[{datetime.now()}] Starting indicator calculations...")
            
            db = SessionLocal()
            try:
                query = db.query(Indicator).filter(Indicator.is_active == True)
                if indicator_ids:
                    query = query.filter(Indicator.id.in_(indicator_ids))
                
                indicators = query.all()
                print(f"Calculating {len(indicators)} indicators...")
                
                results = []
                for indicator in indicators:
                    result = self.calculate_indicator(
                        indicator_id=indicator.id,
                        start=start,
                        end=end,
                        db=db
                    )
                    results.append(result)
                    
                    status_icon = "✓" if result["status"] == "success" else "✗"
                    print(f"  {status_icon} {indicator.name}: {result.get('count', 0)} values")
                
                self._last_run = datetime.now()
                self._results = results
                
                print(f"[{datetime.now()}] Calculations completed")
                success_count = sum(1 for r in results if r["status"] == "success")
                total_values = sum(r.get("count", 0) for r in results)
                print(f"  Success: {success_count}/{len(results)}")
                print(f"  Total values: {total_values}")
                
                return results
                
            finally:
                db.close()
                
        finally:
            with self._lock:
                self._running = False
    
    def calculate_latest(self, indicator_id: int) -> Dict:
        """
        Calculate latest value for an indicator.
        
        Args:
            indicator_id: Indicator ID
        
        Returns:
            Calculation result dict
        """
        db = SessionLocal()
        try:
            indicator = db.query(Indicator).filter(Indicator.id == indicator_id).first()
            if not indicator:
                return {"indicator_id": indicator_id, "status": "error", "message": "Not found"}
            
            template = indicator.template
            processor = create_processor(template.id, indicator.params)
            
            if not processor:
                return {"indicator_id": indicator_id, "status": "error", "message": "Processor not found"}
            
            result = asyncio.run(processor.calculate_latest(indicator.asset_id))
            
            if not result:
                return {"indicator_id": indicator_id, "status": "success", "message": "No latest value"}
            
            # Save to database
            existing = db.query(IndicatorValue).filter(
                IndicatorValue.indicator_id == indicator_id,
                IndicatorValue.date == result.date
            ).first()
            
            if existing:
                existing.value = result.value
                existing.value_text = result.value_text
                existing.grade = result.grade
                existing.grade_label = result.grade_label
                existing.extra_data = result.extra_data or {}
                existing.timestamp = result.timestamp
            else:
                db_value = IndicatorValue(
                    indicator_id=indicator_id,
                    date=result.date,
                    timestamp=result.timestamp,
                    value=result.value,
                    value_text=result.value_text,
                    grade=result.grade,
                    grade_label=result.grade_label,
                    extra_data=result.extra_data or {},
                    source="calculation"
                )
                db.add(db_value)
            
            indicator.last_calculated_at = datetime.utcnow()
            db.commit()
            
            return {
                "indicator_id": indicator_id,
                "indicator_name": indicator.name,
                "status": "success",
                "date": result.date.isoformat(),
                "value": result.value,
                "value_text": result.value_text,
                "grade": result.grade,
                "grade_label": result.grade_label
            }
            
        except Exception as e:
            db.rollback()
            return {"indicator_id": indicator_id, "status": "error", "message": str(e)}
        finally:
            db.close()
    
    def get_status(self) -> Dict:
        """Get scheduler status."""
        return {
            "is_running": self.is_running,
            "last_run": self._last_run.isoformat() if self._last_run else None,
            "last_result_count": len(self._results)
        }


# Global scheduler instance
_indicator_scheduler: Optional[IndicatorScheduler] = None


def get_indicator_scheduler() -> IndicatorScheduler:
    """Get or create global indicator scheduler."""
    global _indicator_scheduler
    if _indicator_scheduler is None:
        _indicator_scheduler = IndicatorScheduler()
    return _indicator_scheduler


def calculate_all_indicators(
    indicator_ids: List[int] = None,
    start: date = None,
    end: date = None
) -> List[Dict]:
    """
    Convenience function to calculate all indicators.
    
    Usage:
        results = calculate_all_indicators()
        results = calculate_all_indicators([1, 2, 3])
    """
    scheduler = get_indicator_scheduler()
    return scheduler.calculate_all(indicator_ids=indicator_ids, start=start, end=end)


def calculate_indicator_latest(indicator_id: int) -> Dict:
    """
    Convenience function to calculate latest value.
    
    Usage:
        result = calculate_indicator_latest(1)
    """
    scheduler = get_indicator_scheduler()
    return scheduler.calculate_latest(indicator_id)
