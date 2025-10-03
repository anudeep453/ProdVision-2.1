#!/usr/bin/env python3
"""
Add dummy data for CVAR NYQ dashboard with Time Loss field
"""

import sys
import os
from datetime import datetime, timedelta
import random

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from independent_row_adapter import IndependentRowSQLiteAdapter

def create_cvar_nyq_dummy_data():
    print("🎯 Creating dummy data for CVAR NYQ dashboard...")
    
    # Initialize adapter for CVAR NYQ
    adapter = IndependentRowSQLiteAdapter("http://test", "cvar_nyq.db")
    
    # Sample data for CVAR NYQ entries (NY timezone specific)
    time_loss_samples = [
        "20 min", "45 minutes", "1 hour", "1hr 15min", "2 hours", 
        "35 mins", "1hr 45min", "3 hours", "90 minutes", "30 min"
    ]
    
    issue_samples = [
        "NYSE market data delay affecting calculations",
        "NASDAQ feed interruption during market open",
        "Cross-border trade settlement delays",
        "NY Fed overnight rate update delay",
        "Currency conversion issues USD/EUR",
        "Trade capture system lag in NY session",
        "Regulatory reporting delay to CFTC",
        "Risk system synchronization issues with London"
    ]
    
    quality_issues = [
        "Mark-to-market pricing discrepancies",
        "Position reconciliation breaks with NY office",
        "Trade allocation errors requiring correction",
        "Counterparty exposure calculation delays",
        "Cross-asset portfolio risk aggregation issues",
        "Settlement instruction validation failures",
        "Corporate action processing delays",
        "Collateral management calculation errors"
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
            'application_name': 'CVAR NYQ',
            
            # Common fields (NY timezone - earlier times)
            'prc_mail_text': f"{random.randint(5, 8)}:{random.randint(10, 59):02d}",
            'prc_mail_status': random.choice(prc_mail_statuses),
            'cp_alerts_text': f"{random.randint(7, 9)}:{random.randint(0, 59):02d}",
            'cp_alerts_status': random.choice(cp_alerts_statuses),
            'quality_status': random.choice(quality_statuses),
            'remarks': random.choice(quality_issues),
            'time_loss': random.choice(time_loss_samples),
            
            # Issue data
            'issue_description': random.choice(issue_samples),
            
            # PRB data (60% chance - higher for NYQ)
            'prb_id_number': random.randint(20000, 89999) if random.random() > 0.4 else None,
            'prb_id_status': random.choice(prb_statuses) if random.random() > 0.4 else '',
            'prb_link': f"https://prb-nyq.example.com/{random.randint(20000, 89999)}" if random.random() > 0.6 else '',
            
            # HIIM data (40% chance)
            'hiim_id_number': random.randint(200000, 899999) if random.random() > 0.6 else None,
            'hiim_id_status': random.choice(hiim_statuses) if random.random() > 0.6 else '',
            'hiim_link': f"https://hiim-nyq.example.com/{random.randint(200000, 899999)}" if random.random() > 0.7 else '',
            
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
    
    print(f"\n🎉 Successfully created {entries_created} CVAR NYQ dummy entries!")
    print("✅ All entries include Time Loss data with proper timing formats")
    return entries_created

if __name__ == "__main__":
    try:
        count = create_cvar_nyq_dummy_data()
        print(f"\n📊 Summary: {count} CVAR NYQ entries created with Time Loss field")
        print("🚀 Ready to test CVAR NYQ dashboard with realistic data!")
    except Exception as e:
        print(f"❌ Error creating CVAR NYQ dummy data: {str(e)}")
        import traceback
        traceback.print_exc()