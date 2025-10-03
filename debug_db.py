#!/usr/bin/env python3
"""
Debug script to see what's actually being stored in the database
"""

import sys
import os
import sqlite3
sys.path.append('.')

from independent_row_adapter import EntryManager

def debug_database_contents():
    """Debug what's actually in the database"""
    print("=" * 60)
    print("DEBUGGING DATABASE CONTENTS")
    print("=" * 60)
    
    # Clean up any existing test data first (more thorough cleanup)
    entry_manager = EntryManager()
    print("Cleaning up existing test data...")
    adapter = entry_manager.adapters['CVAR ALL']
    conn = sqlite3.connect(adapter.local_db_path)
    cursor = conn.cursor()
    
    # Delete all entries with our test date and grouping key
    cursor.execute('DELETE FROM entries WHERE date = ? AND application_name = ?', 
                   ('2025-10-03', 'CVAR ALL'))
    conn.commit()
    conn.close()
    print(f"Deleted entries for test date")
    
    # Create test entry
    test_entry = {
        'date': '2025-10-03',
        'day': 'Thursday',
        'application_name': 'CVAR ALL',
        'prc_mail_text': '08:30',
        'prc_mail_status': 'Green',
        'quality_status': 'Green',
        'prbs': [
            {'prb_id_number': '101', 'prb_id_status': 'active', 'prb_link': 'http://example.com/prb101'},
            {'prb_id_number': '102', 'prb_id_status': 'closed', 'prb_link': 'http://example.com/prb102'}
        ],
        'hiims': [
            {'hiim_id_number': '201', 'hiim_id_status': 'active', 'hiim_link': 'http://example.com/hiim201'}
        ],
        'issues': [
            {'description': 'Test issue 1'}
        ]
    }
    
    print("Creating test entry...")
    created_entry = entry_manager.create_entry(test_entry)
    
    if created_entry:
        print(f"Entry created with ID: {created_entry['id']}")
        
        # Connect directly to the database to see raw entries
        adapter = entry_manager.adapters['CVAR ALL']
        conn = sqlite3.connect(adapter.local_db_path)
        cursor = conn.cursor()
        
        print("\nRAW DATABASE ENTRIES:")
        cursor.execute('SELECT * FROM entries WHERE date = ?', ('2025-10-03',))
        rows = cursor.fetchall()
        
        # Get column names
        columns = [description[0] for description in cursor.description]
        
        for i, row in enumerate(rows, 1):
            entry_dict = dict(zip(columns, row))
            print(f"\nEntry {i}:")
            print(f"  ID: {entry_dict['id']}")
            print(f"  Row Type: {entry_dict['row_type']}")
            print(f"  Grouping Key: {entry_dict['grouping_key']}")
            print(f"  PRB ID: {entry_dict['prb_id_number']}")
            print(f"  PRB Status: {entry_dict['prb_id_status']}")
            print(f"  HIIM ID: {entry_dict['hiim_id_number']}")
            print(f"  HIIM Status: {entry_dict['hiim_id_status']}")
            print(f"  Issue: {entry_dict['issue_description']}")
        
        conn.close()
        
        # Now test retrieval
        print(f"\nRETRIEVED ENTRY (ID {created_entry['id']}):")
        retrieved_entry = entry_manager.get_entry_by_id(created_entry['id'])
        
        if retrieved_entry:
            print(f"Main PRB ID: {retrieved_entry.get('prb_id_number', 'None')}")
            print(f"Main HIIM ID: {retrieved_entry.get('hiim_id_number', 'None')}")
            print(f"Main Issue: {retrieved_entry.get('issue_description', 'None')}")
            print(f"PRBs array: {len(retrieved_entry.get('prbs', []))} items")
            for i, prb in enumerate(retrieved_entry.get('prbs', [])):
                print(f"  PRB {i+1}: {prb}")
            print(f"HIIMs array: {len(retrieved_entry.get('hiims', []))} items")
            for i, hiim in enumerate(retrieved_entry.get('hiims', [])):
                print(f"  HIIM {i+1}: {hiim}")
            print(f"Issues array: {len(retrieved_entry.get('issues', []))} items")
            for i, issue in enumerate(retrieved_entry.get('issues', [])):
                print(f"  Issue {i+1}: {issue}")
        
        # Clean up
        entry_manager.delete_entry(created_entry['id'])
    else:
        print("Failed to create entry")

if __name__ == '__main__':
    debug_database_contents()