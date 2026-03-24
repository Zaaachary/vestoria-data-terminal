"""Price schemas."""
from datetime import datetime, date
from typing import List, Optional
from pydantic import BaseModel, Field


class PriceBase(BaseModel):
    """Base price schema."""
    asset_id: str
    timestamp: datetime
    date: date
    interval: str = "1d"
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    close: float
    volume: Optional[float] = None
    source: Optional[str] = None


class PriceCreate(PriceBase):
    """Create price schema."""
    pass


class PriceResponse(PriceBase):
    """Price response schema."""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class PriceHistoryRequest(BaseModel):
    """Price history request parameters."""
    asset_id: str
    start: Optional[date] = None
    end: Optional[date] = None
    interval: str = "1d"
