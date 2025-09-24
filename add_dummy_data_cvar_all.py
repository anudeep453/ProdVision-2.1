#!/usr/bin/env python3
"""
Script to add dummy data for CVAR ALL application for the last 3 months
Excludes weekends (Saturday and Sunday) and ensures no duplicate dates
"""

import sys
import os
import sqlite3
from datetime import datetime, timedelta
import random

# Add the current directory to Python path to import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sharepoint_sqlite_adapter import ProductionEntryManagerWorking
from config import SHAREPOINT_URL

def get_weekday_dates_last_3_months():
    """Get all weekdays (Monday-Friday) from the last 3 months"""
    today = datetime.now()
    three_months_ago = today - timedelta(days=90)
    
    dates = []
    current_date = three_months_ago
    
    while current_date <= today:
        # Check if it's a weekday (Monday=0, Sunday=6)
        if current_date.weekday() < 5:  # Monday to Friday
            dates.append(current_date.strftime('%Y-%m-%d'))
        current_date += timedelta(days=1)
    
    return dates

def generate_dummy_cvar_all_data(date_str):
    """Generate dummy data for CVAR ALL entry"""
    # Convert date to day name
    date_obj = datetime.strptime(date_str, '%Y-%m-%d')
    day_name = date_obj.strftime('%A')
    
    # Generate random times (HH:MM format)
    def random_time():
        hour = random.randint(8, 18)  # Business hours
        minute = random.choice([0, 15, 30, 45])
        return f"{hour:02d}:{minute:02d}"
    
    # Generate random status
    def random_status():
        return random.choice(['Red', 'Yellow', 'Green'])
    
    # Generate random quality status
    def random_quality():
        return random.choice(['Red', 'Yellow', 'Green'])
    
    # Generate issues first (1-4 issues per entry)
    issue_count = random.randint(1, 4)
    
    issues = []
    prbs = []
    hiims = []
    
    issue_descriptions = [
        "Database connection timeout",
        "Memory leak in calculation engine", 
        "Network latency issues",
        "Configuration file corruption",
        "Authentication service down",
        "Data validation error",
        "Performance degradation",
        "Cache invalidation problem",
        "API rate limit exceeded",
        "Disk space running low"
    ]
    
    # Generate issues and associate PRBs/HIIMs with them
    for i in range(issue_count):
        issue_desc = random.choice(issue_descriptions)
        issues.append({
            "description": issue_desc,
            "remarks": f"Issue #{i+1} - {random.choice(['Critical', 'High', 'Medium', 'Low'])} priority"
        })
        
        # 60% chance to create a PRB for this issue
        if random.random() < 0.6:
            prbs.append({
                "prb_id_number": str(random.randint(10000, 99999)),
                "prb_id_status": random.choice(['active', 'closed']),
                "prb_link": f"https://prb.example.com/{random.randint(10000, 99999)}",
                "related_issue": issue_desc  # Link to the issue
            })
        
        # 30% chance to create a HIIM for this issue (less common than PRBs)
        if random.random() < 0.3:
            hiims.append({
                "hiim_id_number": str(random.randint(1000, 9999)),
                "hiim_id_status": random.choice(['active', 'closed']),
                "hiim_link": f"https://hiim.example.com/{random.randint(1000, 9999)}",
                "related_issue": issue_desc  # Link to the issue
            })

    # Base entry data
    entry_data = {
        "date": date_str,
        "day": day_name,
        "application_name": "CVAR ALL",
        "prc_mail_text": random_time(),
        "prc_mail_status": random_status(),
        "cp_alerts_text": random_time() if random.random() > 0.3 else "",
        "cp_alerts_status": random_status() if random.random() > 0.3 else "",
        "quality_status": random_quality(),
        "issues": issues,
        "prbs": prbs,
        "hiims": hiims,
        "remarks": f"Daily production report for {date_str} - {random.choice(['All systems operational', 'Minor issues resolved', 'Performance monitoring active', 'Routine maintenance completed'])}"
    }
    
    return entry_data

def clear_existing_data():
    """Clear all existing entries to start fresh"""
    print("🗑️  Clearing existing data...")
    entry_manager = ProductionEntryManagerWorking(SHAREPOINT_URL)
    
    try:
        # Get database connection
        conn = sqlite3.connect('data/prodvision.db')
        cursor = conn.cursor()
        
        # Clear all related tables in correct order (respecting foreign keys)
        cursor.execute("DELETE FROM issues")
        cursor.execute("DELETE FROM prbs") 
        cursor.execute("DELETE FROM hiims")
        cursor.execute("DELETE FROM entries")
        
        # Reset auto-increment counters
        cursor.execute("DELETE FROM sqlite_sequence WHERE name IN ('entries', 'issues', 'prbs', 'hiims')")
        
        conn.commit()
        conn.close()
        
        print("✅ Successfully cleared all existing data")
        return True
        
    except Exception as e:
        print(f"❌ Error clearing data: {str(e)}")
        return False

def main():
    """Main function to add dummy data"""
    print("🚀 Starting CVAR ALL dummy data generation...")
    
    # Clear existing data first
    if not clear_existing_data():
        print("❌ Failed to clear existing data. Exiting.")
        return
    
    # Initialize entry manager
    entry_manager = ProductionEntryManagerWorking(SHAREPOINT_URL)
    
    # Get all weekdays from last 3 months
    dates = get_weekday_dates_last_3_months()
    print(f"📅 Found {len(dates)} weekdays in the last 3 months")
    
    print(f"✨ Will create {len(dates)} new CVAR ALL entries with validation-compliant data")
    
    # Create entries
    success_count = 0
    error_count = 0
    
    for i, date in enumerate(dates, 1):
        try:
            print(f"📝 Creating entry {i}/{len(dates)} for {date}...")
            
            # Generate dummy data
            entry_data = generate_dummy_cvar_all_data(date)
            
            # Create entry
            result = entry_manager.create_entry(entry_data)
            
            if result:
                success_count += 1
                print(f"✅ Successfully created entry for {date} with {len(entry_data['issues'])} issues, {len(entry_data['prbs'])} PRBs, {len(entry_data['hiims'])} HIIMs")
            else:
                error_count += 1
                print(f"❌ Failed to create entry for {date}")
                
        except Exception as e:
            error_count += 1
            print(f"❌ Error creating entry for {date}: {str(e)}")
    
    print(f"\n🎉 CVAR ALL dummy data generation completed!")
    print(f"✅ Successfully created: {success_count} entries")
    print(f"❌ Failed: {error_count} entries")
    print(f"📊 Total entries processed: {len(dates)}")

if __name__ == "__main__":
    main()
