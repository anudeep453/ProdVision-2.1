#!/usr/bin/env python3
"""
Direct test of the new row-level filtering functionality
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from independent_row_adapter import EntryManager

def test_row_level_filtering():
    """Test the new row-level filtering functionality"""
    print("🧪 Testing Row-Level Filtering Implementation")
    print("=" * 60)
    
    try:
        em = EntryManager()
        
        # Test 1: Normal grouped entries
        print("\n1. Testing normal grouped entries...")
        normal_entries = em.get_entries_by_application('CVAR ALL')
        print(f"   ✅ Retrieved {len(normal_entries)} grouped entries")
        
        # Analyze normal entries
        normal_with_prbs = 0
        total_prbs_in_normal = 0
        
        for entry in normal_entries:
            has_prb = False
            prb_count = 0
            
            # Check legacy PRB field
            if entry.get('prb_id_number') and entry.get('prb_id_number').strip():
                has_prb = True
                prb_count += 1
            
            # Check PRBs array
            if isinstance(entry.get('prbs'), list):
                for prb in entry.get('prbs'):
                    if prb and prb.get('prb_id_number'):
                        has_prb = True
                        prb_count += 1
            
            if has_prb:
                normal_with_prbs += 1
            total_prbs_in_normal += prb_count
        
        print(f"   📊 Grouped entries with PRBs: {normal_with_prbs}/{len(normal_entries)}")
        print(f"   📊 Total PRBs across all entries: {total_prbs_in_normal}")
        
        # Test 2: Individual PRB rows
        print("\n2. Testing individual PRB rows...")
        prb_rows = em.get_individual_rows_by_application('CVAR ALL', row_type_filter='prb')
        print(f"   ✅ Retrieved {len(prb_rows)} individual PRB rows")
        
        # Analyze PRB rows
        row_types = {}
        actual_prb_count = 0
        
        for row in prb_rows:
            row_type = row.get('row_type', 'unknown')
            row_types[row_type] = row_types.get(row_type, 0) + 1
            
            # Verify each row actually has a PRB
            has_prb = False
            if row.get('prb_id_number') and row.get('prb_id_number').strip():
                has_prb = True
            if isinstance(row.get('prbs'), list) and len(row.get('prbs')) > 0:
                for prb in row.get('prbs'):
                    if prb and prb.get('prb_id_number'):
                        has_prb = True
                        break
            
            if has_prb:
                actual_prb_count += 1
        
        print(f"   📊 Row type distribution: {row_types}")
        print(f"   📊 Rows with actual PRBs: {actual_prb_count}/{len(prb_rows)}")
        
        # Show sample PRB row
        if prb_rows:
            sample = prb_rows[0]
            print(f"   📋 Sample PRB row:")
            print(f"       Date: {sample.get('date')}")
            print(f"       Row Type: {sample.get('row_type')}")
            print(f"       PRB ID: {sample.get('prb_id_number', 'N/A')}")
            print(f"       PRBs array length: {len(sample.get('prbs', []))}")
        
        # Test 3: Individual HIIM rows
        print("\n3. Testing individual HIIM rows...")
        hiim_rows = em.get_individual_rows_by_application('CVAR ALL', row_type_filter='hiim')
        print(f"   ✅ Retrieved {len(hiim_rows)} individual HIIM rows")
        
        # Test 4: All individual rows (no filter)
        print("\n4. Testing all individual rows...")
        all_individual = em.get_individual_rows_by_application('CVAR ALL')
        print(f"   ✅ Retrieved {len(all_individual)} total individual rows")
        
        # Analyze all individual rows
        all_row_types = {}
        for row in all_individual:
            row_type = row.get('row_type', 'unknown')
            all_row_types[row_type] = all_row_types.get(row_type, 0) + 1
        
        print(f"   📊 All row types: {all_row_types}")
        
        # Test 5: Validation
        print("\n5. Validation...")
        
        # Check that PRB filter returns only rows with PRBs
        prb_filter_valid = actual_prb_count == len(prb_rows)
        print(f"   {'✅' if prb_filter_valid else '❌'} PRB filter accuracy: {actual_prb_count}/{len(prb_rows)} rows have PRBs")
        
        # Check that we get more individual PRB rows than grouped entries with PRBs
        more_individual = len(prb_rows) >= normal_with_prbs
        print(f"   {'✅' if more_individual else '❌'} Individual rows ≥ grouped entries: {len(prb_rows)} ≥ {normal_with_prbs}")
        
        # Check that individual PRB count matches or exceeds total PRBs in grouped entries
        prb_count_logical = len(prb_rows) >= total_prbs_in_normal
        print(f"   {'✅' if prb_count_logical else '❌'} Individual PRB rows ≥ total PRBs: {len(prb_rows)} ≥ {total_prbs_in_normal}")
        
        print("\n" + "=" * 60)
        if prb_filter_valid and more_individual:
            print("🎯 ✅ Row-level filtering is working correctly!")
            print("   - PRB filter returns only rows with PRBs")
            print("   - Individual row count ≥ grouped entry count")
            print("   - Filter successfully isolates PRB-containing rows")
        else:
            print("🎯 ⚠️  Row-level filtering needs attention:")
            if not prb_filter_valid:
                print("   - Some returned rows don't contain PRBs")
            if not more_individual:
                print("   - Individual row count < grouped entry count")
        
        return prb_filter_valid and more_individual
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_row_level_filtering()
    sys.exit(0 if success else 1)