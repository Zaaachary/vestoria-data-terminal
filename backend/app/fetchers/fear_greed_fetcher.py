"""BTC Fear & Greed Index fetcher."""
from datetime import date, datetime
from typing import List, Optional
import requests

from app.fetchers.base import BaseIndicatorFetcher, IndicatorDataPoint


class FearGreedFetcher(BaseIndicatorFetcher):
    """
    Fetcher for BTC Fear & Greed Index from alternative.me.
    
    API: https://api.alternative.me/fng/
    """
    
    name = "fear_greed"
    display_name = "BTC Fear & Greed"
    indicator_type = "fear_greed"
    
    def __init__(self, api_url: str = "https://api.alternative.me/fng/"):
        self.api_url = api_url
    
    def _get_grade(self, value: float) -> tuple:
        """Convert value to grade and label."""
        if value < 25:
            return 1, "极度恐惧"
        elif value < 50:
            return 2, "恐惧"
        elif value < 55:
            return 3, "中性"
        elif value < 75:
            return 4, "贪婪"
        else:
            return 5, "极度贪婪"
    
    def _get_chinese_label(self, classification: str) -> str:
        """Convert English classification to Chinese."""
        mapping = {
            "Extreme Fear": "极度恐惧",
            "Fear": "恐惧",
            "Neutral": "中性",
            "Greed": "贪婪",
            "Extreme Greed": "极度贪婪",
        }
        return mapping.get(classification, classification)
    
    async def fetch_history(
        self, 
        start: date, 
        end: date,
        limit: int = 1000
    ) -> List[IndicatorDataPoint]:
        """
        Fetch historical fear & greed data.
        
        Args:
            start: Start date
            end: End date
            limit: Maximum records to fetch (API limit is 1000)
        """
        try:
            response = requests.get(
                self.api_url,
                params={
                    "limit": min(limit, 1000),
                    "format": "json"
                },
                timeout=30
            )
            response.raise_for_status()
            data = response.json()
        except Exception as e:
            print(f"Error fetching fear & greed history: {e}")
            return []
        
        if "data" not in data:
            return []
        
        results = []
        for item in data["data"]:
            try:
                timestamp = datetime.fromtimestamp(int(item["timestamp"]))
                item_date = timestamp.date()
                
                # Filter by date range
                if item_date < start or item_date > end:
                    continue
                
                value = float(item["value"])
                classification = item.get("value_classification", "")
                
                grade, grade_label = self._get_grade(value)
                value_text = self._get_chinese_label(classification)
                
                results.append(IndicatorDataPoint(
                    date=item_date,
                    timestamp=timestamp,
                    value=value,
                    value_text=value_text,
                    grade=grade,
                    grade_label=grade_label,
                    extra_data={
                        "classification": classification,
                        "source": "alternative.me"
                    }
                ))
            except (KeyError, ValueError) as e:
                print(f"Error parsing item: {e}")
                continue
        
        # Sort by date ascending
        results.sort(key=lambda x: x.date)
        return results
    
    async def fetch_latest(self) -> Optional[IndicatorDataPoint]:
        """Fetch latest fear & greed value."""
        try:
            response = requests.get(
                self.api_url,
                params={"limit": 1, "format": "json"},
                timeout=30
            )
            response.raise_for_status()
            data = response.json()
        except Exception as e:
            print(f"Error fetching latest fear & greed: {e}")
            return None
        
        if not data.get("data"):
            return None
        
        item = data["data"][0]
        try:
            timestamp = datetime.fromtimestamp(int(item["timestamp"]))
            value = float(item["value"])
            classification = item.get("value_classification", "")
            
            grade, grade_label = self._get_grade(value)
            value_text = self._get_chinese_label(classification)
            
            return IndicatorDataPoint(
                date=timestamp.date(),
                timestamp=timestamp,
                value=value,
                value_text=value_text,
                grade=grade,
                grade_label=grade_label,
                extra_data={
                    "classification": classification,
                    "source": "alternative.me"
                }
            )
        except (KeyError, ValueError) as e:
            print(f"Error parsing latest item: {e}")
            return None


# Factory function
def create_fear_greed_fetcher() -> FearGreedFetcher:
    """Create a fear & greed fetcher instance."""
    return FearGreedFetcher()
