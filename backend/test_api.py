#!/usr/bin/env python3
"""Test script for data terminal."""
import asyncio
import requests
import sys

BASE_URL = "http://localhost:8000"


def test_health():
    """Test health endpoint."""
    print("Testing health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code == 200


def test_create_asset():
    """Test creating an asset."""
    print("\nTesting create asset...")
    
    # Create BTC asset
    data = {
        "id": "BTC-USD",
        "symbol": "BTC",
        "name": "Bitcoin USD",
        "asset_type": "crypto",
        "data_source": "yfinance",
        "source_symbol": "BTC-USD"
    }
    
    response = requests.post(f"{BASE_URL}/api/v1/assets", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    # Also create SPY
    data2 = {
        "id": "SPY",
        "symbol": "SPY",
        "name": "SPDR S&P 500 ETF Trust",
        "asset_type": "etf",
        "data_source": "yfinance",
        "source_symbol": "SPY"
    }
    
    response2 = requests.post(f"{BASE_URL}/api/v1/assets", json=data2)
    print(f"Status: {response2.status_code}")
    print(f"Response: {response2.json()}")
    
    return response.status_code in [200, 400]  # 400 means already exists


def test_list_assets():
    """Test listing assets."""
    print("\nTesting list assets...")
    response = requests.get(f"{BASE_URL}/api/v1/assets")
    print(f"Status: {response.status_code}")
    print(f"Count: {len(response.json())}")
    return response.status_code == 200


def test_update_prices():
    """Test updating prices."""
    print("\nTesting update prices...")
    
    # Update BTC
    response = requests.post(f"{BASE_URL}/api/v1/update?asset_id=BTC-USD")
    print(f"BTC Update - Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    return response.status_code == 200


def test_get_prices():
    """Test getting prices."""
    print("\nTesting get prices...")
    
    response = requests.get(f"{BASE_URL}/api/v1/prices?asset_id=BTC-USD&limit=10")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        prices = response.json()
        print(f"Got {len(prices)} price records")
        if prices:
            print(f"Latest: {prices[-1]}")
        return len(prices) > 0
    
    return False


def main():
    """Run all tests."""
    print("=" * 50)
    print("Data Terminal API Test")
    print("=" * 50)
    
    tests = [
        ("Health Check", test_health),
        ("Create Asset", test_create_asset),
        ("List Assets", test_list_assets),
        ("Update Prices", test_update_prices),
        ("Get Prices", test_get_prices),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"Error in {name}: {e}")
            results.append((name, False))
    
    print("\n" + "=" * 50)
    print("Test Results:")
    print("=" * 50)
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")
    
    passed = sum(1 for _, r in results if r)
    print(f"\nTotal: {passed}/{len(results)} passed")


if __name__ == "__main__":
    main()
