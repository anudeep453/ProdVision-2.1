#!/usr/bin/env python3
"""
Add dummy data for CVAR ALL dashboard with Time Loss field
"""

import sys
import os
from datetime import datetime, timedelta
import random

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from independent_row_adapter import IndependentRowSQLiteAdapter

def create_cvar_all_dummy_data():
    print("🎯 Creating dummy data for CVAR ALL dashboard...")
    
    # Initialize adapter for CVAR ALL
    adapter = IndependentRowSQLiteAdapter("http://test", "cvar_all.db")
    
    # Sample data for CVAR ALL entries
    time_loss_samples = [
        "15 min", "30 minutes", "45 mins", "1 hour", "2 hours", 
        "1hr 30min", "2hrs 15min", "90 minutes", "3 hours", "25 min"
    ]
    
    issue_samples = [
        "Late data feed from upstream system",
        "Network connectivity issues during processing",
        "Database query timeout in morning batch",
        "Delayed trade settlement confirmation",
        "Risk calculation engine restart required",
        "Market data provider outage",
        "File transfer delay from counterparty",
        "System maintenance window overrun"
    ]
    
    quality_issues = [
        "Data validation errors in trade records",
        "Reconciliation breaks with previous day",
        "Missing counterparty static data",
        "Price source discrepancies identified",
        "Position breaks requiring manual adjustment",
        "Trade booking errors detected",
        "Reference data updates pending",
        "Calculation methodology review needed"
    ]
    
    prb_statuses = ["active", "closed"]
    hiim_statuses = ["active", "closed"]
    quality_statuses = ["Red", "Yellow", "Green"]
    prc_mail_statuses = ["Red", "Yellow", "Green"]
    cp_alerts_statuses = ["Red", "Yellow", "Green"]
    
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
            'application_name': 'CVAR ALL',
            
            # Common fields
            'prc_mail_text': f"{random.randint(6, 9)}:{random.randint(10, 59):02d}",
            'prc_mail_status': random.choice(prc_mail_statuses),
            'cp_alerts_text': f"{random.randint(8, 10)}:{random.randint(0, 59):02d}",
            'cp_alerts_status': random.choice(cp_alerts_statuses),
            'quality_status': random.choice(quality_statuses),
            'remarks': random.choice(quality_issues),
            'time_loss': random.choice(time_loss_samples),
            
            # Issue data
            'issue_description': random.choice(issue_samples),
            
            # PRB data (50% chance)
            'prb_id_number': random.randint(10000, 99999) if random.random() > 0.5 else None,
            'prb_id_status': random.choice(prb_statuses) if random.random() > 0.5 else '',
            'prb_link': f"https://prb.example.com/{random.randint(10000, 99999)}" if random.random() > 0.7 else '',
            
            # HIIM data (30% chance)
            'hiim_id_number': random.randint(100000, 999999) if random.random() > 0.7 else None,
            'hiim_id_status': random.choice(hiim_statuses) if random.random() > 0.7 else '',
            'hiim_link': f"https://hiim.example.com/{random.randint(100000, 999999)}" if random.random() > 0.8 else '',
            
            # XVA fields (empty for CVAR)
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
            
            # REG fields (empty for CVAR)
            'closing': '',
            'iteration': '',
            'reg_issue': '',
            'action_taken_and_update': '',
            'reg_status': '',
            'reg_prb': '',
            'reg_hiim': '',
            'backlog_item': '',
            
            # OTHERS fields (empty for CVAR)
            'dare': '',
            'timings': '',
            'puntuality_issue': '',
            'quality': '',
            'quality_issue': '',
            'others_prb': '',
            'others_hiim': ''
        }
        
        # Create the entry
        created_entry = adapter.create_entry(entry_data)
        if created_entry:
            entries_created += 1
            print(f"✅ Created entry for {date_str} ({day_str}) with Time Loss: {entry_data['time_loss']}")
        else:
            print(f"❌ Failed to create entry for {date_str}")
    
    print(f"\n🎉 Successfully created {entries_created} CVAR ALL dummy entries!")
    print("✅ All entries include Time Loss data with proper timing formats")
    return entries_created

if __name__ == "__main__":
    try:
        count = create_cvar_all_dummy_data()
        print(f"\n📊 Summary: {count} CVAR ALL entries created with Time Loss field")
        print("🚀 Ready to test CVAR ALL dashboard with realistic data!")
    except Exception as e:
        print(f"❌ Error creating CVAR ALL dummy data: {str(e)}")
        import traceback
        traceback.print_exc()