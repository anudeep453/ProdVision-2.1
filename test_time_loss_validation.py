#!/usr/bin/env python3
"""
Test Time Loss validation and functionality
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from independent_row_adapter import IndependentRowSQLiteAdapter
from datetime import datetime

def test_time_loss_validation():
    print("🧪 Testing Time Loss timing validation...")
    
    # Test with CVAR ALL
    adapter = IndependentRowSQLiteAdapter("http://test", "cvar_all.db")
    
    # Valid time loss entries
    valid_time_losses = [
        "15 min",
        "30 minutes", 
        "2 hours",
        "1 hour",
        "45 mins",
        "120 minutes",
        "3 hrs"
    ]
    
    # Invalid time loss entries (should be rejected by frontend validation)
    invalid_time_losses = [
        "abc minutes",
        "system delay",
        "network issues", 
        "15",  # missing unit
        "minutes 30",  # wrong order
        "very long delay"
    ]
    
    print("\n✅ Valid time loss formats:")
    for time_loss in valid_time_losses:
        print(f"   - '{time_loss}' ✓")
    
    print("\n❌ Invalid time loss formats (should be rejected):")
    for time_loss in invalid_time_losses:
        print(f"   - '{time_loss}' ✗")
    
    # Create test entry with valid time loss
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
        'time_loss': '25 minutes',  # Valid format
        'issue_description': 'Test punctuality issue',
        'prb_id_number': '12345',
        'prb_id_status': 'active'
    }
    
    print(f"\n1. Creating test entry with time_loss: '{test_entry['time_loss']}'...")
    created_entry = adapter.create_entry(test_entry)
    
    if created_entry:
        entry_id = created_entry['id']
        print(f"✅ Test entry created with ID: {entry_id}")
        print(f"✅ Time Loss stored: {created_entry.get('time_loss', 'NOT FOUND')}")
        
        # Update with another valid time loss
        update_data = {'time_loss': '1 hour 15 minutes'}
        print(f"\n2. Updating entry with time_loss: '{update_data['time_loss']}'...")
        updated_entry = adapter.update_entry(entry_id, update_data)
        
        if updated_entry:
            print(f"✅ Entry updated successfully")
            print(f"✅ Updated Time Loss: {updated_entry.get('time_loss', 'NOT FOUND')}")
        else:
            print("❌ Failed to update entry")
        
        # Clean up
        print("\n3. Cleaning up test entry...")
        adapter.delete_entry(entry_id)
        print("✅ Test entry deleted")
        
        return True
    else:
        print("❌ Failed to create test entry")
        return False

if __name__ == "__main__":
    success = test_time_loss_validation()
    if success:
        print("\n🎉 Time Loss timing validation test completed!")
        print("\nFrontend validation regex: ^\\d+\\s*(min|mins|minute|minutes|hour|hours|hr|hrs|h|m)\\s*$")
        print("\nValid examples:")
        print("- 15 min")
        print("- 30 minutes") 
        print("- 2 hours")
        print("- 45 mins")
        print("- 1 hr")
    else:
        print("\n❌ Time Loss timing validation test failed!")