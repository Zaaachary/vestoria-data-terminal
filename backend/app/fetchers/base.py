"""Fetcher base class."""
from abc import ABC, abstractmethod
from datetime import date
from typing import List, Optional
from dataclasses import dataclass


@dataclass
class AssetSearchResult:
    """Asset search result."""
    symbol: str
    name: str
    asset_type: str
    exchange: Optional[str]
    source_symbol: str
    extra: Optional[dict] = None


class BaseFetcher(ABC):
    """Base class for data fetchers."""
    
    name: str = ""  # Fetcher identifier
    display_name: str = ""  # Human readable name
    supported_asset_types: List[str] = []  # e.g., ["crypto", "stock"]
    
    @abstractmethod
    async def search(self, keyword: str, limit: int = 20) -> List[AssetSearchResult]:
        """Search assets from data source."""
        pass
    
    @abstractmethod
    async def fetch_prices(
        self, 
        source_symbol: str, 
        start: date, 
        end: date,
        interval: str = "1d"
    ) -> List[dict]:
        """
        Fetch price data.
        
        Returns list of dict with keys:
        - timestamp: datetime
        - date: date
        - open: float
        - high: float
        - low: float
        - close: float
        - volume: float
        """
        pass
    
    async def fetch_latest(self, source_symbol: str) -> Optional[dict]:
        """Fetch latest price. Default implementation fetches last 5 days."""
        from datetime import datetime, timedelta
        end = datetime.now().date()
        start = end - timedelta(days=5)
        prices = await self.fetch_prices(source_symbol, start, end)
        return prices[-1] if prices else None
