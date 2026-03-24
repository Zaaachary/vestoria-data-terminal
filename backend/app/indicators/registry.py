"""Indicator processor registry."""
from typing import Dict, Type, Optional


from app.indicators.base import BaseIndicatorProcessor

# Global registry
_PROCESSOR_REGISTRY: Dict[str, Type[BaseIndicatorProcessor]] = {}


def register_processor(processor_class: Type[BaseIndicatorProcessor]) -> Type[BaseIndicatorProcessor]:
    """Register an indicator processor class."""
    _PROCESSOR_REGISTRY[processor_class.name] = processor_class
    return processor_class


def get_processor(name: str) -> Optional[Type[BaseIndicatorProcessor]]:
    """Get processor class by name."""
    return _PROCESSOR_REGISTRY.get(name)


def list_processors() -> Dict[str, Type[BaseIndicatorProcessor]]:
    """List all registered processors."""
    return _PROCESSOR_REGISTRY.copy()


def create_processor(name: str, params: Optional[dict] = None) -> Optional[BaseIndicatorProcessor]:
    """Create a processor instance by name."""
    processor_class = get_processor(name)
    if processor_class:
        return processor_class(params)
    return None
