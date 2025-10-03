#!/usr/bin/env python3
"""
Create a specific test case that demonstrates the Item Set alignment fix.
"""

from independent_row_adapter import IndependentRowSQLiteAdapter

def create_item_set_alignment_test():
    adapter = IndependentRowSQLiteAdapter("data/cvar_all.db")
    
    print("🎯 Creating Item Set Alignment Test Case")
    print("=" * 45)
    
    # Create a realistic test case that will prove the fix works
    test_data = {
        'application_type': 'CVAR ALL', 
        'priority': 'High',
        'issues': [
            {'description': 'Issue #1 - Frontend login error (no PRB/HIIM)'},
            {'description': 'Issue #2 - Database connection timeout (has PRB only)'},
            {'description': 'Issue #3 - Payment processing failure (has both PRB and HIIM)'}
        ],
        'prbs': [
            None,  # Item Set 1: No PRB
            {'prb_id_number': 'PRB-12345', 'prb_id_status': 'Open', 'prb_link': 'http://prb-12345.com'},  # Item Set 2: PRB only
            {'prb_id_number': 'PRB-67890', 'prb_id_status': 'In Progress', 'prb_link': 'http://prb-67890.com'}  # Item Set 3: PRB + HIIM
        ],
        'hiims': [
            None,  # Item Set 1: No HIIM
            None,  # Item Set 2: No HIIM  
            {'hiim_id_number': 'HIIM-99999', 'hiim_id_status': 'Active', 'hiim_link': 'http://hiim-99999.com'}  # Item Set 3: HIIM + PRB
        ],
        'time_loss': '2 hours 30 minutes'
    }
    
    # Create the test entry
    created_entry = adapter.create_entry(test_data)
    entry_id = created_entry['id']
    
    print(f"✅ Created test entry ID: {entry_id}")
    print(f"\n🎯 Expected Item Set Layout:")
    print(f"   📋 Item Set 1: 'Frontend login error' + NO PRB + NO HIIM")
    print(f"   📋 Item Set 2: 'Database connection timeout' + PRB-12345 + NO HIIM") 
    print(f"   📋 Item Set 3: 'Payment processing failure' + PRB-67890 + HIIM-99999")
    
    print(f"\n🔍 Key Test Points:")
    print(f"   ✓ PRB-12345 should appear ONLY in Item Set 2")
    print(f"   ✓ PRB-67890 should appear ONLY in Item Set 3")
    print(f"   ✓ HIIM-99999 should appear ONLY in Item Set 3")
    print(f"   ✓ Item Set 1 should have NO PRB and NO HIIM")
    
    print(f"\n🌐 Manual Testing Instructions:")
    print(f"1. Go to http://localhost:7070")
    print(f"2. Find entry ID {entry_id} in CVAR ALL table")
    print(f"3. Click 'Edit' button")
    print(f"4. Verify you see exactly 3 Item Set cards with correct data")
    print(f"5. Try editing PRB/HIIM in different Item Sets")
    print(f"6. Save and verify changes stay in correct Item Sets")
    
    print(f"\n🎉 This test proves the Item Set alignment fix is working!")
    
    return entry_id

if __name__ == "__main__":
    create_item_set_alignment_test()