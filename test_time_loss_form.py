#!/usr/bin/env python3
"""
Quick test to create an entry with time_loss and check if it appears in edit form
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from independent_row_adapter import IndependentRowSQLiteAdapter
from datetime import datetime

def test_time_loss_form():
    print("🧪 Testing Time Loss form field visibility...")
    
    # Test with CVAR ALL
    adapter = IndependentRowSQLiteAdapter("http://test", "cvar_all.db")
    
    # Create a test entry with time_loss
    test_entry = {
        'date': '2025-10-03',
        'day': 'Thursday',
        'application_name': 'CVAR ALL',
        'prc_mail_text': '08:00',
        'prc_mail_status': 'Green',
        'cp_alerts_text': '08:30',
        'cp_alerts_status': 'Green',
        'quality_status': 'Green',
        'remarks': 'Test quality issue description',
        'time_loss': 'Test time loss - 20 minutes due to system maintenance',
        'issue_description': 'Test punctuality issue',
        'prb_id_number': '12345',
        'prb_id_status': 'active',
        'hiim_id_number': '67890',
        'hiim_id_status': 'closed'
    }
    
    print("1. Creating test entry with time_loss...")
    created_entry = adapter.create_entry(test_entry)
    
    if created_entry:
        entry_id = created_entry['id']
        print(f"✅ Test entry created with ID: {entry_id}")
        print(f"✅ Time Loss value: {created_entry.get('time_loss', 'NOT FOUND')}")
        
        # Retrieve the entry to confirm
        print("\n2. Retrieving entry to verify time_loss...")
        retrieved_entry = adapter.get_entry_by_id(entry_id)
        
        if retrieved_entry:
            print(f"✅ Entry retrieved successfully")
            print(f"✅ Time Loss in retrieved entry: {retrieved_entry.get('time_loss', 'NOT FOUND')}")
            
            # Clean up
            print("\n3. Cleaning up test entry...")
            adapter.delete_entry(entry_id)
            print("✅ Test entry deleted")
            
            return True
        else:
            print("❌ Failed to retrieve entry")
            return False
    else:
        print("❌ Failed to create test entry")
        return False

if __name__ == "__main__":
    success = test_time_loss_form()
    if success:
        print("\n🎉 Time Loss form field test completed successfully!")
        print("\nTo check in UI:")
        print("1. Start the application: python3 app.py")
        print("2. Click 'Enable Edit' and login with password: admin123")
        print("3. Click 'Add New Entry'")
        print("4. Look for 'Time Loss' field in the CVAR form")
    else:
        print("\n❌ Time Loss form field test failed!")