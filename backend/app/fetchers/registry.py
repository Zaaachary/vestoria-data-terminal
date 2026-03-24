"""Fetcher registry."""
from typing import Dict, Type, Optional
from app.fetchers.base import BaseFetcher

# Global registry
_FETCHER_REGISTRY: Dict[str, Type[BaseFetcher]] = {}


def register_fetcher(fetcher_class: Type[BaseFetcher]) -> Type[BaseFetcher]:
    """Register a fetcher class."""
    _FETCHER_REGISTRY[fetcher_class.name] = fetcher_class
    return fetcher_class


def get_fetcher(name: str) -> Optional[Type[BaseFetcher]]:
    """Get fetcher class by name."""
    return _FETCHER_REGISTRY.get(name)


def list_fetchers() -> Dict[str, Type[BaseFetcher]]:
    """List all registered fetchers."""
    return _FETCHER_REGISTRY.copy()
