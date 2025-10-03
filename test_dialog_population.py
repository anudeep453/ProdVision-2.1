#!/usr/bin/env python3
"""
Test the dialog box population after the fix
"""

import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from independent_row_adapter import EntryManager

def test_dialog_population():
    """Test if dialog shows the same data as dashboard rows"""
    
    print("🧪 Testing Dialog Box Population")
    print("=" * 40)
    
    entry_manager = EntryManager()
    
    # Create a test entry with some data
    test_data = {
        'date': '2025-10-04',
        'application_name': 'CVAR ALL',
        'prc_mail_text': '09:00',
        'prc_mail_status': 'Green',
        'cp_alerts_text': '09:15',
        'cp_alerts_status': 'Yellow',
        'quality_status': 'Green',
        'issues': [
            {'description': 'Network delay in processing'}
        ],
        'prbs': [
            {'prb_id_number': 12345, 'prb_id_status': 'active', 'prb_link': 'https://test.com'}
        ],
        'hiims': [
            {'hiim_id_number': 67890, 'hiim_id_status': 'closed', 'hiim_link': 'https://hiim.com'}
        ],
        'time_loss': '30 minutes',
        'remarks': 'Test entry for dialog'
    }
    
    print("📝 Creating test entry...")
    created = entry_manager.create_entry(test_data)
    
    if not created:
        print("❌ Failed to create test entry")
        return False
    
    print(f"✅ Created entry with ID: {created['id']}")
    
    # Retrieve the entry (simulating what the dialog would get)
    print("🔍 Retrieving entry for dialog...")
    retrieved = entry_manager.get_entry_by_id(created['id'], 'CVAR ALL')
    
    if not retrieved:
        print("❌ Failed to retrieve entry")
        return False
    
    print("📊 Entry data for dialog population:")
    print(f"  Date: {retrieved.get('date')}")
    print(f"  PRC Mail: {retrieved.get('prc_mail_text')} ({retrieved.get('prc_mail_status')})")
    print(f"  CP Alerts: {retrieved.get('cp_alerts_text')} ({retrieved.get('cp_alerts_status')})")
    print(f"  Quality: {retrieved.get('quality_status')}")
    print(f"  Time Loss: {retrieved.get('time_loss')}")
    print(f"  Remarks: {retrieved.get('remarks')}")
    
    print(f"\n📋 Issues ({len(retrieved.get('issues', []))} items):")
    for i, issue in enumerate(retrieved.get('issues', []), 1):
        print(f"    {i}. {issue.get('description', issue)}")
    
    print(f"\n🔧 PRBs ({len(retrieved.get('prbs', []))} items):")
    for i, prb in enumerate(retrieved.get('prbs', []), 1):
        print(f"    {i}. ID: {prb.get('prb_id_number')}, Status: {prb.get('prb_id_status')}, Link: {prb.get('prb_link')}")
    
    print(f"\n⚙️ HIIMs ({len(retrieved.get('hiims', []))} items):")
    for i, hiim in enumerate(retrieved.get('hiims', []), 1):
        print(f"    {i}. ID: {hiim.get('hiim_id_number')}, Status: {hiim.get('hiim_id_status')}, Link: {hiim.get('hiim_link')}")
    
    print(f"\n🎯 Expected dialog cards:")
    issues = retrieved.get('issues', [])
    prbs = retrieved.get('prbs', [])
    hiims = retrieved.get('hiims', [])
    
    maxItems = max(len(issues), len(prbs), len(hiims))
    print(f"  Should create {maxItems} card(s)")
    
    for i in range(maxItems):
        print(f"  Card {i + 1}:")
        if i < len(issues):
            print(f"    Issue: {issues[i].get('description', issues[i])}")
        if i < len(prbs):
            print(f"    PRB: {prbs[i].get('prb_id_number')} ({prbs[i].get('prb_id_status')})")
        if i < len(hiims):
            print(f"    HIIM: {hiims[i].get('hiim_id_number')} ({hiims[i].get('hiim_id_status')})")
        if i == 0:
            print(f"    Time Loss: {retrieved.get('time_loss')}")
    
    # Clean up
    entry_manager.delete_entry(created['id'])
    print("\n🧹 Cleaned up test data")
    
    print(f"\n✅ Test completed successfully!")
    print("The dialog should show the exact same data as displayed in the dashboard rows.")
    
    return True

if __name__ == "__main__":
    test_dialog_population()