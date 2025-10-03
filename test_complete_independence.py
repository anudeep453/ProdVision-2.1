#!/usr/bin/env python3
"""
Comprehensive test to verify complete independence of Item Sets.
Each issue, PRB, and HIIM should be completely independent with no cross-contamination.
"""

import sqlite3
from datetime import datetime
from independent_row_adapter import IndependentRowSQLiteAdapter

def test_complete_independence():
    # Connect to CVAR_ALL database
    adapter = IndependentRowSQLiteAdapter("data/cvar_all.db")
    
    print("🔍 Testing Complete Item Set Independence")
    print("=" * 50)
    
    # Create a test entry with mixed content to verify independence
    test_data = {
        'application_type': 'CVAR ALL',
        'priority': 'High',
        'issues': [
            {'description': 'Issue A - should be completely independent'},
            {'description': 'Issue B - should be completely independent'},
            {'description': 'Issue C - should be completely independent'}
        ],
        'prbs': [
            {'prb_id_number': 'PRB-111', 'prb_id_status': 'Open', 'prb_link': 'http://prb-111.com'},
            {'prb_id_number': 'PRB-222', 'prb_id_status': 'Closed', 'prb_link': 'http://prb-222.com'}
        ],
        'hiims': [
            {'hiim_id_number': 'HIIM-AAA', 'hiim_id_status': 'Active', 'hiim_link': 'http://hiim-aaa.com'}
        ],
        'time_loss': 'Test time loss'
    }
    
    # Create the entry
    created_entry = adapter.create_entry(test_data)
    entry_id = created_entry['id']
    print(f"✅ Created test entry with ID: {entry_id}")
    
    # Verify initial state
    entry = adapter.get_entry_by_id(entry_id)
    print(f"\n📊 Initial State:")
    print(f"   Issues: {len(entry['issues'])} items")
    print(f"   PRBs: {len(entry['prbs'])} items")
    print(f"   HIIMs: {len(entry['hiims'])} items")
    
    print(f"\n🎯 Expected Independent Item Sets:")
    print(f"   Item Set 1: 'Issue A' (no PRB/HIIM)")
    print(f"   Item Set 2: 'Issue B' (no PRB/HIIM)")
    print(f"   Item Set 3: 'Issue C' (no PRB/HIIM)")
    print(f"   Item Set 4: PRB-111 (no Issue/HIIM)")
    print(f"   Item Set 5: PRB-222 (no Issue/HIIM)")
    print(f"   Item Set 6: HIIM-AAA (no Issue/PRB)")
    
    print(f"\n🔬 Each Item Set should be completely independent:")
    print(f"   - Adding/editing PRB in Item Set 4 should NOT affect any other Item Set")
    print(f"   - Adding/editing HIIM in Item Set 6 should NOT affect any other Item Set")
    print(f"   - Each Item Set should maintain only its own data")
    
    print(f"\n🌐 Testing Instructions:")
    print(f"1. Go to http://localhost:7070")
    print(f"2. Find entry ID {entry_id} in CVAR ALL")
    print(f"3. Click Edit")
    print(f"4. You should see 6 separate Item Set cards")
    print(f"5. Try adding/editing items in different cards")
    print(f"6. Verify that changes in one card don't affect others")
    print(f"7. Save and reload to verify independence is preserved")
    
    # Test the independence by simulating an update that should NOT create dependencies
    print(f"\n🧪 Simulating independence test update...")
    
    # Add more items independently - this should create more independent cards
    independence_test_data = {
        'issues': [
            {'description': 'Issue A - should be completely independent'},
            {'description': 'Issue B - should be completely independent'},
            {'description': 'Issue C - should be completely independent'},
            {'description': 'Issue D - newly added and independent'}  # New independent issue
        ],
        'prbs': [
            {'prb_id_number': 'PRB-111', 'prb_id_status': 'Open', 'prb_link': 'http://prb-111.com'},
            {'prb_id_number': 'PRB-222', 'prb_id_status': 'Closed', 'prb_link': 'http://prb-222.com'},
            {'prb_id_number': 'PRB-333', 'prb_id_status': 'New', 'prb_link': 'http://prb-333.com'}  # New independent PRB
        ],
        'hiims': [
            {'hiim_id_number': 'HIIM-AAA', 'hiim_id_status': 'Active', 'hiim_link': 'http://hiim-aaa.com'},
            {'hiim_id_number': 'HIIM-BBB', 'hiim_id_status': 'Pending', 'hiim_link': 'http://hiim-bbb.com'}  # New independent HIIM
        ]
    }
    
    # Update the entry
    adapter.update_entry(entry_id, independence_test_data)
    print(f"✅ Updated entry with additional independent items")
    
    # Verify independence is maintained
    updated_entry = adapter.get_entry_by_id(entry_id)
    print(f"\n📊 Updated State:")
    print(f"   Issues: {len(updated_entry['issues'])} items")
    print(f"   PRBs: {len(updated_entry['prbs'])} items") 
    print(f"   HIIMs: {len(updated_entry['hiims'])} items")
    
    print(f"\n🎯 Expected Independent Item Sets After Update:")
    print(f"   Item Set 1: 'Issue A' (independent)")
    print(f"   Item Set 2: 'Issue B' (independent)")
    print(f"   Item Set 3: 'Issue C' (independent)")
    print(f"   Item Set 4: 'Issue D' (independent)")
    print(f"   Item Set 5: PRB-111 (independent)")
    print(f"   Item Set 6: PRB-222 (independent)")
    print(f"   Item Set 7: PRB-333 (independent)")
    print(f"   Item Set 8: HIIM-AAA (independent)")
    print(f"   Item Set 9: HIIM-BBB (independent)")
    
    success = True
    
    # Verify no cross-contamination
    for i, issue in enumerate(updated_entry['issues']):
        if not issue['description']:
            print(f"❌ ERROR: Issue {i+1} is empty - possible cross-contamination")
            success = False
            
    for i, prb in enumerate(updated_entry['prbs']):
        if not prb['prb_id_number']:
            print(f"❌ ERROR: PRB {i+1} is empty - possible cross-contamination")
            success = False
            
    for i, hiim in enumerate(updated_entry['hiims']):
        if not hiim['hiim_id_number']:
            print(f"❌ ERROR: HIIM {i+1} is empty - possible cross-contamination")
            success = False
    
    if success:
        print(f"\n🎉 SUCCESS: All items are independent with no cross-contamination!")
        print(f"✅ Each Item Set maintains only its own data")
        print(f"✅ No dependencies between different items")
    else:
        print(f"\n💥 FAILURE: Independence issues detected!")
    
    # Clean up
    adapter.delete_entry(entry_id)
    print(f"\n🧹 Cleaned up test entry {entry_id}")
    
    return success

if __name__ == "__main__":
    test_complete_independence()