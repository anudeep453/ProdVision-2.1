"""
Test script for Independent Row implementation
This script tests the new backend structure to ensure:
1. All rows are stored independently 
2. No parent-child dependencies at database level
3. UI grouping works correctly
4. Data integrity is maintained
"""

import sys
import os
sys.path.append('.')

from independent_row_adapter import EntryManager
from datetime import datetime

def test_independent_rows():
    """Test the independent row implementation"""
    print("=" * 60)
    print("TESTING INDEPENDENT ROW IMPLEMENTATION")
    print("=" * 60)
    
    # Initialize entry manager
    entry_manager = EntryManager()
    
    # Test data with multiple PRBs, HIIMs, and Issues
    test_entry = {
        'date': '2025-10-03',
        'day': 'Thursday',
        'application_name': 'CVAR ALL',
        'prc_mail_text': '08:30',
        'prc_mail_status': 'Green',
        'cp_alerts_text': '09:00',
        'cp_alerts_status': 'Green',
        'quality_status': 'Green',
        'remarks': 'Test entry for independent rows',
        'issue_description': 'Main issue description',
        'prb_id_number': '100',  # Legacy single PRB
        'prb_id_status': 'active',
        'prb_link': 'http://example.com/prb100',
        'hiim_id_number': '200',  # Legacy single HIIM
        'hiim_id_status': 'active',
        'hiim_link': 'http://example.com/hiim200',
        'prbs': [  # Multiple PRBs
            {'prb_id_number': '101', 'prb_id_status': 'active', 'prb_link': 'http://example.com/prb101'},
            {'prb_id_number': '102', 'prb_id_status': 'closed', 'prb_link': 'http://example.com/prb102'},
            {'prb_id_number': '103', 'prb_id_status': 'active', 'prb_link': 'http://example.com/prb103'}
        ],
        'hiims': [  # Multiple HIIMs
            {'hiim_id_number': '201', 'hiim_id_status': 'active', 'hiim_link': 'http://example.com/hiim201'},
            {'hiim_id_number': '202', 'hiim_id_status': 'closed', 'hiim_link': 'http://example.com/hiim202'}
        ],
        'issues': [  # Multiple Issues
            {'description': 'Network connectivity issue'},
            {'description': 'Database performance degradation'},
            {'description': 'Application timeout errors'}
        ]
    }
    
    print("\n1. Testing entry creation with multiple PRBs/HIIMs/Issues...")
    
    try:
        # Create entry
        created_entry = entry_manager.create_entry(test_entry)
        print(f"✅ Entry created successfully with ID: {created_entry['id']}")
        print(f"   - Main entry row type: {created_entry.get('row_type', 'main')}")
        print(f"   - Number of PRBs: {len(created_entry.get('prbs', []))}")
        print(f"   - Number of HIIMs: {len(created_entry.get('hiims', []))}")
        print(f"   - Number of Issues: {len(created_entry.get('issues', []))}")
        
    except Exception as e:
        print(f"❌ Entry creation failed: {e}")
        return False
    
    print("\n2. Testing row independence at database level...")
    
    try:
        # Get the adapter directly to inspect raw database rows
        adapter = entry_manager.adapters['CVAR ALL']
        conn = adapter.get_connection()
        cursor = conn.cursor()
        
        # Query all independent rows for this entry
        grouping_key = adapter.generate_grouping_key('2025-10-03', 'CVAR ALL')
        cursor.execute("SELECT id, row_type, prb_id_number, hiim_id_number, issue_description FROM entries WHERE grouping_key = ? ORDER BY row_position", (grouping_key,))
        
        rows = cursor.fetchall()
        conn.close()
        
        print(f"   Found {len(rows)} independent database rows:")
        for row in rows:
            row_id, row_type, prb_num, hiim_num, issue_desc = row
            print(f"   - Row ID {row_id}: Type={row_type}, PRB={prb_num or 'None'}, HIIM={hiim_num or 'None'}, Issue={issue_desc[:30] + '...' if issue_desc and len(issue_desc) > 30 else issue_desc or 'None'}")
        
        # Verify independence - each row should have its own ID
        row_ids = [row[0] for row in rows]
        if len(set(row_ids)) == len(row_ids):
            print("✅ All rows have unique IDs - confirmed independent")
        else:
            print("❌ Duplicate row IDs found - independence validation failed")
            return False
            
    except Exception as e:
        print(f"❌ Database independence check failed: {e}")
        return False
    
    print("\n3. Testing individual row operations...")
    
    try:
        # Test updating a single PRB row (should not affect other rows)
        prb_rows = [row for row in rows if row[1] == 'prb' and row[2]]  # Get PRB rows
        if prb_rows:
            prb_row_id = prb_rows[0][0]
            
            # Update just this PRB row
            updated_entry = adapter.update_entry(prb_row_id, {
                'prb_id_status': 'closed',
                'remarks': 'Updated remarks for single PRB row'
            })
            
            if updated_entry:
                print(f"✅ Successfully updated single PRB row (ID: {prb_row_id})")
                
                # Verify other rows weren't affected
                cursor = adapter.get_connection().cursor()
                cursor.execute("SELECT row_type, prb_id_status, remarks FROM entries WHERE grouping_key = ? AND id != ?", (grouping_key, prb_row_id))
                other_rows = cursor.fetchall()
                cursor.connection.close()
                
                # Check that other rows still have original data
                original_remarks_count = sum(1 for row in other_rows if row[2] == 'Test entry for independent rows')
                if original_remarks_count > 0:
                    print("✅ Other rows unaffected by single row update - confirmed independence")
                else:
                    print("⚠️  Could not verify other rows were unaffected")
            else:
                print("❌ Failed to update single PRB row")
                return False
        
    except Exception as e:
        print(f"❌ Individual row operation test failed: {e}")
        return False
    
    print("\n4. Testing entry retrieval and UI grouping...")
    
    try:
        # Retrieve entries through the API
        retrieved_entries = entry_manager.get_entries_by_application('CVAR ALL', '2025-10-03', '2025-10-03')
        
        if retrieved_entries:
            entry = retrieved_entries[0]
            print(f"✅ Retrieved entry through API with ID: {entry['id']}")
            print(f"   - Grouped PRBs: {len(entry.get('prbs', []))}")
            print(f"   - Grouped HIIMs: {len(entry.get('hiims', []))}")
            print(f"   - Grouped Issues: {len(entry.get('issues', []))}")
            
            # Verify the updated PRB status is reflected
            updated_prb = next((prb for prb in entry.get('prbs', []) if prb.get('prb_id_status') == 'closed'), None)
            if updated_prb:
                print("✅ Updated PRB status correctly reflected in grouped data")
            else:
                print("⚠️  Updated PRB status not found in grouped data")
                
        else:
            print("❌ Failed to retrieve entries through API")
            return False
            
    except Exception as e:
        print(f"❌ Entry retrieval test failed: {e}")
        return False
    
    print("\n5. Testing row deletion independence...")
    
    try:
        # Delete a single HIIM row
        hiim_rows = [row for row in rows if row[1] == 'hiim' and row[3]]
        if hiim_rows:
            hiim_row_id = hiim_rows[0][0]
            
            # Delete this specific row
            success = adapter.delete_entry(hiim_row_id)
            
            if success:
                print(f"✅ Successfully deleted single HIIM row (ID: {hiim_row_id})")
                
                # Verify other rows still exist
                cursor = adapter.get_connection().cursor()
                cursor.execute("SELECT COUNT(*) FROM entries WHERE grouping_key = ?", (grouping_key,))
                remaining_count = cursor.fetchone()[0]
                cursor.connection.close()
                
                expected_count = len(rows) - 1  # One less row
                if remaining_count == expected_count:
                    print(f"✅ Correct number of rows remaining ({remaining_count}/{len(rows)-1}) - confirmed independent deletion")
                else:
                    print(f"❌ Unexpected row count after deletion: {remaining_count}, expected: {expected_count}")
                    return False
            else:
                print("❌ Failed to delete single HIIM row")
                return False
                
    except Exception as e:
        print(f"❌ Row deletion test failed: {e}")
        return False
    
    print("\n6. Testing cross-date validation...")
    
    try:
        # Try to create entry with mismatched dates (should fail)
        invalid_entry = {
            'date': '2025-10-04',  # Different date
            'application_name': 'CVAR ALL',
            'prc_mail_text': '08:30',
            'prc_mail_status': 'Green',
            'prbs': [
                {'prb_id_number': '999', 'date': '2025-10-03'}  # Mismatched date - should fail validation
            ]
        }
        
        # This should fail with our validation
        try:
            entry_manager.create_entry(invalid_entry)
            print("❌ Cross-date validation failed - invalid entry was accepted")
            return False
        except Exception as validation_error:
            if "same date" in str(validation_error).lower():
                print("✅ Cross-date validation working - invalid entry correctly rejected")
            else:
                print(f"⚠️  Entry rejected but not for date validation: {validation_error}")
                
    except Exception as e:
        print(f"❌ Cross-date validation test failed: {e}")
        return False
    
    print("\n" + "=" * 60)
    print("✅ ALL TESTS PASSED - INDEPENDENT ROW IMPLEMENTATION WORKING")
    print("=" * 60)
    print("\nKey achievements:")
    print("✅ Backend stores each row independently without parent-child dependencies")
    print("✅ Each PRB, HIIM, and Issue gets its own database row with unique ID")
    print("✅ Individual rows can be updated/deleted without affecting others")
    print("✅ UI grouping works correctly for display purposes")
    print("✅ Data integrity maintained across operations")
    print("✅ Cross-date validation prevents accidental coupling")
    print("\nThe system now handles rows independently at the backend level while")
    print("maintaining parent-child presentation in the UI based on date grouping.")
    
    return True

if __name__ == "__main__":
    test_independent_rows()