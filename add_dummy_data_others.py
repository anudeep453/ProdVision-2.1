#!/usr/bin/env python3
"""
Add dummy data for OTHERS dashboard with Time Loss field
"""

import sys
import os
from datetime import datetime, timedelta
import random

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from independent_row_adapter import IndependentRowSQLiteAdapter

def create_others_dummy_data():
    print("🎯 Creating dummy data for OTHERS dashboard...")
    
    # Initialize adapter for OTHERS
    adapter = IndependentRowSQLiteAdapter("http://test", "others.db")
    
    # Sample data for OTHERS entries
    time_loss_samples = [
        "10 min", "25 minutes", "1 hour", "45 mins", "1hr 20min", 
        "2 hours", "35 minutes", "1hr 50min", "3 hours", "50 min"
    ]
    
    dare_samples = [
        "Infrastructure maintenance window",
        "Database backup operation", 
        "Security patch deployment",
        "Network equipment upgrade",
        "Storage system maintenance",
        "Application server restart",
        "Firewall rule updates",
        "Monitoring system calibration"
    ]
    
    timings_samples = [
        "06:00 - 07:30", "22:00 - 23:45", "05:30 - 06:15",
        "23:00 - 01:00", "04:00 - 05:30", "21:30 - 22:45",
        "03:00 - 04:15", "00:00 - 01:30"
    ]
    
    punctuality_issues = [
        "Planned maintenance overran scheduled window",
        "Emergency patching required immediate action",
        "System performance degradation during peak hours",
        "Unexpected dependencies discovered during maintenance",
        "Third-party vendor delay in support response",
        "Coordination issues between multiple teams",
        "Change approval process delay",
        "Testing phase took longer than anticipated"
    ]
    
    quality_samples = ["Red", "Yellow", "Green"]
    
    quality_issues_samples = [
        "Service availability below SLA threshold",
        "Performance metrics degraded during operation",
        "User experience impact reported",
        "Monitoring alerts triggered post-maintenance",
        "Data integrity validation failures",
        "Security compliance check failures",
        "Documentation updates pending",
        "Process improvement recommendations identified"
    ]
    
    # Create entries for the last 10 days
    entries_created = 0
    for i in range(10):
        entry_date = datetime.now() - timedelta(days=i)
        date_str = entry_date.strftime('%Y-%m-%d')
        day_str = entry_date.strftime('%A')
        
        # Skip weekends for business data
        if entry_date.weekday() >= 5:  # Saturday = 5, Sunday = 6
            continue
        
        # Create entry data
        entry_data = {
            'date': date_str,
            'day': day_str,
            'application_name': 'OTHERS',
            
            # OTHERS specific fields
            'dare': random.choice(dare_samples),
            'timings': random.choice(timings_samples),
            'puntuality_issue': random.choice(punctuality_issues),
            'quality': random.choice(quality_samples),
            'quality_issue': random.choice(quality_issues_samples),
            'others_prb': f"OTH-PRB-{random.randint(1000, 9999)}" if random.random() > 0.7 else '',
            'others_hiim': f"OTH-HIIM-{random.randint(10000, 99999)}" if random.random() > 0.8 else '',
            'time_loss': random.choice(time_loss_samples),
            
            # Issue data
            'issue_description': random.choice(punctuality_issues),
            
            # PRB data (30% chance)
            'prb_id_number': random.randint(50000, 59999) if random.random() > 0.7 else None,
            'prb_id_status': "active" if random.random() > 0.5 else "closed",
            'prb_link': f"https://prb-others.example.com/{random.randint(50000, 59999)}" if random.random() > 0.8 else '',
            
            # HIIM data (20% chance)
            'hiim_id_number': random.randint(500000, 599999) if random.random() > 0.8 else None,
            'hiim_id_status': "active" if random.random() > 0.6 else "closed",
            'hiim_link': f"https://hiim-others.example.com/{random.randint(500000, 599999)}" if random.random() > 0.9 else '',
            
            # CVAR fields (empty for OTHERS)
            'prc_mail_text': '',
            'prc_mail_status': '',
            'cp_alerts_text': '',
            'cp_alerts_status': '',
            'quality_status': '',
            'remarks': '',
            
            # XVA fields (empty for OTHERS)
            'acq_text': '',
            'valo_text': '',
            'valo_status': '',
            'sensi_text': '',
            'sensi_status': '',
            'cf_ra_text': '',
            'cf_ra_status': '',
            'quality_legacy': '',
            'quality_target': '',
            'root_cause_application': '',
            'root_cause_type': '',
            'xva_remarks': '',
            
            # REG fields (empty for OTHERS)
            'closing': '',
            'iteration': '',
            'reg_issue': '',
            'action_taken_and_update': '',
            'reg_status': '',
            'reg_prb': '',
            'reg_hiim': '',
            'backlog_item': ''
        }
        
        # Create the entry
        created_entry = adapter.create_entry(entry_data)
        if created_entry:
            entries_created += 1
            print(f"✅ Created entry for {date_str} ({day_str}) with Time Loss: {entry_data['time_loss']}")
        else:
            print(f"❌ Failed to create entry for {date_str}")
    
    print(f"\n🎉 Successfully created {entries_created} OTHERS dummy entries!")
    print("✅ All entries include Time Loss data with proper timing formats")
    return entries_created

if __name__ == "__main__":
    try:
        count = create_others_dummy_data()
        print(f"\n📊 Summary: {count} OTHERS entries created with Time Loss field")
        print("🚀 Ready to test OTHERS dashboard with realistic data!")
    except Exception as e:
        print(f"❌ Error creating OTHERS dummy data: {str(e)}")
        import traceback
        traceback.print_exc()