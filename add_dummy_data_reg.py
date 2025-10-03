#!/usr/bin/env python3
"""
Add dummy data for REG dashboard with Time Loss field
"""

import sys
import os
from datetime import datetime, timedelta
import random

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from independent_row_adapter import IndependentRowSQLiteAdapter

def create_reg_dummy_data():
    print("🎯 Creating dummy data for REG dashboard...")
    
    # Initialize adapter for REG
    adapter = IndependentRowSQLiteAdapter("http://test", "reg.db")
    
    # Sample data for REG entries
    time_loss_samples = [
        "30 min", "1 hour", "2 hours", "45 minutes", "1hr 30min", 
        "3 hours", "90 minutes", "2hrs 30min", "15 min", "1hr 15min"
    ]
    
    reg_issues = [
        "CCAR stress testing data compilation delays",
        "Regulatory capital calculation discrepancies",
        "Liquidity coverage ratio reporting issues",
        "FRTB implementation validation delays",
        "Basel III compliance metric calculation errors",
        "Regulatory reporting template updates pending",
        "Risk-weighted assets calculation delays",
        "Regulatory data quality validation failures"
    ]
    
    actions_taken = [
        "Escalated to risk management team for review",
        "Updated calculation methodology per guidance",
        "Coordinated with IT for system configuration changes",
        "Engaged external consultant for validation support",
        "Implemented temporary manual calculation process",
        "Updated regulatory reporting templates",
        "Scheduled emergency committee review meeting",
        "Requested deadline extension from regulator"
    ]
    
    reg_statuses = ["In Progress", "Under Review", "Completed", "Escalated", "Pending Approval"]
    closing_statuses = ["Open", "Closed", "Pending", "Deferred"]
    
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
            'application_name': 'REG',
            
            # REG specific fields
            'closing': random.choice(closing_statuses),
            'iteration': f"Iteration {random.randint(1, 5)}",
            'reg_issue': random.choice(reg_issues),
            'action_taken_and_update': random.choice(actions_taken),
            'reg_status': random.choice(reg_statuses),
            'reg_prb': f"REG-PRB-{random.randint(1000, 9999)}" if random.random() > 0.6 else '',
            'reg_hiim': f"REG-HIIM-{random.randint(10000, 99999)}" if random.random() > 0.7 else '',
            'backlog_item': f"BACKLOG-{random.randint(100, 999)}" if random.random() > 0.5 else '',
            'time_loss': random.choice(time_loss_samples),
            
            # Issue data
            'issue_description': random.choice(reg_issues),
            
            # PRB data (50% chance)
            'prb_id_number': random.randint(40000, 69999) if random.random() > 0.5 else None,
            'prb_id_status': "active" if random.random() > 0.6 else "closed",
            'prb_link': f"https://prb-reg.example.com/{random.randint(40000, 69999)}" if random.random() > 0.7 else '',
            
            # HIIM data (40% chance)
            'hiim_id_number': random.randint(400000, 699999) if random.random() > 0.6 else None,
            'hiim_id_status': "active" if random.random() > 0.7 else "closed",
            'hiim_link': f"https://hiim-reg.example.com/{random.randint(400000, 699999)}" if random.random() > 0.8 else '',
            
            # CVAR fields (empty for REG)
            'prc_mail_text': '',
            'prc_mail_status': '',
            'cp_alerts_text': '',
            'cp_alerts_status': '',
            'quality_status': '',
            'remarks': '',
            
            # XVA fields (empty for REG)
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
            
            # OTHERS fields (empty for REG)
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
    
    print(f"\n🎉 Successfully created {entries_created} REG dummy entries!")
    print("✅ All entries include Time Loss data with proper timing formats")
    return entries_created

if __name__ == "__main__":
    try:
        count = create_reg_dummy_data()
        print(f"\n📊 Summary: {count} REG entries created with Time Loss field")
        print("🚀 Ready to test REG dashboard with realistic data!")
    except Exception as e:
        print(f"❌ Error creating REG dummy data: {str(e)}")
        import traceback
        traceback.print_exc()