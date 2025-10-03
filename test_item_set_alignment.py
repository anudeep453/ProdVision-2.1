#!/usr/bin/env python3
"""
Test script to verify Item Set alignment - ensure PRB/HIIM added to Item Set 2 
doesn't get saved under Item Set 1.
"""

import sqlite3
import json
from independent_row_adapter import IndependentRowSQLiteAdapter

def test_item_set_alignment():
    # Connect to CVAR_ALL database
    adapter = IndependentRowSQLiteAdapter("data/cvar_all.db")
    
    print("Testing Item Set alignment...")
    
    # Create a test entry with 2 issues but no PRBs/HIIMs initially
    test_data = {
        'application_type': 'CVAR ALL',
        'priority': 'High',
        'issues': [
            {'description': 'First issue for Item Set 1'},
            {'description': 'Second issue for Item Set 2'}
        ],
        'prbs': [],
        'hiims': [],
        'time_loss': 'Minor delay'
    }
    
    # Insert the entry
    created_entry = adapter.create_entry(test_data)
    entry_id = created_entry['id']
    print(f"Created test entry with ID: {entry_id}")
    
    # Verify initial state
    entry = adapter.get_entry_by_id(entry_id)
    print("\nInitial entry:")
    print(f"Issues: {entry['issues']}")
    print(f"PRBs: {entry['prbs']}")
    print(f"HIIMs: {entry['hiims']}")
    
    # Now simulate adding a PRB to Item Set 2 (index 1)
    # The UI should send data like this when user adds PRB to 2nd card
    update_data = {
        'issues': [
            {'description': 'First issue for Item Set 1'},
            {'description': 'Second issue for Item Set 2'}
        ],
        'prbs': [
            None,  # Empty PRB for Item Set 1
            {'prb_id_number': 'PRB-12345', 'prb_id_status': 'Open', 'prb_link': 'http://example.com/prb-12345'}
        ],
        'hiims': [
            None,  # Empty HIIM for Item Set 1  
            {'hiim_id_number': 'HIIM-67890', 'hiim_id_status': 'In Progress', 'hiim_link': 'http://example.com/hiim-67890'}
        ]
    }
    
    # Update the entry
    adapter.update_entry(entry_id, update_data)
    print("\nAfter adding PRB/HIIM to Item Set 2:")
    
    # Verify the update
    updated_entry = adapter.get_entry_by_id(entry_id)
    print(f"Issues: {updated_entry['issues']}")
    print(f"PRBs: {updated_entry['prbs']}")
    print(f"HIIMs: {updated_entry['hiims']}")
    
    # Check alignment
    success = True
    if len(updated_entry['prbs']) >= 2:
        if updated_entry['prbs'][0] is not None:
            print("❌ ERROR: PRB was incorrectly added to Item Set 1 (index 0)")
            success = False
        if updated_entry['prbs'][1] is None:
            print("❌ ERROR: PRB was not saved to Item Set 2 (index 1)")
            success = False
        else:
            print("✅ PRB correctly saved to Item Set 2 (index 1)")
    
    if len(updated_entry['hiims']) >= 2:
        if updated_entry['hiims'][0] is not None:
            print("❌ ERROR: HIIM was incorrectly added to Item Set 1 (index 0)")
            success = False
        if updated_entry['hiims'][1] is None:
            print("❌ ERROR: HIIM was not saved to Item Set 2 (index 1)")
            success = False
        else:
            print("✅ HIIM correctly saved to Item Set 2 (index 1)")
    
    if success:
        print("\n🎉 SUCCESS: Item Set alignment is working correctly!")
    else:
        print("\n💥 FAILURE: Item Set alignment issue still exists!")
    
    # Clean up
    adapter.delete_entry(entry_id)
    print(f"\nCleaned up test entry {entry_id}")
    
    return success

if __name__ == "__main__":
    test_item_set_alignment()