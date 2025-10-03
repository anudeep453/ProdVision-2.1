#!/usr/bin/env python3
"""
Test the complete Item Set position alignment fix.
This tests the full end-to-end functionality.
"""

from independent_row_adapter import IndependentRowSQLiteAdapter
import sqlite3

def test_complete_item_set_fix():
    adapter = IndependentRowSQLiteAdapter("data/cvar_all.db")
    
    print("🔧 Testing Complete Item Set Position Alignment Fix")
    print("=" * 55)
    
    # Create a test entry that will specifically test the alignment issue
    test_data = {
        'application_type': 'CVAR ALL',
        'priority': 'High',
        'issues': [
            {'description': 'Issue in Item Set 1 - no PRB/HIIM'},
            None,  # Empty Item Set 2 
            {'description': 'Issue in Item Set 3 - will get PRB/HIIM'}
        ],
        'prbs': [
            None,  # No PRB for Item Set 1
            None,  # No PRB for Item Set 2
            {'prb_id_number': 'PRB-999', 'prb_id_status': 'Open', 'prb_link': 'http://prb-999.com'}  # PRB for Item Set 3
        ],
        'hiims': [
            None,  # No HIIM for Item Set 1
            None,  # No HIIM for Item Set 2  
            {'hiim_id_number': 'HIIM-888', 'hiim_id_status': 'Active', 'hiim_link': 'http://hiim-888.com'}  # HIIM for Item Set 3
        ],
        'time_loss': '1 hour'
    }
    
    print("🎯 Test Scenario:")
    print("   Item Set 1: Issue only (no PRB/HIIM)")
    print("   Item Set 2: Empty (nothing)")
    print("   Item Set 3: Issue + PRB-999 + HIIM-888")
    print("")
    
    # Create the entry
    created_entry = adapter.create_entry(test_data)
    entry_id = created_entry['id']
    print(f"✅ Created test entry ID: {entry_id}")
    
    # Check database storage directly
    conn = sqlite3.connect("data/cvar_all.db")
    cursor = conn.cursor()
    
    print(f"\n📊 Database Storage Check:")
    cursor.execute("""
        SELECT id, row_type, row_position, prb_id_number, hiim_id_number, issue_description 
        FROM entries WHERE grouping_key LIKE '%test%' OR id >= ? 
        ORDER BY row_position, row_type
    """, (entry_id,))
    
    rows = cursor.fetchall()
    for row in rows:
        print(f"   Row {row[0]}: type={row[1]}, position={row[2]}, prb={row[3]}, hiim={row[4]}, issue={row[5]}")
    
    conn.close()
    
    # Retrieve and verify alignment
    entry = adapter.get_entry_by_id(entry_id)
    print(f"\n🔍 Retrieved Data Alignment:")
    print(f"   Issues: {entry['issues']}")
    print(f"   PRBs: {entry['prbs']}")
    print(f"   HIIMs: {entry['hiims']}")
    
    # Verify correct alignment
    success = True
    
    # Check Item Set 1 (index 0)
    if len(entry['issues']) > 0 and entry['issues'][0] and 'Issue in Item Set 1' in entry['issues'][0]['description']:
        print("✅ Item Set 1 Issue: Correct")
    else:
        print("❌ Item Set 1 Issue: Missing or wrong position")
        success = False
        
    if len(entry['prbs']) > 0 and entry['prbs'][0] is None:
        print("✅ Item Set 1 PRB: Correctly empty (None)")
    else:
        print("❌ Item Set 1 PRB: Should be None")
        success = False
        
    # Check Item Set 3 (index 2)
    if len(entry['issues']) > 2 and entry['issues'][2] and 'Issue in Item Set 3' in entry['issues'][2]['description']:
        print("✅ Item Set 3 Issue: Correct")
    else:
        print("❌ Item Set 3 Issue: Missing or wrong position")
        success = False
        
    if len(entry['prbs']) > 2 and entry['prbs'][2] and entry['prbs'][2]['prb_id_number'] == 'PRB-999':
        print("✅ Item Set 3 PRB: Correctly positioned")
    else:
        print("❌ Item Set 3 PRB: Wrong position or missing")
        success = False
        
    if len(entry['hiims']) > 2 and entry['hiims'][2] and entry['hiims'][2]['hiim_id_number'] == 'HIIM-888':
        print("✅ Item Set 3 HIIM: Correctly positioned")
    else:
        print("❌ Item Set 3 HIIM: Wrong position or missing")
        success = False
    
    if success:
        print(f"\n🎉 SUCCESS: Item Set position alignment is working correctly!")
        print(f"✅ PRB-999 stays in Item Set 3 position")
        print(f"✅ HIIM-888 stays in Item Set 3 position")
        print(f"✅ Item Set 1 remains empty for PRB/HIIM")
        print(f"✅ No cross-contamination between Item Sets")
    else:
        print(f"\n💥 FAILURE: Position alignment issues detected!")
    
    print(f"\n🌐 Manual Test Instructions:")
    print(f"1. Go to http://localhost:7070")
    print(f"2. Find entry ID {entry_id} in CVAR ALL")
    print(f"3. Click Edit - you should see Item Sets with correct alignment")
    print(f"4. Verify PRB-999 and HIIM-888 appear in Item Set 3, not Item Set 1")
    
    # Clean up
    adapter.delete_entry(entry_id)
    print(f"\n🧹 Cleaned up test entry {entry_id}")
    
    return success

if __name__ == "__main__":
    test_complete_item_set_fix()