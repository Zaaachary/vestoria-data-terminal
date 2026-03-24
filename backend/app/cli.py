#!/usr/bin/env python3
"""
Data Terminal CLI - Management commands for data operations.

Usage:
    python -m app.cli fill-history [--start DATE] [--end DATE] [--assets ID,ID,...]
    python -m app.cli update-prices [--assets ID,ID,...] [--lookback DAYS]
    python -m app.cli recalc [--indicator ID] [--start DATE] [--end DATE]
    python -m app.cli status
"""
import sys
import argparse
from datetime import date, datetime, timedelta
from typing import List

sys.path.insert(0, '/home/linuxuser/.openclaw/workspace-vestoria/projects/data-terminal/backend')

from app.core.database import SessionLocal
from app.models.asset import Asset
from app.models.indicator import Indicator
from app.models.price_data import PriceData
from app.services.backfill import backfill_all_assets, incremental_update
from app.services.price_scheduler import run_price_update
from app.services.indicator_scheduler import calculate_all_indicators, calculate_indicator_latest


def cmd_fill_history(args):
    """Fill historical price data."""
    start = args.start or (date.today() - timedelta(days=365))
    end = args.end or date.today()
    asset_ids = args.assets.split(",") if args.assets else None
    
    print(f"Filling historical data from {start} to {end}")
    if asset_ids:
        print(f"Assets: {', '.join(asset_ids)}")
    else:
        print("Assets: all")
    print("-" * 50)
    
    results = backfill_all_assets(start=start, end=end, asset_ids=asset_ids)
    
    print("\nSummary:")
    for r in results:
        status = "✓" if r["status"] == "success" else "✗"
        print(f"  {status} {r['asset_id']}: {r.get('records', 0)} records "
              f"({r.get('inserted', 0)} new, {r.get('updated', 0)} updated)")


def cmd_update_prices(args):
    """Update latest prices (incremental)."""
    asset_ids = args.assets.split(",") if args.assets else None
    lookback = args.lookback or 5
    
    print(f"Updating prices (lookback: {lookback} days)")
    if asset_ids:
        print(f"Assets: {', '.join(asset_ids)}")
    else:
        print("Assets: all")
    print("-" * 50)
    
    results = run_price_update(asset_ids=asset_ids, lookback_days=lookback)
    
    print("\nSummary:")
    for r in results:
        status = "✓" if r["status"] == "success" else "✗"
        print(f"  {status} {r['asset_id']}: {r.get('inserted', 0)} new, {r.get('updated', 0)} updated")


def cmd_recalc(args):
    """Recalculate indicator values."""
    indicator_id = args.indicator
    start = args.start
    end = args.end
    
    if indicator_id:
        print(f"Recalculating indicator {indicator_id}...")
        result = calculate_indicator_latest(indicator_id)
        
        if result["status"] == "success":
            print(f"  ✓ {result['indicator_name']}")
            print(f"    Date: {result.get('date')}")
            print(f"    Value: {result.get('value')}")
            if result.get('value_text'):
                print(f"    Text: {result.get('value_text')}")
            if result.get('grade_label'):
                print(f"    Grade: {result.get('grade_label')}")
        else:
            print(f"  ✗ Error: {result.get('message')}")
    else:
        print("Recalculating all indicators...")
        if start or end:
            print(f"Date range: {start or 'auto'} to {end or 'auto'}")
        print("-" * 50)
        
        results = calculate_all_indicators(start=start, end=end)
        
        print("\nSummary:")
        for r in results:
            status = "✓" if r["status"] == "success" else "✗"
            name = r.get("indicator_name", f"ID:{r['indicator_id']}")
            print(f"  {status} {name}: {r.get('count', 0)} values")


def cmd_status(args):
    """Show system status."""
    db = SessionLocal()
    try:
        # Assets
        assets = db.query(Asset).all()
        print(f"Assets: {len(assets)}")
        for a in assets:
            price_count = db.query(PriceData).filter(PriceData.asset_id == a.id).count()
            latest = db.query(PriceData).filter(
                PriceData.asset_id == a.id
            ).order_by(PriceData.date.desc()).first()
            print(f"  {a.id}: {price_count} prices", end="")
            if latest:
                print(f", latest: {latest.date} ({latest.close:.2f})")
            else:
                print()
        
        print()
        
        # Indicators
        indicators = db.query(Indicator).all()
        print(f"Indicators: {len(indicators)}")
        for i in indicators:
            print(f"  {i.id}. {i.name} ({i.template_id})")
            print(f"     Asset: {i.asset_id}, Active: {i.is_active}")
            if i.last_calculated_at:
                print(f"     Last calculated: {i.last_calculated_at.strftime('%Y-%m-%d %H:%M')}")
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(
        prog="data-terminal",
        description="Data Terminal CLI - Manage price data and indicators"
    )
    subparsers = parser.add_subparsers(dest="command", help="Commands")
    
    # fill-history command
    fill_parser = subparsers.add_parser(
        "fill-history",
        help="Fill historical price data"
    )
    fill_parser.add_argument("--start", type=date.fromisoformat, help="Start date (YYYY-MM-DD)")
    fill_parser.add_argument("--end", type=date.fromisoformat, help="End date (YYYY-MM-DD)")
    fill_parser.add_argument("--assets", help="Comma-separated asset IDs")
    
    # update-prices command
    update_parser = subparsers.add_parser(
        "update-prices",
        help="Update latest prices (incremental)"
    )
    update_parser.add_argument("--assets", help="Comma-separated asset IDs")
    update_parser.add_argument("--lookback", type=int, default=5, help="Lookback days (default: 5)")
    
    # recalc command
    recalc_parser = subparsers.add_parser(
        "recalc",
        help="Recalculate indicator values"
    )
    recalc_parser.add_argument("--indicator", type=int, help="Specific indicator ID")
    recalc_parser.add_argument("--start", type=date.fromisoformat, help="Start date")
    recalc_parser.add_argument("--end", type=date.fromisoformat, help="End date")
    
    # status command
    subparsers.add_parser("status", help="Show system status")
    
    args = parser.parse_args()
    
    if args.command == "fill-history":
        cmd_fill_history(args)
    elif args.command == "update-prices":
        cmd_update_prices(args)
    elif args.command == "recalc":
        cmd_recalc(args)
    elif args.command == "status":
        cmd_status(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
