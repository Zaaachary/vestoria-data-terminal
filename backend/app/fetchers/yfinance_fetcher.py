"""Yahoo Finance fetcher."""
import yfinance as yf
import pandas as pd
from datetime import date
from typing import List, Optional

from app.fetchers.base import BaseFetcher, AssetSearchResult
from app.fetchers.registry import register_fetcher


@register_fetcher
class YahooFinanceFetcher(BaseFetcher):
    """Yahoo Finance data fetcher."""
    
    name = "yfinance"
    display_name = "Yahoo Finance"
    supported_asset_types = ["crypto", "stock", "etf", "commodity", "index"]
    
    async def search(self, keyword: str, limit: int = 20) -> List[AssetSearchResult]:
        """Search assets from Yahoo Finance."""
        # Yahoo Finance doesn't have a direct search API in yfinance
        # We'll use a simple ticker lookup
        try:
            ticker = yf.Ticker(keyword.upper())
            info = ticker.info
            
            if info and 'symbol' in info:
                return [AssetSearchResult(
                    symbol=info.get('symbol', keyword.upper()),
                    name=info.get('longName', info.get('shortName', keyword)),
                    asset_type=self._map_asset_type(info.get('quoteType')),
                    exchange=info.get('exchange'),
                    source_symbol=info.get('symbol', keyword.upper()),
                    extra={
                        'sector': info.get('sector'),
                        'industry': info.get('industry'),
                        'market_cap': info.get('marketCap')
                    }
                )]
        except Exception as e:
            print(f"Search error: {e}")
        
        return []
    
    async def fetch_prices(
        self, 
        source_symbol: str, 
        start: date, 
        end: date,
        interval: str = "1d"
    ) -> List[dict]:
        """Fetch price data from Yahoo Finance."""
        # Map interval
        interval_map = {
            "1d": "1d",
            "1w": "1wk",
            "1m": "1mo"
        }
        yf_interval = interval_map.get(interval, "1d")
        
        # Download data
        ticker = yf.Ticker(source_symbol)
        df = ticker.history(start=start, end=end, interval=yf_interval)
        
        if df.empty:
            return []
        
        # Convert to list of dicts
        prices = []
        for idx, row in df.iterrows():
            prices.append({
                "timestamp": idx.to_pydatetime(),
                "date": idx.date(),
                "open": float(row["Open"]) if pd.notna(row["Open"]) else None,
                "high": float(row["High"]) if pd.notna(row["High"]) else None,
                "low": float(row["Low"]) if pd.notna(row["Low"]) else None,
                "close": float(row["Close"]) if pd.notna(row["Close"]) else 0.0,
                "volume": float(row["Volume"]) if pd.notna(row["Volume"]) else None,
            })
        
        return prices
    
    def _map_asset_type(self, quote_type: Optional[str]) -> str:
        """Map Yahoo quote type to our asset type."""
        mapping = {
            "EQUITY": "stock",
            "ETF": "etf",
            "CRYPTOCURRENCY": "crypto",
            "CURRENCY": "crypto",
            "INDEX": "index",
            "FUTURE": "commodity"
        }
        return mapping.get(quote_type, "stock")
