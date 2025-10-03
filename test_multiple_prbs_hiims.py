#!/usr/bin/env python3
"""
Test script to demonstrate adding multiple PRBs and HIIMs for the same date
"""

from independent_row_adapter import IndependentRowSQLiteAdapter

def test_multiple_prbs_hiims():
    """Test adding multiple PRBs and HIIMs for the same date"""
    
    # Initialize adapter for CVAR ALL
    adapter = IndependentRowSQLiteAdapter("", "cvar_all.db")
    
    print("🧪 Testing Multiple PRBs and HIIMs for Same Date")
    print("=" * 50)
    
    test_date = "2025-10-03"
    application = "CVAR ALL"
    
    # Add additional PRBs for October 3, 2025
    print(f"\n📋 Adding additional PRBs for {test_date}:")
    
    # PRB 2
    prb_data_2 = {
        'date': test_date,
        'application_name': application,
        'prb_id_number': '7890',
        'prb_id_status': 'Open',
        'prb_link': 'https://example.com/prb/7890'
    }
    
    result_prb2 = adapter.create_prb_entry(prb_data_2)
    if result_prb2:
        print(f"✅ Added PRB 7890 - ID: {result_prb2.get('id')}")
    else:
        print("❌ Failed to add PRB 7890")
    
    # PRB 3
    prb_data_3 = {
        'date': test_date,
        'application_name': application,
        'prb_id_number': '5555',
        'prb_id_status': 'In Progress',
        'prb_link': 'https://example.com/prb/5555'
    }
    
    result_prb3 = adapter.create_prb_entry(prb_data_3)
    if result_prb3:
        print(f"✅ Added PRB 5555 - ID: {result_prb3.get('id')}")
    else:
        print("❌ Failed to add PRB 5555")
    
    # Add additional HIIMs for October 3, 2025
    print(f"\n📋 Adding additional HIIMs for {test_date}:")
    
    # HIIM 2
    hiim_data_2 = {
        'date': test_date,
        'application_name': application,
        'hiim_id_number': '9876',
        'hiim_id_status': 'Closed',
        'hiim_link': 'https://example.com/hiim/9876'
    }
    
    result_hiim2 = adapter.create_hiim_entry(hiim_data_2)
    if result_hiim2:
        print(f"✅ Added HIIM 9876 - ID: {result_hiim2.get('id')}")
    else:
        print("❌ Failed to add HIIM 9876")
    
    # HIIM 3  
    hiim_data_3 = {
        'date': test_date,
        'application_name': application,
        'hiim_id_number': '1111',
        'hiim_id_status': 'Pending',
        'hiim_link': 'https://example.com/hiim/1111'
    }
    
    result_hiim3 = adapter.create_hiim_entry(hiim_data_3)
    if result_hiim3:
        print(f"✅ Added HIIM 1111 - ID: {result_hiim3.get('id')}")
    else:
        print("❌ Failed to add HIIM 1111")
    
    # Add additional issues
    print(f"\n📋 Adding additional issues for {test_date}:")
    
    # Issue 1
    issue_data_1 = {
        'date': test_date,
        'application_name': application,
        'issue_description': 'Database connection timeout during peak hours'
    }
    
    result_issue1 = adapter.create_issue_entry(issue_data_1)
    if result_issue1:
        print(f"✅ Added Issue - ID: {result_issue1.get('id')}")
    else:
        print("❌ Failed to add issue")
    
    # Issue 2
    issue_data_2 = {
        'date': test_date,
        'application_name': application,
        'issue_description': 'Memory leak in calculation engine'
    }
    
    result_issue2 = adapter.create_issue_entry(issue_data_2)
    if result_issue2:
        print(f"✅ Added Issue - ID: {result_issue2.get('id')}")
    else:
        print("❌ Failed to add issue")
    
    print(f"\n📊 Summary for {test_date}:")
    print("=" * 30)
    
    # Query and display all entries for the test date
    import sqlite3
    conn = sqlite3.connect('./data/cvar_all.db')
    cursor = conn.cursor()
    
    # Count PRBs
    cursor.execute('SELECT COUNT(*), GROUP_CONCAT(prb_id_number) FROM entries WHERE date = ? AND row_type = "prb"', (test_date,))
    prb_count, prb_ids = cursor.fetchone()
    print(f"📋 PRBs: {prb_count} - IDs: {prb_ids}")
    
    # Count HIIMs
    cursor.execute('SELECT COUNT(*), GROUP_CONCAT(hiim_id_number) FROM entries WHERE date = ? AND row_type = "hiim"', (test_date,))
    hiim_count, hiim_ids = cursor.fetchone()
    print(f"📋 HIIMs: {hiim_count} - IDs: {hiim_ids}")
    
    # Count Issues
    cursor.execute('SELECT COUNT(*), GROUP_CONCAT(SUBSTR(issue_description, 1, 30)) FROM entries WHERE date = ? AND row_type = "issue"', (test_date,))
    issue_count, issue_descs = cursor.fetchone()
    print(f"📋 Issues: {issue_count} - Descriptions: {issue_descs}")
    
    conn.close()
    
    print(f"\n✅ Test completed! You now have multiple PRBs, HIIMs, and issues for {test_date}")
    print("🌐 Check the dashboard to see how they are displayed")

if __name__ == "__main__":
    test_multiple_prbs_hiims()