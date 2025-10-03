#!/usr/bin/env python3
"""
Create a specific test entry to verify the Item Set alignment fix.
This creates an entry with 2 issues but no PRBs/HIIMs initially.
"""

import sqlite3
import json
from independent_row_adapter import IndependentRowSQLiteAdapter

def create_alignment_test_entry():
    # Connect to CVAR_ALL database
    adapter = IndependentRowSQLiteAdapter("data/cvar_all.db")
    
    print("Creating Item Set alignment test entry...")
    
    # Create a test entry with 2 issues but no PRBs/HIIMs initially
    test_data = {
        'application_type': 'CVAR ALL',
        'priority': 'High',
        'issues': [
            {'description': 'First issue in Item Set 1 - should remain empty for PRB/HIIM'},
            {'description': 'Second issue in Item Set 2 - should get PRB/HIIM added'}
        ],
        'prbs': [],
        'hiims': [],
        'time_loss': 'No time loss yet',
        'status': 'Active'
    }
    
    # Insert the entry
    created_entry = adapter.create_entry(test_data)
    entry_id = created_entry['id']
    print(f"Created test entry with ID: {entry_id}")
    
    # Verify the entry
    entry = adapter.get_entry_by_id(entry_id)
    print("\nTest entry created:")
    print(f"ID: {entry_id}")
    print(f"Priority: {entry.get('priority', 'N/A')}")
    print(f"Issues: {len(entry['issues'])} items")
    for i, issue in enumerate(entry['issues']):
        print(f"  Item Set {i+1}: {issue['description']}")
    print(f"PRBs: {len(entry['prbs'])} items")
    print(f"HIIMs: {len(entry['hiims'])} items")
    
    print(f"\n🎯 Go to http://localhost:5000 and:")
    print(f"1. Find the entry with ID {entry_id}")
    print(f"2. Click to edit it")
    print(f"3. You should see 2 Item Set cards")
    print(f"4. Add a PRB and HIIM to 'Item Set 2' only")
    print(f"5. Save and verify that PRB/HIIM appear under Item Set 2, not Item Set 1")
    
    return entry_id

if __name__ == "__main__":
    create_alignment_test_entry()