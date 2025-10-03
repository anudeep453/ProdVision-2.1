#!/usr/bin/env python3
"""
Create a final test entry to demonstrate complete independence in the web UI.
"""

from independent_row_adapter import IndependentRowSQLiteAdapter

def create_final_independence_test():
    adapter = IndependentRowSQLiteAdapter("data/cvar_all.db")
    
    print("🎯 Creating Final Independence Test Entry")
    print("=" * 45)
    
    # Create entry with multiple independent items
    test_data = {
        'application_type': 'CVAR ALL',
        'priority': 'Medium',
        'issues': [
            {'description': 'Critical bug in payment system'},
            {'description': 'UI responsiveness issue on mobile'}
        ],
        'prbs': [
            {'prb_id_number': 'PRB-9999', 'prb_id_status': 'Open', 'prb_link': 'http://prb-9999.com'}
        ],
        'hiims': [
            {'hiim_id_number': 'HIIM-7777', 'hiim_id_status': 'In Progress', 'hiim_link': 'http://hiim-7777.com'}
        ],
        'time_loss': '45 minutes'
    }
    
    created_entry = adapter.create_entry(test_data)
    entry_id = created_entry['id']
    
    print(f"✅ Created test entry ID: {entry_id}")
    print(f"🌐 Go to: http://localhost:7070")
    print(f"📍 Application: CVAR ALL")
    print(f"🔍 Entry ID: {entry_id}")
    
    print(f"\n🎯 Expected Independent Item Sets:")
    print(f"   Item Set 1: 'Critical bug in payment system' (Issue only)")
    print(f"   Item Set 2: 'UI responsiveness issue on mobile' (Issue only)")
    print(f"   Item Set 3: PRB-9999 (PRB only)")
    print(f"   Item Set 4: HIIM-7777 (HIIM only)")
    
    print(f"\n🧪 Test Independence:")
    print(f"   ✓ Each Item Set should be completely separate")
    print(f"   ✓ Adding/editing in one Item Set should NOT affect others")
    print(f"   ✓ You can add PRB/HIIM to any Issue without affecting other Issues")
    print(f"   ✓ Each card maintains only its own data")
    
    return entry_id

if __name__ == "__main__":
    create_final_independence_test()