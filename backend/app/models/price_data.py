"""Price data model."""
from datetime import datetime, date

from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship

from app.core.database import Base


class PriceData(Base):
    """Price data (OHLCV) model."""
    
    __tablename__ = "price_data"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Foreign key
    asset_id = Column(String, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Time dimensions
    timestamp = Column(DateTime, nullable=False)  # 精确时间
    date = Column(Date, nullable=False, index=True)  # 日期（方便查询）
    interval = Column(String, default="1d", nullable=False)  # 周期: 1d/1w/1m
    
    # OHLCV
    open = Column(Float, nullable=True)
    high = Column(Float, nullable=True)
    low = Column(Float, nullable=True)
    close = Column(Float, nullable=False)
    volume = Column(Float, nullable=True)
    
    # Metadata
    source = Column(String, nullable=True)  # 数据来源
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('asset_id', 'date', 'interval', name='uix_price_asset_date_interval'),
        Index('idx_price_query', 'asset_id', 'interval', 'date'),
    )
    
    # Relationships
    asset = relationship("Asset", back_populates="price_data")
    
    def __repr__(self):
        return f"<PriceData(asset_id='{self.asset_id}', date='{self.date}', close={self.close})>"
