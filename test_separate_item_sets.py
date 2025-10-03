#!/usr/bin/env python3
"""
Test the updated dialog population to see separate Item Sets
"""

import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from independent_row_adapter import EntryManager

def test_separate_item_sets():
    """Test if dialog shows separate Item Set cards"""
    
    print("🧪 Testing Separate Item Set Display")
    print("=" * 45)
    
    entry_manager = EntryManager()
    
    # Get the existing test entry
    print("🔍 Looking for existing test entry...")
    
    # Check if there's an entry from today
    adapter = entry_manager.adapters['CVAR ALL']
    conn = adapter.get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM entries WHERE date = ? AND row_type = 'main' LIMIT 1", ('2025-10-03',))
    result = cursor.fetchone()
    conn.close()
    
    if not result:
        print("❌ No test entry found. Run create_test_entry.py first.")
        return
    
    entry_id = result[0]
    print(f"✅ Found test entry with ID: {entry_id}")
    
    # Retrieve the entry
    retrieved = entry_manager.get_entry_by_id(entry_id, 'CVAR ALL')
    
    if not retrieved:
        print("❌ Failed to retrieve entry")
        return
    
    print(f"\n📊 Entry data:")
    print(f"  Date: {retrieved['date']}")
    print(f"  Issues: {len(retrieved.get('issues', []))}")
    print(f"  PRBs: {len(retrieved.get('prbs', []))}")
    print(f"  HIIMs: {len(retrieved.get('hiims', []))}")
    
    print(f"\n🎯 Expected dialog structure with separate Item Sets:")
    
    card_num = 1
    
    # Each issue gets its own card
    for i, issue in enumerate(retrieved.get('issues', []), 1):
        description = issue.get('description') if isinstance(issue, dict) else issue
        print(f"  Item Set {card_num}: Issue only")
        print(f"    Issue: {description}")
        print(f"    PRB: (empty)")
        print(f"    HIIM: (empty)")
        if card_num == 1:
            print(f"    Time Loss: {retrieved.get('time_loss', '')}")
        print()
        card_num += 1
    
    # Each PRB gets its own card
    for i, prb in enumerate(retrieved.get('prbs', []), 1):
        print(f"  Item Set {card_num}: PRB only")
        print(f"    Issue: (empty)")
        print(f"    PRB: {prb.get('prb_id_number')} ({prb.get('prb_id_status')})")
        print(f"    HIIM: (empty)")
        if card_num == 1:
            print(f"    Time Loss: {retrieved.get('time_loss', '')}")
        print()
        card_num += 1
    
    # Each HIIM gets its own card
    for i, hiim in enumerate(retrieved.get('hiims', []), 1):
        print(f"  Item Set {card_num}: HIIM only")
        print(f"    Issue: (empty)")
        print(f"    PRB: (empty)")
        print(f"    HIIM: {hiim.get('hiim_id_number')} ({hiim.get('hiim_id_status')})")
        if card_num == 1:
            print(f"    Time Loss: {retrieved.get('time_loss', '')}")
        print()
        card_num += 1
    
    total_cards = len(retrieved.get('issues', [])) + len(retrieved.get('prbs', [])) + len(retrieved.get('hiims', []))
    print(f"📋 Total expected cards: {total_cards}")
    print(f"💡 Each item (issue, PRB, or HIIM) gets its own separate 'Item Set' card")
    print(f"🔄 This prevents cross-contamination between different types of data")
    
    print(f"\n📝 To see this in action:")
    print(f"  1. Start the application: python3 app.py")
    print(f"  2. Navigate to CVAR ALL section")
    print(f"  3. Click Edit on the {retrieved['date']} entry")
    print(f"  4. You should see {total_cards} separate 'Item Set' cards")

if __name__ == "__main__":
    test_separate_item_sets()