#!/usr/bin/env python3
"""
Clean up all dummy data from all dashboards
"""

import sys
import os
import sqlite3
from datetime import datetime

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def cleanup_database(db_path, app_name):
    """Clean up dummy data from a specific database"""
    try:
        if not os.path.exists(db_path):
            print(f"⚠️  Database {db_path} does not exist")
            return 0
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Count existing entries
        cursor.execute("SELECT COUNT(*) FROM entries")
        before_count = cursor.fetchone()[0]
        
        # Delete all entries (careful!)
        cursor.execute("DELETE FROM entries")
        
        # Reset auto-increment counter
        cursor.execute("DELETE FROM sqlite_sequence WHERE name='entries'")
        
        conn.commit()
        conn.close()
        
        print(f"✅ Cleaned {app_name}: {before_count} entries removed")
        return before_count
        
    except Exception as e:
        print(f"❌ Error cleaning {app_name}: {str(e)}")
        return 0

def main():
    print("🧹 ProdVision Dummy Data Cleanup")
    print("=" * 50)
    print("⚠️  WARNING: This will delete ALL entries from ALL databases!")
    print("=" * 50)
    
    # Ask for confirmation
    response = input("Are you sure you want to proceed? (yes/no): ").lower().strip()
    if response not in ['yes', 'y']:
        print("❌ Cleanup cancelled by user")
        return
    
    # Databases to clean
    databases = [
        ("./data/cvar_all.db", "CVAR ALL"),
        ("./data/cvar_nyq.db", "CVAR NYQ"),
        ("./data/xva.db", "XVA"),
        ("./data/reg.db", "REG"),
        ("./data/others.db", "OTHERS")
    ]
    
    total_removed = 0
    successful = 0
    
    for db_path, app_name in databases:
        removed = cleanup_database(db_path, app_name)
        if removed >= 0:  # 0 is success (empty database)
            total_removed += removed
            successful += 1
    
    # Summary
    print(f"\n{'='*50}")
    print(f"📊 CLEANUP SUMMARY")
    print(f"{'='*50}")
    print(f"✅ Databases cleaned: {successful}/{len(databases)}")
    print(f"🗑️  Total entries removed: {total_removed}")
    
    if successful == len(databases):
        print(f"\n🎉 ALL DATABASES CLEANED SUCCESSFULLY!")
        print(f"🚀 Ready to create fresh dummy data!")
    else:
        print(f"\n⚠️  Some databases could not be cleaned. Check error messages above.")
    
    print(f"\n🔧 Next steps:")
    print(f"1. Run: python3 create_all_dummy_data.py")
    print(f"2. Or run individual scripts as needed")

if __name__ == "__main__":
    main()