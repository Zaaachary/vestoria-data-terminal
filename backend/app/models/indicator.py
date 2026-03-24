"""Indicator models."""
from datetime import datetime, date
from typing import Optional

from sqlalchemy import Column, String, DateTime, Date, Float, JSON, ForeignKey, UniqueConstraint, Index, Integer, Boolean
from sqlalchemy.orm import relationship

from app.core.database import Base


class IndicatorTemplate(Base):
    """Indicator template - 指标模板定义."""
    
    __tablename__ = "indicator_templates"
    
    # Primary key - 指标唯一标识，如 "MA200"
    id = Column(String, primary_key=True, index=True)
    
    # Basic info
    name = Column(String, nullable=False)  # 显示名称，如 "200周均线偏离度"
    description = Column(String, nullable=True)  # 描述
    
    # Indicator type
    indicator_type = Column(String, nullable=False)  # metric/signal/composite
    category = Column(String, nullable=True)  # 分类: trend/momentum/volatility/sentiment
    
    # Implementation
    processor_class = Column(String, nullable=False)  # 处理器类名，如 "indicators.MA200Indicator"
    
    # Default parameters (JSON)
    default_params = Column(JSON, default=dict)
    
    # Output schema
    output_fields = Column(JSON, default=list)  # 输出字段定义
    
    # Grading config (for metrics with levels)
    grading_config = Column(JSON, nullable=True)  # 分档配置
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    indicators = relationship("Indicator", back_populates="template", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<IndicatorTemplate(id='{self.id}', name='{self.name}')>"


class Indicator(Base):
    """Indicator instance - 指标实例（绑定到具体标的）."""
    
    __tablename__ = "indicators"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Foreign keys
    template_id = Column(String, ForeignKey("indicator_templates.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_id = Column(String, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Instance config
    name = Column(String, nullable=False)  # 实例名称，如 "BTC MA200"
    params = Column(JSON, default=dict)  # 实例参数（覆盖模板默认值）
    
    # Status
    is_active = Column(Boolean, default=True)
    last_calculated_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('template_id', 'asset_id', 'name', name='uix_indicator_template_asset_name'),
        Index('idx_indicator_query', 'asset_id', 'template_id'),
    )
    
    # Relationships
    template = relationship("IndicatorTemplate", back_populates="indicators")
    asset = relationship("Asset")
    values = relationship("IndicatorValue", back_populates="indicator", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Indicator(id={self.id}, name='{self.name}', asset='{self.asset_id}')>"


class IndicatorValue(Base):
    """Indicator value - 指标数值历史."""
    
    __tablename__ = "indicator_values"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Foreign key
    indicator_id = Column(Integer, ForeignKey("indicators.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Time
    date = Column(Date, nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False)
    
    # Value
    value = Column(Float, nullable=False)  # 主要数值
    value_text = Column(String, nullable=True)  # 文本值（如 "极度恐惧"）
    
    # Grading
    grade = Column(String, nullable=True)  # 档位，如 "low", "medium", "high"
    grade_label = Column(String, nullable=True)  # 档位标签，如 "极度低估"
    
    # Extra data (JSON)
    extra_data = Column(JSON, default=dict)  # 额外计算数据
    
    # Metadata
    source = Column(String, nullable=True)  # 数据来源
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('indicator_id', 'date', name='uix_indicator_value_date'),
        Index('idx_indicator_value_query', 'indicator_id', 'date'),
    )
    
    # Relationships
    indicator = relationship("Indicator", back_populates="values")
    
    def __repr__(self):
        return f"<IndicatorValue(indicator_id={self.indicator_id}, date='{self.date}', value={self.value})>"
