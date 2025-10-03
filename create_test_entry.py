#!/usr/bin/env python3
"""
Create a test entry to see how it displays in the dashboard
"""

import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from independent_row_adapter import EntryManager

def create_test_entry():
    """Create a test entry with multiple items to see the display"""
    
    print("🧪 Creating Test Entry for CVAR ALL")
    print("=" * 50)
    
    entry_manager = EntryManager()
    
    # Create a test entry with multiple items
    test_data = {
        'date': '2025-10-03',
        'application_name': 'CVAR ALL',
        'prc_mail_text': '09:00',
        'prc_mail_status': 'Green',
        'cp_alerts_text': '09:15',
        'cp_alerts_status': 'Yellow',
        'quality_status': 'Green',
        'issues': [
            {'description': 'Network latency affecting morning batch'},
            {'description': 'Database timeout during reconciliation'}
        ],
        'prbs': [
            {'prb_id_number': 12345, 'prb_id_status': 'active', 'prb_link': 'https://prb.example.com/12345'},
            {'prb_id_number': 67890, 'prb_id_status': 'closed', 'prb_link': 'https://prb.example.com/67890'}
        ],
        'hiims': [
            {'hiim_id_number': 11111, 'hiim_id_status': 'active', 'hiim_link': 'https://hiim.example.com/11111'}
        ],
        'time_loss': '45 minutes',
        'remarks': 'Multiple items test entry'
    }
    
    print("📝 Creating test entry with multiple items...")
    print("  • 2 Issues")
    print("  • 2 PRBs") 
    print("  • 1 HIIM")
    
    created = entry_manager.create_entry(test_data)
    
    if not created:
        print("❌ Failed to create test entry")
        return
    
    print(f"✅ Created entry with ID: {created['id']}")
    
    # Retrieve the entry to see how it's structured
    print("\n🔍 Retrieving entry to see structure...")
    retrieved = entry_manager.get_entry_by_id(created['id'], 'CVAR ALL')
    
    if retrieved:
        print(f"📊 Entry structure:")
        print(f"  Main Entry ID: {retrieved['id']}")
        print(f"  Date: {retrieved['date']}")
        print(f"  Application: {retrieved['application_name']}")
        
        print(f"\n📋 Issues ({len(retrieved.get('issues', []))} items):")
        for i, issue in enumerate(retrieved.get('issues', []), 1):
            description = issue.get('description') if isinstance(issue, dict) else issue
            print(f"    Item Set {i}: {description}")
        
        print(f"\n🔧 PRBs ({len(retrieved.get('prbs', []))} items):")
        for i, prb in enumerate(retrieved.get('prbs', []), 1):
            print(f"    Item Set {i}: PRB {prb.get('prb_id_number')} ({prb.get('prb_id_status')})")
        
        print(f"\n⚙️ HIIMs ({len(retrieved.get('hiims', []))} items):")
        for i, hiim in enumerate(retrieved.get('hiims', []), 1):
            print(f"    Item Set {i}: HIIM {hiim.get('hiim_id_number')} ({hiim.get('hiim_id_status')})")
        
        print(f"\n🎯 How this should appear in dashboard:")
        print("The entry should show with multiple 'Item Set' cards in the dialog box")
        print("when you click Edit, representing each combination of data.")
        
        # Check backend database structure
        print(f"\n🗄️ Checking backend database structure...")
        adapter = entry_manager.adapters['CVAR ALL']
        conn = adapter.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM entries WHERE grouping_key LIKE ? ORDER BY row_position", (f"{retrieved['date']}_CVAR ALL%",))
        columns = [description[0] for description in cursor.description]
        all_rows = cursor.fetchall()
        
        print(f"Found {len(all_rows)} database rows:")
        for row in all_rows:
            row_dict = dict(zip(columns, row))
            print(f"  Row {row_dict['row_position']}: ID={row_dict['id']}, Type={row_dict['row_type']}")
            if row_dict['row_type'] == 'prb':
                print(f"    PRB: {row_dict['prb_id_number']} ({row_dict['prb_id_status']})")
            elif row_dict['row_type'] == 'hiim':
                print(f"    HIIM: {row_dict['hiim_id_number']} ({row_dict['hiim_id_status']})")
            elif row_dict['row_type'] == 'issue':
                print(f"    Issue: {row_dict['issue_description']}")
        
        conn.close()
    else:
        print("❌ Failed to retrieve entry")
        return
    
    print(f"\n📝 Entry created! You can now:")
    print(f"  1. Start the application: python3 app.py")
    print(f"  2. Navigate to CVAR ALL section")
    print(f"  3. Look for the entry dated {test_data['date']}")
    print(f"  4. Click Edit to see the Item Set cards")
    print(f"\n💡 The entry will remain in the database for testing.")

if __name__ == "__main__":
    create_test_entry()