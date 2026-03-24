"""Price API routes."""
from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.models.price_data import PriceData
from app.models.asset import Asset
from app.schemas.price import PriceResponse

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
