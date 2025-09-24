#!/usr/bin/env python3
"""
Verification script to check that reg_id column has been completely removed
"""

import sqlite3
import os

def verify_reg_id_removal():
    db_path = "./data/prodvision.db"
    
    if not os.path.exists(db_path):
        print(f"❌ Database file not found: {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check entries table schema
        print("🔍 Checking entries table schema...")
        cursor.execute("PRAGMA table_info(entries)")
        columns = [row[1] for row in cursor.fetchall()]
        
        print(f"📋 Current columns: {columns}")
        
        if 'reg_id' in columns:
            print("❌ ERROR: reg_id column still exists!")
            return False
        else:
            print("✅ SUCCESS: reg_id column has been removed")
        
        # Check data integrity
        cursor.execute("SELECT COUNT(*) FROM entries")
        count = cursor.fetchone()[0]
        print(f"📊 Total entries in database: {count}")
        
        if count > 0:
            # Check a sample record
            cursor.execute("SELECT * FROM entries LIMIT 1")
            sample = cursor.fetchone()
            if sample:
                print(f"📝 Sample record (first 5 fields): {sample[:5]}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error checking database: {str(e)}")
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("Verifying reg_id Column Removal")
    print("=" * 50)
    
    success = verify_reg_id_removal()
    
    if success:
        print("\n🎉 Verification passed! reg_id has been fully retired.")
    else:
        print("\n💥 Verification failed!")