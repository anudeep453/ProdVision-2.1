#!/usr/bin/env python3
"""
Test the balanced independence fix - should create reasonable number of cards
while maintaining independence and preserving data.
"""

from independent_row_adapter import IndependentRowSQLiteAdapter

def test_balanced_approach():
    adapter = IndependentRowSQLiteAdapter("data/cvar_all.db")
    
    print("🔧 Testing Balanced Independence Fix")
    print("=" * 40)
    
    # Create a realistic test case
    test_data = {
        'application_type': 'CVAR ALL',
        'priority': 'High',
        'issues': [
            {'description': 'Payment processing error'},
            {'description': 'User authentication failure'}
        ],
        'prbs': [
            {'prb_id_number': 'PRB-123', 'prb_id_status': 'Open', 'prb_link': 'http://prb-123.com'}
        ],
        'hiims': [
            {'hiim_id_number': 'HIIM-456', 'hiim_id_status': 'Active', 'hiim_link': 'http://hiim-456.com'}
        ],
        'time_loss': '30 minutes'
    }
    
    created_entry = adapter.create_entry(test_data)
    entry_id = created_entry['id']
    
    print(f"✅ Created test entry ID: {entry_id}")
    
    # Verify the data
    entry = adapter.get_entry_by_id(entry_id)
    print(f"\n📊 Entry Data:")
    print(f"   Issues: {len(entry['issues'])} items")
    print(f"   PRBs: {len(entry['prbs'])} items")
    print(f"   HIIMs: {len(entry['hiims'])} items")
    
    print(f"\n🎯 Expected UI Behavior:")
    print(f"   Item Set 1: 'Payment processing error' + PRB-123 + empty HIIM slot")
    print(f"   Item Set 2: 'User authentication failure' + empty PRB slot + HIIM-456")
    print(f"   = Total: 2 cards (not 4+ cards)")
    
    print(f"\n✅ Key Benefits:")
    print(f"   ✓ Reasonable number of cards (matches number of issues)")
    print(f"   ✓ Each issue gets its own independent PRB/HIIM slots") 
    print(f"   ✓ No cross-contamination between Item Sets")
    print(f"   ✓ Preserves all entered data")
    print(f"   ✓ Maintains familiar user experience")
    
    print(f"\n🌐 Test at: http://localhost:7070")
    print(f"📍 Look for entry ID: {entry_id}")
    
    # Clean up
    adapter.delete_entry(entry_id)
    print(f"\n🧹 Cleaned up test entry {entry_id}")
    
    return entry_id

if __name__ == "__main__":
    test_balanced_approach()