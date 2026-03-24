"""Indicator processor base class."""
from abc import ABC, abstractmethod
from datetime import date, datetime
from typing import List, Optional, Dict, Any
from dataclasses import dataclass


@dataclass
class IndicatorResult:
    """Indicator calculation result."""
    date: date
    timestamp: datetime
    value: float
    value_text: Optional[str] = None
    grade: Optional[str] = None
    grade_label: Optional[str] = None
    extra_data: Optional[Dict[str, Any]] = None


class BaseIndicatorProcessor(ABC):
    """Base class for indicator processors."""
    
    # Processor metadata
    name: str = ""  # 处理器标识
    display_name: str = ""  # 显示名称
    description: str = ""  # 描述
    
    # Default parameters
    default_params: Dict[str, Any] = {}
    
    # Output fields definition
    output_fields = [
        {"name": "value", "type": "float", "description": "主要数值"},
        {"name": "value_text", "type": "string", "description": "文本描述", "optional": True},
        {"name": "grade", "type": "string", "description": "档位", "optional": True},
        {"name": "grade_label", "type": "string", "description": "档位标签", "optional": True},
    ]
    
    # Grading configuration
    grading_config: Optional[Dict[str, Any]] = None
    
    def __init__(self, params: Optional[Dict[str, Any]] = None):
        """Initialize processor with parameters."""
        self.params = {**self.default_params, **(params or {})}
    
    @abstractmethod
    async def calculate(
        self, 
        asset_id: str,
        start: date,
        end: date
    ) -> List[IndicatorResult]:
        """
        Calculate indicator values for given date range.
        
        Args:
            asset_id: 标的ID
            start: 开始日期
            end: 结束日期
            
        Returns:
            List of IndicatorResult
        """
        pass
    
    async def calculate_latest(self, asset_id: str) -> Optional[IndicatorResult]:
        """
        Calculate latest indicator value.
        
        Default implementation calculates last 30 days and returns the latest.
        """
        from datetime import timedelta
        end = datetime.now().date()
        start = end - timedelta(days=30)
        results = await self.calculate(asset_id, start, end)
        return results[-1] if results else None
    
    def apply_grading(self, value: float) -> Dict[str, Optional[str]]:
        """
        Apply grading to a value.
        
        Returns dict with keys: grade, grade_label
        """
        if not self.grading_config:
            return {"grade": None, "grade_label": None}
        
        grades = self.grading_config.get("grades", [])
        for grade_def in grades:
            min_val = grade_def.get("min", float('-inf'))
            max_val = grade_def.get("max", float('inf'))
            if min_val <= value < max_val:
                return {
                    "grade": grade_def["grade"],
                    "grade_label": grade_def.get("label")
                }
        
        return {"grade": None, "grade_label": None}
    
    def get_output_schema(self) -> List[Dict[str, Any]]:
        """Get output field schema."""
        return self.output_fields
    
    def get_param_schema(self) -> List[Dict[str, Any]]:
        """Get parameter schema."""
        return [
            {
                "name": name,
                "type": type(value).__name__,
                "default": value,
                "description": getattr(self, "param_descriptions", {}).get(name, "")
            }
            for name, value in self.default_params.items()
        ]
