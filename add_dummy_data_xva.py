#!/usr/bin/env python3
"""
Add dummy data for XVA dashboard with Time Loss field
"""

import sys
import os
from datetime import datetime, timedelta
import random

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from independent_row_adapter import IndependentRowSQLiteAdapter

def create_xva_dummy_data():
    print("🎯 Creating dummy data for XVA dashboard...")
    
    # Initialize adapter for XVA
    adapter = IndependentRowSQLiteAdapter("http://test", "xva.db")
    
    # Sample data for XVA entries
    time_loss_samples = [
        "25 min", "1 hour", "1hr 30min", "2 hours", "45 minutes", 
        "2hrs 15min", "3 hours", "90 minutes", "30 min", "1hr 45min"
    ]
    
    issue_samples = [
        "CVA calculation engine performance issues",
        "DVA model calibration delays",
        "FVA computation timeout errors",
        "Collateral simulation batch processing lag",
        "Wrong-way risk scenario generation delays",
        "XVA attribution calculation issues",
        "Hedging strategy optimization delays",
        "Portfolio netting calculation errors"
    ]
    
    quality_issues = [
        "Model validation discrepancies in CVA",
        "Benchmark rate calculation inconsistencies",
        "Exposure profile aggregation errors",
        "Capital allocation methodology issues",
        "Stress testing scenario validation failures",
        "Counterparty default probability model issues",
        "Collateral haircut calculation errors",
        "XVA sensitivities calculation delays"
    ]
    
    root_cause_applications = [
        "CVA Engine", "DVA Calculator", "FVA System", "Collateral Manager",
        "Risk Aggregator", "Market Data Platform", "Pricing Engine", "Hedge Manager"
    ]
    
    root_cause_types = [
        "Performance", "Data Quality", "Model Error", "System Bug",
        "Configuration Issue", "Market Data", "Connectivity", "Resource Constraint"
    ]
    
    prb_statuses = ["active", "closed"]
    hiim_statuses = ["active", "closed"]
    quality_statuses = ["Red", "Yellow", "Green"]
    xva_statuses = ["Red", "Yellow", "Green"]
    
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
            'application_name': 'XVA',
            
            # XVA specific fields
            'acq_text': f"{random.randint(6, 8)}:{random.randint(0, 59):02d}",
            'valo_text': f"{random.randint(7, 9)}:{random.randint(10, 59):02d}",
            'valo_status': random.choice(xva_statuses),
            'sensi_text': f"{random.randint(8, 10)}:{random.randint(20, 59):02d}",
            'sensi_status': random.choice(xva_statuses),
            'cf_ra_text': f"{random.randint(9, 11)}:{random.randint(30, 59):02d}",
            'cf_ra_status': random.choice(xva_statuses),
            'quality_legacy': random.choice(quality_statuses),
            'quality_target': random.choice(quality_statuses),
            'root_cause_application': random.choice(root_cause_applications),
            'root_cause_type': random.choice(root_cause_types),
            'xva_remarks': random.choice(quality_issues),
            'time_loss': random.choice(time_loss_samples),
            
            # Issue data
            'issue_description': random.choice(issue_samples),
            
            # PRB data (40% chance)
            'prb_id_number': random.randint(30000, 79999) if random.random() > 0.6 else None,
            'prb_id_status': random.choice(prb_statuses) if random.random() > 0.6 else '',
            'prb_link': f"https://prb-xva.example.com/{random.randint(30000, 79999)}" if random.random() > 0.7 else '',
            
            # HIIM data (30% chance)
            'hiim_id_number': random.randint(300000, 799999) if random.random() > 0.7 else None,
            'hiim_id_status': random.choice(hiim_statuses) if random.random() > 0.7 else '',
            'hiim_link': f"https://hiim-xva.example.com/{random.randint(300000, 799999)}" if random.random() > 0.8 else '',
            
            # CVAR fields (empty for XVA)
            'prc_mail_text': '',
            'prc_mail_status': '',
            'cp_alerts_text': '',
            'cp_alerts_status': '',
            'quality_status': '',
            'remarks': '',
            
            # REG fields (empty for XVA)
            'closing': '',
            'iteration': '',
            'reg_issue': '',
            'action_taken_and_update': '',
            'reg_status': '',
            'reg_prb': '',
            'reg_hiim': '',
            'backlog_item': '',
            
            # OTHERS fields (empty for XVA)
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
    
    print(f"\n🎉 Successfully created {entries_created} XVA dummy entries!")
    print("✅ All entries include Time Loss data with proper timing formats")
    return entries_created

if __name__ == "__main__":
    try:
        count = create_xva_dummy_data()
        print(f"\n📊 Summary: {count} XVA entries created with Time Loss field")
        print("🚀 Ready to test XVA dashboard with realistic data!")
    except Exception as e:
        print(f"❌ Error creating XVA dummy data: {str(e)}")
        import traceback
        traceback.print_exc()