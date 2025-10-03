#!/usr/bin/env python3
"""
Test script to verify Time Loss column functionality
"""

import sqlite3
from independent_row_adapter import IndependentRowSQLiteAdapter
import json

def test_time_loss_functionality():
    """Test that Time Loss column is working correctly"""
    
    print("🧪 Testing Time Loss column functionality...")
    
    # Test 1: Check database schema
    print("\n1. Checking database schema...")
    
    # Check CVAR ALL database
    conn = sqlite3.connect('./data/cvar_all.db')
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(entries)")
    columns = [col[1] for col in cursor.fetchall()]
    conn.close()
    
    if 'time_loss' in columns:
        print("✅ time_loss column exists in cvar_all.db")
    else:
        print("❌ time_loss column missing in cvar_all.db")
        return False
    
    # Check CVAR NYQ database
    conn = sqlite3.connect('./data/cvar_nyq.db')
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(entries)")
    columns = [col[1] for col in cursor.fetchall()]
    conn.close()
    
    if 'time_loss' in columns:
        print("✅ time_loss column exists in cvar_nyq.db")
    else:
        print("❌ time_loss column missing in cvar_nyq.db")
        return False
    
    # Test 2: Test creating entry with time_loss
    print("\n2. Testing entry creation with time_loss...")
    
    # Initialize adapter for CVAR ALL
    adapter = IndependentRowSQLiteAdapter("http://dummy", "cvar_all.db")
    
    # Test entry data with time_loss
    test_entry = {
        'date': '2025-10-03',
        'day': 'Thursday',
        'application_name': 'CVAR ALL',
        'prc_mail_text': '08:00',
        'prc_mail_status': 'Green',
        'cp_alerts_text': '08:30',
        'cp_alerts_status': 'Green',
        'quality_status': 'Green',
        'remarks': 'Test quality issue',
        'time_loss': 'Test time loss data - 15 minutes due to system delay',
        'issue_description': 'Test issue',
        'prb_id_number': '12345',
        'prb_id_status': 'Active',
        'hiim_id_number': '67890',
        'hiim_id_status': 'Closed'
    }
    
    # Create entry
    created_entry = adapter.create_entry(test_entry)
    
    if created_entry and 'time_loss' in created_entry:
        print(f"✅ Entry created with time_loss: {created_entry['time_loss']}")
    else:
        print("❌ Failed to create entry with time_loss")
        return False
    
    # Test 3: Test retrieving entry with time_loss
    print("\n3. Testing entry retrieval with time_loss...")
    
    entry_id = created_entry['id']
    retrieved_entry = adapter.get_entry_by_id(entry_id)
    
    if retrieved_entry and retrieved_entry.get('time_loss') == test_entry['time_loss']:
        print(f"✅ Entry retrieved with correct time_loss: {retrieved_entry['time_loss']}")
    else:
        print(f"❌ Entry retrieval failed or time_loss mismatch. Got: {retrieved_entry.get('time_loss') if retrieved_entry else 'None'}")
        return False
    
    # Test 4: Test updating entry with time_loss
    print("\n4. Testing entry update with time_loss...")
    
    updated_data = {
        'time_loss': 'Updated time loss - 30 minutes due to network issues'
    }
    
    updated_entry = adapter.update_entry(entry_id, updated_data)
    
    if updated_entry and updated_entry.get('time_loss') == updated_data['time_loss']:
        print(f"✅ Entry updated with new time_loss: {updated_entry['time_loss']}")
    else:
        print(f"❌ Entry update failed or time_loss not updated. Got: {updated_entry.get('time_loss') if updated_entry else 'None'}")
        return False
    
    # Test 5: Clean up
    print("\n5. Cleaning up test data...")
    
    success = adapter.delete_entry(entry_id)
    if success:
        print("✅ Test entry deleted successfully")
    else:
        print("❌ Failed to delete test entry")
        return False
    
    print("\n🎉 All Time Loss functionality tests passed!")
    return True

if __name__ == "__main__":
    try:
        success = test_time_loss_functionality()
        if success:
            print("\n✅ Time Loss column implementation is working correctly!")
            exit(0)
        else:
            print("\n❌ Time Loss column implementation has issues!")
            exit(1)
    except Exception as e:
        print(f"\n❌ Test failed with exception: {str(e)}")
        import traceback
        traceback.print_exc()
        exit(1)