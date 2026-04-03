"""Price API routes."""
from typing import List, Optional, Dict
from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.core.database import get_db
from app.models.price_data import PriceData
from app.models.asset import Asset
from app.schemas.price import PriceResponse, LatestPriceResponse

router = APIRouter(prefix="/prices", tags=["prices"])


@router.get("", response_model=List[PriceResponse])
def get_prices(
    asset_id: str,
    start: Optional[date] = Query(None, description="开始日期"),
    end: Optional[date] = Query(None, description="结束日期"),
    interval: str = Query("1d", description="周期: 1d/1w/1m"),
    limit: int = Query(100, description="返回数量限制"),
    db: Session = Depends(get_db)
):
    """Get price data for an asset."""
    # Check asset exists
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Build query
    query = db.query(PriceData).filter(
        PriceData.asset_id == asset_id,
        PriceData.interval == interval
    )
    
    if start:
        query = query.filter(PriceData.date >= start)
    if end:
        query = query.filter(PriceData.date <= end)
    
    # Order by date descending, limit results
    prices = query.order_by(desc(PriceData.date)).limit(limit).all()
    
    return prices[::-1]  # Reverse to ascending order


@router.get("/latest", response_model=Optional[PriceResponse])
def get_latest_price(asset_id: str, db: Session = Depends(get_db)):
    """Get latest price for an asset."""
    price = db.query(PriceData).filter(
        PriceData.asset_id == asset_id
    ).order_by(desc(PriceData.date)).first()
    
    if not price:
        raise HTTPException(status_code=404, detail="No price data found")
    
    return price


@router.get("/latest/batch", response_model=List[LatestPriceResponse])
def get_latest_prices_batch(
    asset_ids: str = Query(..., description="Comma-separated asset IDs (e.g., BTC-USD,SPY,AAPL)"),
    db: Session = Depends(get_db)
):
    """
    Get latest prices for multiple assets (batch endpoint for watchlist).
    
    Returns latest price, change, and data freshness for each asset.
    """
    if not asset_ids:
        return []
    
    # Parse asset_ids
    id_list = [id.strip() for id in asset_ids.split(",") if id.strip()]
    
    if not id_list:
        return []
    
    # Get all assets info
    assets = db.query(Asset).filter(Asset.id.in_(id_list)).all()
    asset_map = {a.id: a for a in assets}
    
    # Get latest price for each asset using subquery
    results = []
    today = date.today()
    yesterday = today - timedelta(days=1)
    
    for asset_id in id_list:
        asset = asset_map.get(asset_id)
        if not asset:
            continue
        
        # Get latest price
        latest = db.query(PriceData).filter(
            PriceData.asset_id == asset_id
        ).order_by(desc(PriceData.date)).first()
        
        if not latest:
            continue
        
        # Get previous day price for change calculation
        previous = db.query(PriceData).filter(
            PriceData.asset_id == asset_id,
            PriceData.date < latest.date
        ).order_by(desc(PriceData.date)).first()
        
        # Calculate change
        change = None
        change_percent = None
        if previous and previous.close:
            change = latest.close - previous.close
            change_percent = (change / previous.close) * 100
        
        # Determine data freshness
        days_since_update = (today - latest.date).days
        if days_since_update == 0:
            freshness = "fresh"
        elif days_since_update <= 2:
            freshness = "stale"
        else:
            freshness = "outdated"
        
        results.append(LatestPriceResponse(
            asset_id=asset_id,
            symbol=asset.symbol,
            close=latest.close,
            open=latest.open,
            high=latest.high,
            low=latest.low,
            volume=latest.volume,
            change=round(change, 2) if change is not None else None,
            change_percent=round(change_percent, 2) if change_percent is not None else None,
            date=latest.date,
            last_updated=latest.created_at or datetime.utcnow(),
            data_freshness=freshness
        ))
    
    return results


@router.post("/refresh", response_model=Dict[str, str])
def refresh_prices(
    asset_ids: Optional[List[str]] = Query(None, description="Asset IDs to refresh (None = all active)"),
    db: Session = Depends(get_db)
):
    """
    Trigger price refresh for specified assets or all active assets.
    
    This is a synchronous endpoint for manual refresh from watchlist.
    For large batches, use the scheduler endpoint.
    """
    from app.services.price_scheduler import run_price_update
    
    try:
        results = run_price_update(asset_ids=asset_ids, lookback_days=5)
        success_count = sum(1 for r in results if r.get("status") == "success")
        total = len(results)
        
        return {
            "status": "success",
            "message": f"Updated {success_count}/{total} assets",
            "details": f"New: {sum(r.get('inserted', 0) for r in results)}, "
                      f"Updated: {sum(r.get('updated', 0) for r in results)}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Refresh failed: {str(e)}")
