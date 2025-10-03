"""
Migration script to convert from parent-child database structure to independent rows
This script will:
1. Backup existing data
2. Create new schema with independent rows
3. Migrate existing data to new structure
4. Remove old child tables
"""

import sqlite3
import json
from datetime import datetime
import os

def migrate_to_independent_rows(db_path):
    """
    Migrate existing parent-child structure to independent rows
    """
    print(f"Starting migration for database: {db_path}")
    
    # Create backup
    backup_path = f"{db_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    os.system(f"cp '{db_path}' '{backup_path}'")
    print(f"Backup created: {backup_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Step 1: Add new columns to entries table
        print("Adding new columns to entries table...")
        
        new_columns = [
            "row_type TEXT DEFAULT 'main'",
            "grouping_key TEXT",
            "row_position INTEGER DEFAULT 0"
        ]
        
        for column in new_columns:
            try:
                cursor.execute(f"ALTER TABLE entries ADD COLUMN {column}")
            except sqlite3.OperationalError as e:
                if "duplicate column name" in str(e):
                    print(f"Column already exists: {column}")
                else:
                    raise e
        
        # Step 2: Get all existing entries with their child data
        print("Retrieving existing entries...")
        cursor.execute("SELECT * FROM entries ORDER BY id")
        entries_columns = [description[0] for description in cursor.description]
        existing_entries = [dict(zip(entries_columns, row)) for row in cursor.fetchall()]
        
        # Step 3: For each entry, get its child records
        print("Processing child records...")
        entries_with_children = []
        
        for entry in existing_entries:
            entry_id = entry['id']
            
            # Get issues
            cursor.execute("SELECT * FROM issues WHERE entry_id = ? ORDER BY position, id", (entry_id,))
            issues_columns = [description[0] for description in cursor.description] 
            issues = [dict(zip(issues_columns, row)) for row in cursor.fetchall()]
            
            # Get PRBs
            cursor.execute("SELECT * FROM prbs WHERE entry_id = ? ORDER BY position, id", (entry_id,))
            prbs_columns = [description[0] for description in cursor.description]
            prbs = [dict(zip(prbs_columns, row)) for row in cursor.fetchall()]
            
            # Get HIIMs
            cursor.execute("SELECT * FROM hiims WHERE entry_id = ? ORDER BY position, id", (entry_id,))
            hiims_columns = [description[0] for description in cursor.description]
            hiims = [dict(zip(hiims_columns, row)) for row in cursor.fetchall()]
            
            entry['child_issues'] = issues
            entry['child_prbs'] = prbs  
            entry['child_hiims'] = hiims
            entries_with_children.append(entry)
        
        # Step 4: Clear entries table and recreate with independent rows
        print("Creating independent rows...")
        cursor.execute("DELETE FROM entries")
        
        new_entry_id = 1
        
        for original_entry in entries_with_children:
            # Create grouping key
            grouping_key = f"{original_entry['date']}_{original_entry['application_name']}"
            
            # Common data to be duplicated across all rows
            common_data = {
                'date': original_entry['date'],
                'day': original_entry['day'], 
                'application_name': original_entry['application_name'],
                'prc_mail_text': original_entry['prc_mail_text'],
                'prc_mail_status': original_entry['prc_mail_status'],
                'cp_alerts_text': original_entry['cp_alerts_text'],
                'cp_alerts_status': original_entry['cp_alerts_status'],
                'quality_status': original_entry['quality_status'],
                'quality_legacy': original_entry.get('quality_legacy'),
                'quality_target': original_entry.get('quality_target'),
                'valo_text': original_entry.get('valo_text'),
                'valo_status': original_entry.get('valo_status'),
                'sensi_text': original_entry.get('sensi_text'),
                'sensi_status': original_entry.get('sensi_status'),
                'cf_ra_text': original_entry.get('cf_ra_text'),
                'cf_ra_status': original_entry.get('cf_ra_status'),
                'acq_text': original_entry.get('acq_text'),
                'root_cause_application': original_entry.get('root_cause_application'),
                'root_cause_type': original_entry.get('root_cause_type'),
                'remarks': original_entry['remarks'],
                'xva_remarks': original_entry.get('xva_remarks'),
                'closing': original_entry.get('closing'),
                'iteration': original_entry.get('iteration'),
                'reg_issue': original_entry.get('reg_issue'),
                'action_taken_and_update': original_entry.get('action_taken_and_update'),
                'reg_status': original_entry.get('reg_status'),
                'reg_prb': original_entry.get('reg_prb'),
                'reg_hiim': original_entry.get('reg_hiim'),
                'backlog_item': original_entry.get('backlog_item'),
                'dare': original_entry.get('dare'),
                'timings': original_entry.get('timings'),
                'puntuality_issue': original_entry.get('puntuality_issue'),
                'quality': original_entry.get('quality'),
                'quality_issue': original_entry.get('quality_issue'),
                'others_prb': original_entry.get('others_prb'),
                'others_hiim': original_entry.get('others_hiim'),
                'grouping_key': grouping_key,
                'created_at': original_entry['created_at'],
                'updated_at': original_entry['updated_at']
            }
            
            # Create main row (preserves original single-value PRB/HIIM/Issue if they exist)
            main_row = {
                **common_data,
                'id': new_entry_id,
                'row_type': 'main',
                'row_position': 0,
                'prb_id_number': original_entry.get('prb_id_number'),
                'prb_id_status': original_entry.get('prb_id_status'),
                'prb_link': original_entry.get('prb_link'),
                'hiim_id_number': original_entry.get('hiim_id_number'),
                'hiim_id_status': original_entry.get('hiim_id_status'),
                'hiim_link': original_entry.get('hiim_link'),
                'issue_description': original_entry.get('issue_description'),
            }
            
            insert_entry_row(cursor, main_row)
            new_entry_id += 1
            
            # Create independent rows for each child PRB
            for idx, prb in enumerate(original_entry['child_prbs']):
                prb_row = {
                    **common_data,
                    'id': new_entry_id,
                    'row_type': 'prb',
                    'row_position': idx + 1,
                    'prb_id_number': prb['prb_id_number'],
                    'prb_id_status': prb['prb_id_status'],
                    'prb_link': prb['prb_link'],
                    # Clear other type-specific fields
                    'hiim_id_number': None,
                    'hiim_id_status': None, 
                    'hiim_link': None,
                    'issue_description': None,
                }
                insert_entry_row(cursor, prb_row)
                new_entry_id += 1
            
            # Create independent rows for each child HIIM
            for idx, hiim in enumerate(original_entry['child_hiims']):
                hiim_row = {
                    **common_data,
                    'id': new_entry_id,
                    'row_type': 'hiim', 
                    'row_position': idx + 1,
                    'hiim_id_number': hiim['hiim_id_number'],
                    'hiim_id_status': hiim['hiim_id_status'],
                    'hiim_link': hiim['hiim_link'],
                    # Clear other type-specific fields
                    'prb_id_number': None,
                    'prb_id_status': None,
                    'prb_link': None,
                    'issue_description': None,
                }
                insert_entry_row(cursor, hiim_row)
                new_entry_id += 1
            
            # Create independent rows for each child issue
            for idx, issue in enumerate(original_entry['child_issues']):
                issue_row = {
                    **common_data,
                    'id': new_entry_id,
                    'row_type': 'issue',
                    'row_position': idx + 1,
                    'issue_description': issue['description'],
                    # Clear other type-specific fields
                    'prb_id_number': None,
                    'prb_id_status': None,
                    'prb_link': None,
                    'hiim_id_number': None,
                    'hiim_id_status': None,
                    'hiim_link': None,
                }
                insert_entry_row(cursor, issue_row)
                new_entry_id += 1
        
        # Step 5: Drop child tables (they're no longer needed)
        print("Removing old child tables...")
        cursor.execute("DROP TABLE IF EXISTS issues")
        cursor.execute("DROP TABLE IF EXISTS prbs") 
        cursor.execute("DROP TABLE IF EXISTS hiims")
        
        # Step 6: Create indexes for performance
        print("Creating indexes...")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_entries_grouping_key ON entries(grouping_key)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_entries_date_app ON entries(date, application_name)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_entries_row_type ON entries(row_type)")
        
        conn.commit()
        print("Migration completed successfully!")
        
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
        # Restore backup
        conn.close()
        os.system(f"cp '{backup_path}' '{db_path}'")
        print(f"Database restored from backup: {backup_path}")
        raise e
    finally:
        conn.close()

def insert_entry_row(cursor, row_data):
    """Helper function to insert a row into entries table"""
    columns = list(row_data.keys())
    placeholders = ', '.join(['?' for _ in columns])
    column_names = ', '.join(columns)
    values = [row_data[col] for col in columns]
    
    query = f"INSERT INTO entries ({column_names}) VALUES ({placeholders})"
    cursor.execute(query, values)

if __name__ == "__main__":
    # Migrate all database files
    db_files = [
        "./data/cvar_all.db",
        "./data/cvar_nyq.db", 
        "./data/xva.db",
        "./data/reg.db",
        "./data/others.db"
    ]
    
    for db_file in db_files:
        if os.path.exists(db_file):
            print(f"\n{'='*50}")
            migrate_to_independent_rows(db_file)
        else:
            print(f"Database file not found: {db_file}")