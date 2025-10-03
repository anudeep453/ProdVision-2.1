#!/usr/bin/env python3
"""
Test script for row-level PRB/HIIM filtering functionality
"""

import requests
import json
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://127.0.0.1:7070"
API_BASE = f"{BASE_URL}/api"

def test_row_level_filtering():
    """Test the new row-level filtering functionality"""
    print("🧪 Testing Row-Level Filtering for PRB Only Filter")
    print("=" * 60)
    
    # Test 1: Get normal entries (grouped)
    print("\n1. Testing normal entry retrieval (should be grouped)...")
    response = requests.get(f"{API_BASE}/entries?application=CVAR ALL")
    
    if response.status_code == 200:
        entries = response.json()
        print(f"   ✅ Normal entries retrieved: {len(entries)} grouped entries")
        
        # Show structure of first entry
        if entries:
            entry = entries[0]
            print(f"   📊 First entry structure:")
            print(f"       - Date: {entry.get('date')}")
            print(f"       - Application: {entry.get('application_name')}")
            print(f"       - Row Type: {entry.get('row_type', 'N/A')}")
            print(f"       - PRBs array: {len(entry.get('prbs', []))} items")
            print(f"       - HIIMs array: {len(entry.get('hiims', []))} items")
            print(f"       - Issues array: {len(entry.get('issues', []))} items")
    else:
        print(f"   ❌ Failed to get normal entries: {response.status_code}")
        return
    
    # Test 2: Get PRB-only entries (individual rows)
    print("\n2. Testing PRB-only filtering (should return individual rows)...")
    response = requests.get(f"{API_BASE}/entries?application=CVAR ALL&prb_only=true")
    
    if response.status_code == 200:
        prb_entries = response.json()
        print(f"   ✅ PRB-only entries retrieved: {len(prb_entries)} individual rows")
        
        # Analyze what we got
        row_types = {}
        prb_count = 0
        
        for entry in prb_entries:
            row_type = entry.get('row_type', 'unknown')
            row_types[row_type] = row_types.get(row_type, 0) + 1
            
            # Count actual PRBs
            if (entry.get('prb_id_number') and entry.get('prb_id_number').strip()) or \
               (isinstance(entry.get('prbs'), list) and len(entry.get('prbs')) > 0):
                prb_count += 1
        
        print(f"   📊 Row type breakdown:")
        for row_type, count in row_types.items():
            print(f"       - {row_type}: {count} rows")
        print(f"   📊 Rows with actual PRBs: {prb_count}/{len(prb_entries)}")
        
        # Verify that all returned rows actually have PRBs
        rows_without_prbs = []
        for i, entry in enumerate(prb_entries):
            has_prb = False
            
            # Check legacy PRB field
            if entry.get('prb_id_number') and entry.get('prb_id_number').strip():
                has_prb = True
            
            # Check PRBs array
            if isinstance(entry.get('prbs'), list) and len(entry.get('prbs')) > 0:
                for prb in entry.get('prbs'):
                    if prb and prb.get('prb_id_number'):
                        has_prb = True
                        break
            
            if not has_prb:
                rows_without_prbs.append(i)
        
        if rows_without_prbs:
            print(f"   ⚠️  Found {len(rows_without_prbs)} rows without PRBs (unexpected)")
            for i in rows_without_prbs[:3]:  # Show first 3 problematic rows
                entry = prb_entries[i]
                print(f"       Row {i}: {entry.get('date')} - {entry.get('row_type')} - PRB: '{entry.get('prb_id_number')}' - PRBs: {entry.get('prbs')}")
        else:
            print(f"   ✅ All {len(prb_entries)} rows contain PRBs (as expected)")
    else:
        print(f"   ❌ Failed to get PRB-only entries: {response.status_code}")
        return
    
    # Test 3: Get HIIM-only entries (individual rows)
    print("\n3. Testing HIIM-only filtering (should return individual rows)...")
    response = requests.get(f"{API_BASE}/entries?application=CVAR ALL&hiim_only=true")
    
    if response.status_code == 200:
        hiim_entries = response.json()
        print(f"   ✅ HIIM-only entries retrieved: {len(hiim_entries)} individual rows")
        
        # Verify that all returned rows actually have HIIMs
        rows_without_hiims = []
        for i, entry in enumerate(hiim_entries):
            has_hiim = False
            
            # Check legacy HIIM field
            if entry.get('hiim_id_number') and entry.get('hiim_id_number').strip():
                has_hiim = True
            
            # Check HIIMs array
            if isinstance(entry.get('hiims'), list) and len(entry.get('hiims')) > 0:
                for hiim in entry.get('hiims'):
                    if hiim and hiim.get('hiim_id_number'):
                        has_hiim = True
                        break
            
            if not has_hiim:
                rows_without_hiims.append(i)
        
        if rows_without_hiims:
            print(f"   ⚠️  Found {len(rows_without_hiims)} rows without HIIMs (unexpected)")
        else:
            print(f"   ✅ All {len(hiim_entries)} rows contain HIIMs (as expected)")
    else:
        print(f"   ❌ Failed to get HIIM-only entries: {response.status_code}")
    
    # Test 4: Compare counts
    print("\n4. Comparing filtering approaches...")
    normal_prb_count = 0
    for entry in entries:
        if (entry.get('prb_id_number') and entry.get('prb_id_number').strip()) or \
           (isinstance(entry.get('prbs'), list) and len(entry.get('prbs')) > 0):
            normal_prb_count += 1
    
    print(f"   📊 Normal filtering: {normal_prb_count} grouped entries with PRBs")
    print(f"   📊 Row-level filtering: {len(prb_entries)} individual rows with PRBs")
    print(f"   📝 Row-level filtering should show MORE results because it shows")
    print(f"       individual PRB rows instead of grouped entries.")
    
    print("\n" + "=" * 60)
    print("🎯 Test completed!")
    
    if len(prb_entries) >= normal_prb_count:
        print("✅ Row-level filtering appears to be working correctly!")
        print("   (More individual rows than grouped entries, as expected)")
    else:
        print("⚠️  Row-level filtering may have issues.")
        print("   (Expected more individual rows than grouped entries)")

if __name__ == "__main__":
    try:
        test_row_level_filtering()
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to the application. Make sure it's running on http://127.0.0.1:7070")
    except Exception as e:
        print(f"❌ Test failed with error: {e}")