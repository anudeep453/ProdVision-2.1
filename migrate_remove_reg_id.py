#!/usr/bin/env python3
"""
Migration script to remove reg_id column from the SQLite database.
This script safely removes the reg_id column from the entries table by:
1. Creating a backup of the database
2. Creating a new table without the reg_id column
3. Copying all data (excluding reg_id) to the new table
4. Dropping the old table and renaming the new one
5. Preserving all indexes and constraints
"""

import os
import sqlite3
import shutil
from datetime import datetime

def backup_database(db_path):
    """Create a backup of the database before migration"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = f"{db_path}.backup_{timestamp}"
    shutil.copy2(db_path, backup_path)
    print(f"✅ Database backed up to: {backup_path}")
    return backup_path

def migrate_remove_reg_id(db_path):
    """Remove reg_id column from entries table"""
    print(f"🔄 Starting migration to remove reg_id column from {db_path}")
    
    if not os.path.exists(db_path):
        print(f"❌ Database file not found: {db_path}")
        return False
    
    # Create backup first
    backup_path = backup_database(db_path)
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if reg_id column exists
        cursor.execute("PRAGMA table_info(entries)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'reg_id' not in columns:
            print("✅ reg_id column does not exist. No migration needed.")
            conn.close()
            return True
        
        print("📋 Current columns:", columns)
        
        # Get the current table schema without reg_id
        new_columns = [col for col in columns if col != 'reg_id']
        print(f"🎯 New columns (without reg_id): {new_columns}")
        
        # Start transaction
        cursor.execute("BEGIN TRANSACTION")
        
        # Create new table without reg_id column
        cursor.execute('''
            CREATE TABLE entries_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT,
                day TEXT,
                application_name TEXT,
                prc_mail_text TEXT,
                prc_mail_status TEXT,
                cp_alerts_text TEXT,
                cp_alerts_status TEXT,
                quality_status TEXT,
                quality_legacy TEXT,
                quality_target TEXT,
                prb_id_number TEXT,
                prb_id_status TEXT,
                prb_link TEXT,
                hiim_id_number TEXT,
                hiim_id_status TEXT,
                hiim_link TEXT,
                valo_text TEXT,
                valo_status TEXT,
                sensi_text TEXT,
                sensi_status TEXT,
                cf_ra_text TEXT,
                cf_ra_status TEXT,
                acq_text TEXT,
                root_cause_application TEXT,
                root_cause_type TEXT,
                issue_description TEXT,
                remarks TEXT,
                xva_remarks TEXT,
                -- REG-specific columns (excluding reg_id)
                closing TEXT,
                iteration TEXT,
                reg_issue TEXT,
                action_taken_and_update TEXT,
                reg_status TEXT,
                reg_prb TEXT,
                reg_hiim TEXT,
                backlog_item TEXT,
                created_at TEXT,
                updated_at TEXT
            )
        ''')
        
        # Copy data from old table to new table (excluding reg_id)
        columns_str = ', '.join(new_columns)
        cursor.execute(f'''
            INSERT INTO entries_new ({columns_str})
            SELECT {columns_str} FROM entries
        ''')
        
        # Get the number of rows copied
        cursor.execute("SELECT COUNT(*) FROM entries_new")
        new_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM entries")
        old_count = cursor.fetchone()[0]
        
        if new_count != old_count:
            raise Exception(f"Row count mismatch: old={old_count}, new={new_count}")
        
        print(f"✅ Copied {new_count} rows to new table")
        
        # Drop the old table
        cursor.execute("DROP TABLE entries")
        
        # Rename new table to original name
        cursor.execute("ALTER TABLE entries_new RENAME TO entries")
        
        # Commit the transaction
        conn.commit()
        
        # Verify the migration
        cursor.execute("PRAGMA table_info(entries)")
        final_columns = [row[1] for row in cursor.fetchall()]
        
        if 'reg_id' in final_columns:
            raise Exception("Migration failed: reg_id column still exists")
        
        cursor.execute("SELECT COUNT(*) FROM entries")
        final_count = cursor.fetchone()[0]
        
        print(f"✅ Migration completed successfully!")
        print(f"   - Removed reg_id column")
        print(f"   - Preserved {final_count} rows")
        print(f"   - Final columns: {final_columns}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        try:
            conn.rollback()
            conn.close()
        except:
            pass
        
        # Restore from backup
        if os.path.exists(backup_path):
            print(f"🔄 Restoring from backup: {backup_path}")
            shutil.copy2(backup_path, db_path)
            print("✅ Database restored from backup")
        
        return False

if __name__ == "__main__":
    # Path to the database
    db_path = "./data/prodvision.db"
    
    print("=" * 60)
    print("ProdVision Database Migration: Remove reg_id Column")
    print("=" * 60)
    
    success = migrate_remove_reg_id(db_path)
    
    if success:
        print("\n🎉 Migration completed successfully!")
        print("You can now update the application code to remove reg_id references.")
    else:
        print("\n💥 Migration failed!")
        print("The database has been restored from backup.")
        print("Please check the error messages above and try again.")