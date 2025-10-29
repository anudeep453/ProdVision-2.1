"""
Independent Row SQLite Adapter
Each application uses its own SQLite DB; rows are independent (no parent-child relationships).
"""

import os
import sqlite3
from datetime import datetime
from typing import Dict, List, Optional, Any
import logging

logger = logging.getLogger("prodvision.adapter")

class IndependentRowSQLiteAdapter:
    """SQLite adapter with independent row structure - no parent-child dependencies"""
    
    def __init__(self, db_name: str = "prodvision.db"):
        self.db_name = db_name
        self.local_db_path = f"./data/{db_name}"
        self.ensure_data_directory()
        
        # Initialize local database
        self.init_database()
    
    def ensure_data_directory(self):
        """Ensure data directory exists"""
        data_dir = os.path.dirname(self.local_db_path)
        if not os.path.exists(data_dir):
            os.makedirs(data_dir)
    
    def init_database(self):
        """Initialize SQLite database with independent row structure"""
        conn = sqlite3.connect(self.local_db_path)
        cursor = conn.cursor()
        
        # Create entries table - each row is completely independent
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                
                -- Basic entry information
                date TEXT NOT NULL,
                day TEXT,
                application_name TEXT NOT NULL,
                
                -- Row type and grouping (for UI display only)
                row_type TEXT DEFAULT 'main' CHECK(row_type IN ('main', 'prb', 'hiim', 'issue')),
                grouping_key TEXT,  -- Computed field for UI grouping (date + application)
                row_position INTEGER DEFAULT 0,  -- Position within group for ordering
                
                -- Common fields (duplicated across all rows for same date)
                prc_mail_text TEXT,
                prc_mail_status TEXT,
                cp_alerts_text TEXT,
                cp_alerts_status TEXT,
                quality_status TEXT,
                quality_legacy TEXT,
                quality_target TEXT,
                remarks TEXT,
                
                -- XVA-specific common fields
                valo_text TEXT,
                valo_status TEXT,
                sensi_text TEXT,
                sensi_status TEXT,
                cf_ra_text TEXT,
                cf_ra_status TEXT,
                acq_text TEXT,
                root_cause_application TEXT,
                root_cause_type TEXT,
                xva_remarks TEXT,
                
                -- REG-specific common fields
                closing TEXT,
                iteration TEXT,
                reg_issue TEXT,
                action_taken_and_update TEXT,
                reg_status TEXT,
                reg_prb TEXT,
                reg_hiim TEXT,
                backlog_item TEXT,
                
                -- OTHERS-specific common fields

                timings TEXT,
                timings_status TEXT,
                puntuality_issue TEXT,
                quality TEXT,
                quality_status TEXT,
                quality_issue TEXT,
                others_prb TEXT,
                others_hiim TEXT,
                business_chain TEXT,
                
                -- Row-specific fields (only one type populated per row)
                -- PRB fields (populated when row_type='prb' or row_type='main' with PRB)
                prb_id_number TEXT,
                prb_id_status TEXT,
                prb_link TEXT,
                
                -- HIIM fields (populated when row_type='hiim' or row_type='main' with HIIM)
                hiim_id_number TEXT,
                hiim_id_status TEXT,
                hiim_link TEXT,
                
                -- Issue fields (populated when row_type='issue' or row_type='main' with issue)
                issue_description TEXT,
                
                -- Time Loss fields (applicable to CVAR applications)
                time_loss TEXT,
                
                -- Manual Infrastructure Weekend flag for Monday entries
                -- NULL = auto-detect 3rd Monday, 0 = manually unchecked, 1 = manually checked
                infra_weekend_manual INTEGER DEFAULT NULL,
                
                -- Timestamps
                created_at TEXT,
                updated_at TEXT
            )
        ''')
        
        # Create settings table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        ''')
        
        # Create indexes for performance
        # First check if required columns exist and add them for backward compatibility
        cursor.execute("PRAGMA table_info(entries)")
        columns = [column[1] for column in cursor.fetchall()]
        
        # Add missing columns for backward compatibility
        missing_columns = [
            ('grouping_key', 'TEXT'),
            ('row_type', "TEXT DEFAULT 'main' CHECK(row_type IN ('main', 'prb', 'hiim', 'issue'))"),
            ('row_position', 'INTEGER DEFAULT 0'),
            ('time_loss', 'TEXT'),
            ('infra_weekend_manual', 'INTEGER DEFAULT NULL'),  # NULL = auto-detect, 0 = manually unchecked, 1 = manually checked
            ('timings_status', 'TEXT'),
            ('quality_status', 'TEXT'),
            ('business_chain', 'TEXT')
        ]
        
        for column_name, column_def in missing_columns:
            if column_name not in columns:
                cursor.execute(f"ALTER TABLE entries ADD COLUMN {column_name} {column_def}")
        
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_entries_grouping_key ON entries(grouping_key)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_entries_date_app ON entries(date, application_name)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_entries_row_type ON entries(row_type)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date)")
        
        conn.commit()
        conn.close()
    
    def get_connection(self):
        """Get database connection with proper consistency settings"""
        conn = sqlite3.connect(self.local_db_path)
        # Ensure immediate consistency and proper transaction handling
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA synchronous=FULL") 
        conn.execute("PRAGMA read_uncommitted=0")
        # Enable foreign key constraints for data integrity
        conn.execute("PRAGMA foreign_keys=ON")
        return conn
    
    def generate_grouping_key(self, date: str, application_name: str) -> str:
        """Generate grouping key for UI display grouping"""
        return f"{date}_{application_name}"
    
    def create_entry(self, entry_data: Dict) -> Optional[Dict]:
        """
        Create new independent entries
        Input can be:
        1. Single entry with single PRB/HIIM/Issue
        2. Single entry with arrays of PRBs/HIIMs/Issues
        
        Each will be stored as independent rows
        """
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            now = datetime.utcnow().isoformat()
            date = entry_data.get('date', '')
            application_name = entry_data.get('application_name', '')
            # Ensure grouping_key always matches the date field
            correct_grouping_key = self.generate_grouping_key(date, application_name)
            # If grouping_key is present and does not match, override it
            if entry_data.get('grouping_key') != correct_grouping_key:
                entry_data['grouping_key'] = correct_grouping_key
            grouping_key = correct_grouping_key
            
            # Common data to be duplicated across all rows (excluding time_loss which is item-specific)
            common_data = {
                'date': date,
                'day': entry_data.get('day', ''),
                'application_name': application_name,
                'grouping_key': grouping_key,
                'prc_mail_text': entry_data.get('prc_mail_text', ''),
                'prc_mail_status': entry_data.get('prc_mail_status', ''),
                'cp_alerts_text': entry_data.get('cp_alerts_text', ''),
                'cp_alerts_status': entry_data.get('cp_alerts_status', ''),
                'quality_status': entry_data.get('quality_status', ''),
                'quality_legacy': entry_data.get('quality_legacy', ''),
                'quality_target': entry_data.get('quality_target', ''),
                'remarks': entry_data.get('remarks', ''),
                'valo_text': entry_data.get('valo_text', ''),
                'valo_status': entry_data.get('valo_status', ''),
                'sensi_text': entry_data.get('sensi_text', ''),
                'sensi_status': entry_data.get('sensi_status', ''),
                'cf_ra_text': entry_data.get('cf_ra_text', ''),
                'cf_ra_status': entry_data.get('cf_ra_status', ''),
                'acq_text': entry_data.get('acq_text', ''),
                'root_cause_application': entry_data.get('root_cause_application', ''),
                'root_cause_type': entry_data.get('root_cause_type', ''),
                'xva_remarks': entry_data.get('xva_remarks', ''),
                'closing': entry_data.get('closing', ''),
                'iteration': entry_data.get('iteration', ''),
                'reg_issue': entry_data.get('reg_issue', ''),
                'action_taken_and_update': entry_data.get('action_taken_and_update', ''),
                'reg_status': entry_data.get('reg_status', ''),
                'reg_prb': entry_data.get('reg_prb', ''),
                'reg_hiim': entry_data.get('reg_hiim', ''),
                'backlog_item': entry_data.get('backlog_item', ''),

                'timings': entry_data.get('timings', ''),
                'timings_status': entry_data.get('timings_status', ''),
                'puntuality_issue': entry_data.get('puntuality_issue', ''),
                'quality': entry_data.get('quality', ''),
                'quality_status': entry_data.get('quality_status', ''),
                'quality_issue': entry_data.get('quality_issue', ''),
                'others_prb': entry_data.get('others_prb', ''),
                'others_hiim': entry_data.get('others_hiim', ''),
                'business_chain': entry_data.get('business_chain', ''),
                # time_loss removed from common_data - it should be specific to each issue
                'infra_weekend_manual': entry_data.get('infra_weekend_manual'),
                'created_at': now,
                'updated_at': now
            }
            
            created_entries = []
            
            # Create main entry (handles legacy single-value fields only if no arrays present)
            prbs_array = entry_data.get('prbs', [])
            hiims_array = entry_data.get('hiims', [])
            issues_array = entry_data.get('issues', [])
            
            # Only include legacy PRB/HIIM data in main entry if no arrays are provided
            main_prb_id = entry_data.get('prb_id_number', '') if not prbs_array else ''
            main_prb_status = entry_data.get('prb_id_status', '') if not prbs_array else ''
            main_prb_link = entry_data.get('prb_link', '') if not prbs_array else ''
            if not main_prb_link and main_prb_id:
                main_prb_link = f"https://unity.itsm.socgen/saw/Problem/{main_prb_id}/general"
            main_hiim_id = entry_data.get('hiim_id_number', '') if not hiims_array else ''
            main_hiim_status = entry_data.get('hiim_id_status', '') if not hiims_array else ''
            main_hiim_link = entry_data.get('hiim_link', '') if not hiims_array else ''
            if not main_hiim_link and main_hiim_id:
                main_hiim_link = f"https://unity.itsm.socgen/saw/custom/HighImpactIncident_c/details/{main_hiim_id}/general"
            main_issue_desc = entry_data.get('issue_description', '') if not issues_array else ''
            
            main_entry = {
                **common_data,
                'row_type': 'main',
                'row_position': 0,
                'prb_id_number': main_prb_id,
                'prb_id_status': main_prb_status,
                'prb_link': main_prb_link,
                'hiim_id_number': main_hiim_id,
                'hiim_id_status': main_hiim_status,
                'hiim_link': main_hiim_link,
                'issue_description': main_issue_desc,
                'time_loss': entry_data.get('time_loss', '') if not issues_array else '',  # Only use legacy time_loss if no issues array
            }
            
            entry_id = self._insert_row(cursor, main_entry)
            main_entry['id'] = entry_id
            created_entries.append(main_entry)
            
            # Create independent rows with position representing Item Set number
            # Create PRBs with Item Set position alignment
            for item_set_position, prb in enumerate(prbs_array):
                if prb is None:
                    # Skip None placeholders during creation
                    continue
                    
                prb_id = str(prb.get('prb_id_number', '')) if prb.get('prb_id_number') is not None else ''
                prb_link = prb.get('prb_link', '')
                if not prb_link and prb_id:
                    prb_link = f"https://unity.itsm.socgen/saw/Problem/{prb_id}/general"
                prb_entry = {
                    **common_data,
                    'row_type': 'prb',
                    'row_position': item_set_position,  # This represents Item Set number (0, 1, 2, etc.)
                    'prb_id_number': prb_id,
                    'prb_id_status': prb.get('prb_id_status', ''),
                    'prb_link': prb_link,
                    # Clear other type-specific fields for independence
                    'hiim_id_number': '',
                    'hiim_id_status': '',
                    'hiim_link': '',
                    'issue_description': '',
                    'time_loss': '',  # PRBs don't have time_loss
                }
                entry_id = self._insert_row(cursor, prb_entry)
                prb_entry['id'] = entry_id
                created_entries.append(prb_entry)
            
            # Create HIIMs with Item Set position alignment  
            for item_set_position, hiim in enumerate(hiims_array):
                if hiim is None:
                    # Skip None placeholders during creation
                    continue
                    
                hiim_id = str(hiim.get('hiim_id_number', '')) if hiim.get('hiim_id_number') is not None else ''
                hiim_link = hiim.get('hiim_link', '')
                if not hiim_link and hiim_id:
                    hiim_link = f"https://unity.itsm.socgen/saw/custom/HighImpactIncident_c/details/{hiim_id}/general"
                hiim_entry = {
                    **common_data,
                    'row_type': 'hiim',
                    'row_position': item_set_position,  # This represents Item Set number (0, 1, 2, etc.)
                    'hiim_id_number': hiim_id,
                    'hiim_id_status': hiim.get('hiim_id_status', ''),
                    'hiim_link': hiim_link,
                    # Clear other type-specific fields for independence
                    'prb_id_number': '',
                    'prb_id_status': '',
                    'prb_link': '',
                    'issue_description': '',
                    'time_loss': '',  # HIIMs don't have time_loss
                }
                entry_id = self._insert_row(cursor, hiim_entry)
                hiim_entry['id'] = entry_id
                created_entries.append(hiim_entry)
            
            # Create Issues with Item Set position alignment
            for item_set_position, issue in enumerate(issues_array):
                if issue is None:
                    # Skip None placeholders during creation
                    continue
                    
                issue_entry = {
                    **common_data,
                    'row_type': 'issue',
                    'row_position': item_set_position,  # This represents Item Set number (0, 1, 2, etc.)
                    'issue_description': issue.get('description', ''),
                    # Use only the issue's own time_loss value, no fallback to common data
                    'time_loss': issue.get('time_loss', ''),
                    # Clear other type-specific fields for independence
                    'prb_id_number': '',
                    'prb_id_status': '',
                    'prb_link': '',
                    'hiim_id_number': '',
                    'hiim_id_status': '',
                    'hiim_link': '',
                }
                
                entry_id = self._insert_row(cursor, issue_entry)
                issue_entry['id'] = entry_id
                created_entries.append(issue_entry)
            
            conn.commit()
            
            # Return the main entry with attached arrays for API compatibility
            result = created_entries[0].copy()  # Main entry
            result['prbs'] = [e for e in created_entries if e['row_type'] == 'prb']
            result['hiims'] = [e for e in created_entries if e['row_type'] == 'hiim']
            result['issues'] = [{'description': e['issue_description'], 'time_loss': e.get('time_loss', ''), 'row_position': e.get('row_position', 0)} for e in created_entries if e['row_type'] == 'issue']
            
            return result
            
        except Exception as e:
            conn.rollback()
            logger.error("Error creating entry: %s", e, exc_info=True)
            raise e
        finally:
            conn.close()
    
    def _insert_row(self, cursor, row_data):
        """Helper to insert a single row and return its ID"""
        columns = list(row_data.keys())
        placeholders = ', '.join(['?' for _ in columns])
        column_names = ', '.join(columns)
        values = [row_data[col] for col in columns]
        
        query = f"INSERT INTO entries ({column_names}) VALUES ({placeholders})"
        cursor.execute(query, values)
        return cursor.lastrowid
    
    def get_entries_by_application(self, application_name: str, start_date: str = None, end_date: str = None) -> List[Dict]:
        """
        Get independent entries and group them for UI display compatibility
        Returns entries grouped by date with arrays for multiple PRBs/HIIMs/Issues
        """
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Build query
        query = "SELECT * FROM entries WHERE application_name = ?"
        params = [application_name]
        
        if start_date:
            query += " AND date >= ?"
            params.append(start_date)
        
        if end_date:
            query += " AND date <= ?"
            params.append(end_date)
        
        query += " ORDER BY date DESC, grouping_key, row_position"
        
        cursor.execute(query, params)
        columns = [description[0] for description in cursor.description]
        all_rows = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        # Group independent rows by grouping_key for UI display
        grouped_entries = {}
        for row in all_rows:
            grouping_key = row['grouping_key']
            if grouping_key not in grouped_entries:
                grouped_entries[grouping_key] = {
                    'main': None,
                    'prbs': [],
                    'hiims': [],
                    'issues': []
                }
            
            if row['row_type'] == 'main':
                grouped_entries[grouping_key]['main'] = row
            elif row['row_type'] == 'prb':
                grouped_entries[grouping_key]['prbs'].append(row)
            elif row['row_type'] == 'hiim':
                grouped_entries[grouping_key]['hiims'].append(row)
            elif row['row_type'] == 'issue':
                grouped_entries[grouping_key]['issues'].append({'description': row['issue_description'], 'time_loss': row.get('time_loss', ''), 'row_position': row.get('row_position', 0)})
        
        # Convert back to API-compatible format
        result_entries = []
        for grouping_key, group in grouped_entries.items():
            if group['main']:
                # Standard case: we have a main entry, group everything together
                main_entry = group['main'].copy()
                main_entry['prbs'] = group['prbs']
                main_entry['hiims'] = group['hiims']
                main_entry['issues'] = group['issues']
                result_entries.append(main_entry)
            else:
                # Special case: no main entry, but we have individual rows
                # Return each individual row but enrich it with data from other rows in the same grouping
                all_individual_rows = group['prbs'] + group['hiims']
                
                # Add issues as individual entries too
                for issue in group['issues']:
                    issue_entry = {
                        'row_type': 'issue',
                        'grouping_key': grouping_key,
                        'issue_description': issue.get('description', ''),
                        'time_loss': issue.get('time_loss', ''),
                        'row_position': issue.get('row_position', 0)
                    }
                    # Copy common fields from the first available row
                    if all_individual_rows:
                        for key in ['application_name', 'date', 'created_at', 'updated_at']:
                            if key in all_individual_rows[0]:
                                issue_entry[key] = all_individual_rows[0][key]
                    all_individual_rows.append(issue_entry)
                
                # Enrich each individual row with data from other rows in the same grouping
                for row in all_individual_rows:
                    enriched_row = row.copy()
                    
                    # Add PRBs data
                    enriched_row['prbs'] = group['prbs']
                    if not enriched_row.get('prb_id_number') and group['prbs']:
                        # If this row doesn't have PRB data, use the first PRB from the group
                        enriched_row['prb_id_number'] = group['prbs'][0].get('prb_id_number', '')
                        enriched_row['prb_id_status'] = group['prbs'][0].get('prb_id_status', '')
                        enriched_row['prb_link'] = group['prbs'][0].get('prb_link', '')
                    
                    # Add HIIMs data
                    enriched_row['hiims'] = group['hiims']
                    if not enriched_row.get('hiim_id_number') and group['hiims']:
                        # If this row doesn't have HIIM data, use the first HIIM from the group
                        enriched_row['hiim_id_number'] = group['hiims'][0].get('hiim_id_number', '')
                        enriched_row['hiim_id_status'] = group['hiims'][0].get('hiim_id_status', '')
                        enriched_row['hiim_link'] = group['hiims'][0].get('hiim_link', '')
                    
                    # Add issues data
                    enriched_row['issues'] = group['issues']
                    if not enriched_row.get('issue_description') and group['issues']:
                        # If this row doesn't have issue data, use the first issue from the group
                        enriched_row['issue_description'] = group['issues'][0].get('description', '')
                    
                    # Add time loss data from issues if not present
                    if not enriched_row.get('time_loss') and group['issues']:
                        for issue in group['issues']:
                            if issue.get('time_loss') and issue.get('time_loss').strip():
                                enriched_row['time_loss'] = issue.get('time_loss')
                                break
                    
                    result_entries.append(enriched_row)
        
        conn.close()
        return result_entries

    def get_individual_rows_by_application(self, application_name: str, start_date: str = None, end_date: str = None, 
                                         row_type_filter: str = None) -> List[Dict]:
        """
        Get individual rows without grouping for row-level filtering
        Used when filters need to work at individual row level (e.g., PRB only, HIIM only)
        """
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Build query
        query = "SELECT * FROM entries WHERE application_name = ?"
        params = [application_name]
        
        if start_date:
            query += " AND date >= ?"
            params.append(start_date)
        
        if end_date:
            query += " AND date <= ?"
            params.append(end_date)
        
        # Add row type filter if specified (e.g., only PRB rows, only HIIM rows, only Time Loss rows)
        if row_type_filter:
            if row_type_filter == 'prb':
                # Include ALL rows marked as PRB type, regardless of prb_id_number content
                # Also include main rows that have actual PRB data
                query += " AND (row_type = 'prb' OR (row_type = 'main' AND prb_id_number IS NOT NULL AND prb_id_number != ''))"
            elif row_type_filter == 'hiim':
                # Include ALL rows marked as HIIM type, regardless of hiim_id_number content
                # Also include main rows that have actual HIIM data
                query += " AND (row_type = 'hiim' OR (row_type = 'main' AND hiim_id_number IS NOT NULL AND hiim_id_number != ''))"
            elif row_type_filter == 'issue':
                # Include ALL rows marked as issue type, regardless of issue_description content
                # Also include main rows that have actual issue data
                query += " AND (row_type = 'issue' OR (row_type = 'main' AND issue_description IS NOT NULL AND issue_description != ''))"
            elif row_type_filter == 'time_loss':
                # FIX FOR DUPLICATION ISSUE:
                # Time loss data can be stored in both main rows and issue rows.
                # When both exist for the same entry, we get duplicates in filtered results.
                # Solution: Prioritize issue rows over main rows to prevent duplicates.
                # Only show main rows with time loss if they don't have associated issue rows with time loss.
                query += """ AND (
                    (
                        row_type = 'issue' 
                        AND time_loss IS NOT NULL 
                        AND TRIM(time_loss) != '' 
                        AND TRIM(UPPER(time_loss)) NOT IN ('N/A', 'NA', 'NONE', 'NULL')
                    )
                    OR 
                    (
                        row_type = 'main' 
                        AND time_loss IS NOT NULL 
                        AND TRIM(time_loss) != '' 
                        AND TRIM(UPPER(time_loss)) NOT IN ('N/A', 'NA', 'NONE', 'NULL')
                        AND NOT EXISTS (
                            SELECT 1 FROM entries e2 
                            WHERE e2.grouping_key = entries.grouping_key 
                            AND e2.row_type = 'issue' 
                            AND e2.time_loss IS NOT NULL 
                            AND TRIM(e2.time_loss) != '' 
                            AND TRIM(UPPER(e2.time_loss)) NOT IN ('N/A', 'NA', 'NONE', 'NULL')
                        )
                    )
                )"""
        
        query += " ORDER BY date DESC, grouping_key, row_position"
        
        cursor.execute(query, params)
        columns = [description[0] for description in cursor.description]
        all_rows = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        # Convert rows to API-compatible format with individual row data
        result_entries = []
        for row in all_rows:
            # Create a formatted entry for each individual row
            formatted_row = row.copy()
            
            # Add compatibility fields for frontend
            if row['row_type'] == 'prb':
                formatted_row['prbs'] = [{'prb_id_number': row['prb_id_number'], 'prb_id_status': row['prb_id_status'], 'prb_link': row['prb_link']}]
                formatted_row['hiims'] = []
                formatted_row['issues'] = []
            elif row['row_type'] == 'hiim':
                formatted_row['prbs'] = []
                formatted_row['hiims'] = [{'hiim_id_number': row['hiim_id_number'], 'hiim_id_status': row['hiim_id_status'], 'hiim_link': row['hiim_link']}]
                formatted_row['issues'] = []
            elif row['row_type'] == 'issue':
                formatted_row['prbs'] = []
                formatted_row['hiims'] = []
                formatted_row['issues'] = [{'description': row['issue_description'], 'time_loss': row.get('time_loss', ''), 'row_position': row.get('row_position', 0)}]
            elif row['row_type'] == 'main':
                # For main rows, include individual fields as arrays if they exist
                formatted_row['prbs'] = [{'prb_id_number': row['prb_id_number'], 'prb_id_status': row['prb_id_status'], 'prb_link': row['prb_link']}] if row.get('prb_id_number') else []
                formatted_row['hiims'] = [{'hiim_id_number': row['hiim_id_number'], 'hiim_id_status': row['hiim_id_status'], 'hiim_link': row['hiim_link']}] if row.get('hiim_id_number') else []
                formatted_row['issues'] = [{'description': row['issue_description'], 'time_loss': row.get('time_loss', ''), 'row_position': row.get('row_position', 0)}] if row.get('issue_description') else []
            
            result_entries.append(formatted_row)
        
        conn.close()
        return result_entries
    
    def update_entry(self, entry_id: int, entry_data: Dict, application_name: str = None) -> Optional[Dict]:
        """
        Comprehensive update for independent entries
        Handles updating main entry and managing related PRBs/HIIMs/issues
        """
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            # Get current entry to understand its structure
            cursor.execute("SELECT * FROM entries WHERE id = ?", (entry_id,))
            row = cursor.fetchone()
            if not row:
                conn.close()
                return None
            
            columns = [description[0] for description in cursor.description]
            current_entry = dict(zip(columns, row))
            
            # If this is a main entry, we need to handle comprehensive updates
            if current_entry['row_type'] == 'main':
                return self._update_main_entry_comprehensive(cursor, entry_id, entry_data, current_entry)
            else:
                # For non-main entries, just update the single row
                return self._update_single_row(cursor, entry_id, entry_data)
                
        except Exception as e:
            conn.rollback()
            logger.error("Error updating entry %s: %s", entry_id, e, exc_info=True)
            return None
        finally:
            conn.close()
    
    def _update_main_entry_comprehensive(self, cursor, entry_id: int, entry_data: Dict, current_entry: Dict) -> Optional[Dict]:
        """Handle comprehensive update of main entry and all related data"""
        try:
            # Get the grouping key for this entry
            grouping_key = current_entry['grouping_key']
            if not grouping_key:
                grouping_key = f"{current_entry['date']}_{current_entry['application_name']}"
            
            # 1. Update the main entry fields
            main_fields = {}
            for field, value in entry_data.items():
                if field not in ['id', 'prbs', 'hiims', 'issues']:
                    main_fields[field] = value
            
            # Update main entry
            if main_fields:
                update_fields = []
                update_values = []
                for field, value in main_fields.items():
                    update_fields.append(f"{field} = ?")
                    update_values.append(value)
                
                update_fields.append("updated_at = ?")
                update_values.append(datetime.utcnow().isoformat())
                update_values.append(entry_id)
                
                query = f"UPDATE entries SET {', '.join(update_fields)} WHERE id = ?"
                cursor.execute(query, update_values)
            
            # 2. Handle PRBs
            self._update_related_rows(cursor, grouping_key, 'prb', entry_data.get('prbs', []))
            
            # 3. Handle HIIMs  
            self._update_related_rows(cursor, grouping_key, 'hiim', entry_data.get('hiims', []))
            
            # 4. Handle Issues
            self._update_related_rows(cursor, grouping_key, 'issue', entry_data.get('issues', []))
            
            cursor.connection.commit()
            
            # Return the updated entry with all related data
            return self.get_entry_by_id(entry_id)
            
        except Exception as e:
            cursor.connection.rollback()
            raise e
    
    def _update_related_rows(self, cursor, grouping_key: str, row_type: str, new_data: List[Dict]):
        """Update related rows (PRBs, HIIMs, issues) for a grouping key"""
        # Get existing rows of this type
        cursor.execute(
            "SELECT id FROM entries WHERE grouping_key = ? AND row_type = ?",
            (grouping_key, row_type)
        )
        existing_ids = [row[0] for row in cursor.fetchall()]
        
        # Track which IDs are being kept
        updated_ids = []
        
        # Process new data - maintain Item Set position alignment
        for i, item_data in enumerate(new_data):
            if item_data is None:
                # Handle empty slots: delete any existing row at this position
                cursor.execute(
                    "DELETE FROM entries WHERE grouping_key = ? AND row_type = ? AND row_position = ?",
                    (grouping_key, row_type, i)
                )
                continue
                
            if 'id' in item_data and item_data['id'] in existing_ids:
                # Update existing row and ensure correct position
                self._update_existing_related_row(cursor, item_data['id'], item_data, row_type)
                # Update position to match Item Set alignment
                cursor.execute(
                    "UPDATE entries SET row_position = ? WHERE id = ?",
                    (i, item_data['id'])
                )
                updated_ids.append(item_data['id'])
            else:
                # Create new row at correct Item Set position
                new_id = self._create_new_related_row(cursor, grouping_key, item_data, row_type, i)
                updated_ids.append(new_id)
        
        # Delete rows that are no longer needed
        for existing_id in existing_ids:
            if existing_id not in updated_ids:
                cursor.execute("DELETE FROM entries WHERE id = ?", (existing_id,))
    
    def _update_existing_related_row(self, cursor, row_id: int, item_data: Dict, row_type: str):
        """Update an existing related row"""
        update_fields = []
        update_values = []
        
        if row_type == 'prb':
            fields_map = {
                'prb_id_number': item_data.get('prb_id_number'),
                'prb_id_status': item_data.get('prb_id_status'), 
                'prb_link': item_data.get('prb_link')
            }
        elif row_type == 'hiim':
            fields_map = {
                'hiim_id_number': item_data.get('hiim_id_number'),
                'hiim_id_status': item_data.get('hiim_id_status'),
                'hiim_link': item_data.get('hiim_link')
            }
        elif row_type == 'issue':
            fields_map = {
                'issue_description': item_data.get('description', item_data.get('issue_description')),
                'time_loss': item_data.get('time_loss', '')
            }
        
        for field, value in fields_map.items():
            # Only update fields that have meaningful values
            # For time_loss, treat None, empty string, or whitespace-only as no value
            if field == 'time_loss':
                if value is not None and str(value).strip():
                    update_fields.append(f"{field} = ?")
                    update_values.append(str(value).strip())
                elif value == '':
                    # Explicitly set empty time_loss to empty string (clear existing value)
                    update_fields.append(f"{field} = ?")
                    update_values.append('')
            elif value is not None and str(value).strip():
                update_fields.append(f"{field} = ?")
                update_values.append(value)
        
        if update_fields:
            update_fields.append("updated_at = ?")
            update_values.append(datetime.utcnow().isoformat())
            update_values.append(row_id)
            
            query = f"UPDATE entries SET {', '.join(update_fields)} WHERE id = ?"
            cursor.execute(query, update_values)
    
    def _create_new_related_row(self, cursor, grouping_key: str, item_data: Dict, row_type: str, position: int) -> int:
        """Create a new related row"""
        # Get the main entry data for copying common fields
        cursor.execute(
            "SELECT * FROM entries WHERE grouping_key = ? AND row_type = 'main' LIMIT 1", 
            (grouping_key,)
        )
        main_row = cursor.fetchone()
        
        if not main_row:
            raise Exception(f"No main entry found for grouping_key: {grouping_key}")
        
        columns = [description[0] for description in cursor.description]
        main_data = dict(zip(columns, main_row))
        
        # Create new row data
        new_row_data = {
            'date': main_data['date'],
            'day': main_data['day'],
            'application_name': main_data['application_name'],
            'row_type': row_type,
            'grouping_key': grouping_key,
            'row_position': position,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        # Copy common fields from main entry
        common_fields = [
            'prc_mail_text', 'prc_mail_status', 'cp_alerts_text', 'cp_alerts_status',
            'quality_status', 'quality_legacy', 'quality_target', 'remarks',
            'valo_text', 'valo_status', 'sensi_text', 'sensi_status',
            'cf_ra_text', 'cf_ra_status', 'acq_text', 'root_cause_application',
            'root_cause_type', 'xva_remarks', 'closing', 'iteration', 'reg_issue',
            'action_taken_and_update', 'reg_status', 'reg_prb', 'reg_hiim',
            'backlog_item', 'timings', 'puntuality_issue', 'quality',
            'quality_issue', 'others_prb', 'others_hiim'
        ]
        
        for field in common_fields:
            if field in main_data:
                new_row_data[field] = main_data[field]
        
        # Set type-specific fields
        if row_type == 'prb':
            new_row_data.update({
                'prb_id_number': item_data.get('prb_id_number'),
                'prb_id_status': item_data.get('prb_id_status'),
                'prb_link': item_data.get('prb_link')
            })
        elif row_type == 'hiim':
            new_row_data.update({
                'hiim_id_number': item_data.get('hiim_id_number'),
                'hiim_id_status': item_data.get('hiim_id_status'),
                'hiim_link': item_data.get('hiim_link')
            })
        elif row_type == 'issue':
            # Handle time_loss properly - only set if there's a meaningful value
            time_loss_value = item_data.get('time_loss', '')
            if time_loss_value is None:
                time_loss_value = ''
            
            new_row_data.update({
                'issue_description': item_data.get('description', item_data.get('issue_description')),
                'time_loss': str(time_loss_value).strip()
            })
        
        # Insert the new row
        return self._insert_row(cursor, new_row_data)
    
    def _update_single_row(self, cursor, entry_id: int, entry_data: Dict) -> Optional[Dict]:
        """Update a single row (non-main entry)"""
        update_fields = []
        update_values = []
        
        for field, value in entry_data.items():
            if field != 'id':
                update_fields.append(f"{field} = ?")
                update_values.append(value)
        
        update_values.append(datetime.utcnow().isoformat())
        update_fields.append("updated_at = ?")
        update_values.append(entry_id)
        
        query = f"UPDATE entries SET {', '.join(update_fields)} WHERE id = ?"
        cursor.execute(query, update_values)
        
        # Return updated entry
        cursor.execute("SELECT * FROM entries WHERE id = ?", (entry_id,))
        columns = [description[0] for description in cursor.description]
        updated_row = dict(zip(columns, cursor.fetchone()))
        
        cursor.connection.commit()
        return updated_row
    
    def delete_entry(self, entry_id: int) -> bool:
        """
        Delete an entry and all related rows that belong to the same logical entry
        This ensures complete deletion of the entire entry group (main, PRB, HIIM, issue rows)
        """
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            # First, get the grouping_key of the entry to be deleted
            cursor.execute("SELECT grouping_key FROM entries WHERE id = ?", (entry_id,))
            result = cursor.fetchone()
            
            if not result:
                logger.debug(f"Entry {entry_id} not found for deletion")
                return False  # Entry not found
            
            grouping_key = result[0]
            logger.debug(f"Deleting all entries with grouping_key: {grouping_key}")
            
            # Delete all rows with the same grouping_key (entire logical entry)
            cursor.execute("DELETE FROM entries WHERE grouping_key = ?", (grouping_key,))
            deleted_count = cursor.rowcount
            deleted = deleted_count > 0
            
            logger.debug(f"Deleted {deleted_count} rows for grouping_key: {grouping_key}")
            
            conn.commit()
            
            # Force WAL checkpoint and ensure all changes are written to the main database
            cursor.execute("PRAGMA wal_checkpoint(TRUNCATE)")
            cursor.execute("PRAGMA synchronous=FULL") 
            
            # Additional verification: check that the entries are actually gone
            cursor.execute("SELECT COUNT(*) FROM entries WHERE grouping_key = ?", (grouping_key,))
            remaining_count = cursor.fetchone()[0]
            if remaining_count > 0:
                logger.warning(f"Warning: {remaining_count} entries still exist with grouping_key {grouping_key} after deletion")
            
            return deleted
        except Exception as e:
            logger.error(f"Error deleting entry {entry_id}: {e}")
            conn.rollback()
            raise e
        finally:
            conn.close()
    
    def get_all_entries(self) -> List[Dict]:
        """Get all independent entries grouped for UI display"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM entries ORDER BY date DESC, grouping_key, row_position")
        columns = [description[0] for description in cursor.description]
        all_rows = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        # Group by grouping_key
        grouped_entries = {}
        for row in all_rows:
            grouping_key = row['grouping_key']
            if grouping_key not in grouped_entries:
                grouped_entries[grouping_key] = {
                    'main': None,
                    'prbs': [],
                    'hiims': [],
                    'issues': []
                }
            
            if row['row_type'] == 'main':
                grouped_entries[grouping_key]['main'] = row
            elif row['row_type'] == 'prb':
                grouped_entries[grouping_key]['prbs'].append(row)
            elif row['row_type'] == 'hiim':
                grouped_entries[grouping_key]['hiims'].append(row)
            elif row['row_type'] == 'issue':
                grouped_entries[grouping_key]['issues'].append({'description': row['issue_description'], 'time_loss': row.get('time_loss', ''), 'row_position': row.get('row_position', 0)})
        
        # Convert to API format
        result_entries = []
        for grouping_key, group in grouped_entries.items():
            if group['main']:
                main_entry = group['main'].copy()
                main_entry['prbs'] = group['prbs']
                main_entry['hiims'] = group['hiims']
                main_entry['issues'] = group['issues']
                result_entries.append(main_entry)
        
        conn.close()
        return result_entries
    
    def get_entry_by_id(self, entry_id: int, application_name: str = None) -> Optional[Dict]:
        """Get a specific entry by ID from the independent row structure"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # First, get the specific entry with the requested ID
            cursor.execute('SELECT * FROM entries WHERE id = ?', (entry_id,))
            target_row = cursor.fetchone()
            
            if not target_row:
                conn.close()
                return None
            
            # Get column names
            columns = [description[0] for description in cursor.description]
            target_entry = dict(zip(columns, target_row))
            
            # Ensure business_chain field exists for OTHERS entries
            if target_entry.get('application_name', '').upper() == 'OTHERS' and 'business_chain' not in target_entry:
                target_entry['business_chain'] = ''
            # If this is a main entry, we need to find related PRBs, HIIMs, and issues
            # that share the same grouping_key
            if target_entry['row_type'] == 'main':
                grouping_key = target_entry['grouping_key']
                if not grouping_key:
                    # Generate grouping key if missing
                    grouping_key = f"{target_entry['date']}_{target_entry['application_name']}"
                
                # Get all related rows with the same grouping key
                cursor.execute('''
                    SELECT * FROM entries 
                    WHERE grouping_key = ? OR (date = ? AND application_name = ?)
                    ORDER BY row_position ASC, id ASC
                ''', (grouping_key, target_entry['date'], target_entry['application_name']))
                
                related_rows = cursor.fetchall()
                related_dicts = [dict(zip(columns, row)) for row in related_rows]
                
                # Build position-based arrays with null placeholders for Item Set alignment
                prb_dict = {}
                hiim_dict = {}
                issue_dict = {}
                max_position = 0
                
                for row in related_dicts:
                    if row['id'] == entry_id:
                        # This is our main entry, keep it as target_entry
                        continue
                    
                    position = row.get('row_position', 0)
                    max_position = max(max_position, position)
                    
                    if row['row_type'] == 'prb':
                        prb_dict[position] = {
                            'id': row['id'],
                            'prb_id_number': row['prb_id_number'],
                            'prb_id_status': row['prb_id_status'],
                            'prb_link': row['prb_link'],
                            'row_position': position,  # Include position for frontend
                            'created_at': row['created_at']
                        }
                    elif row['row_type'] == 'hiim':
                        hiim_dict[position] = {
                            'id': row['id'],
                            'hiim_id_number': row['hiim_id_number'],
                            'hiim_id_status': row['hiim_id_status'],
                            'hiim_link': row['hiim_link'],
                            'row_position': position,  # Include position for frontend
                            'created_at': row['created_at']
                        }
                    elif row['row_type'] == 'issue':
                        issue_dict[position] = {
                            'id': row['id'],
                            'description': row['issue_description'],
                            'time_loss': row.get('time_loss', ''),
                            'row_position': position,  # Include position for frontend
                            'created_at': row['created_at']
                        }
                
                # Build arrays with null placeholders to maintain Item Set positions
                prbs = []
                hiims = []
                issues = []
                
                for i in range(max_position + 1):
                    prbs.append(prb_dict.get(i, None))
                    hiims.append(hiim_dict.get(i, None))
                    issues.append(issue_dict.get(i, None))
                
                # Attach position-aligned arrays to main entry
                target_entry['prbs'] = prbs
                target_entry['hiims'] = hiims
                target_entry['issues'] = issues
            else:
                # For non-main entries, just return the entry with empty arrays
                target_entry['prbs'] = []
                target_entry['hiims'] = []
                target_entry['issues'] = []
            
            conn.close()
            return target_entry
            
        except Exception as e:
            logger.error("Error in get_entry_by_id(%s): %s", entry_id, e, exc_info=True)
            return None
    
    def get_setting(self, key: str) -> Optional[str]:
        """Get a setting value from the database"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT value FROM settings WHERE key = ?", (key,))
        result = cursor.fetchone()
        
        conn.close()
        return result[0] if result else None
    
    def set_setting(self, key: str, value: str) -> bool:
        """Set a setting value in the database"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute(
                "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
                (key, value)
            )
            
            conn.commit()
            conn.close()
            return True
        except Exception:
            return False


class EntryManager:
    """Entry manager for independent rows across multiple databases"""
    
    def __init__(self):
        self.adapters = {
            'CVAR ALL': IndependentRowSQLiteAdapter('cvar_all.db'),
            'CVAR NYQ': IndependentRowSQLiteAdapter('cvar_nyq.db'),
            'XVA': IndependentRowSQLiteAdapter('xva.db'),
            'REG': IndependentRowSQLiteAdapter('reg.db'),
            'OTHERS': IndependentRowSQLiteAdapter('others.db')
        }
    
    def get_entries_by_application(self, application_name: str, start_date: str = None, end_date: str = None) -> List[Dict]:
        """Get entries for specific application"""
        adapter = self.adapters.get(application_name.upper())
        if not adapter:
            return []
        return adapter.get_entries_by_application(application_name, start_date, end_date)

    def get_individual_rows_by_application(self, application_name: str, start_date: str = None, end_date: str = None, 
                                         row_type_filter: str = None) -> List[Dict]:
        """Get individual rows without grouping for row-level filtering"""
        adapter = self.adapters.get(application_name.upper())
        if not adapter:
            return []
        return adapter.get_individual_rows_by_application(application_name, start_date, end_date, row_type_filter)

    def get_all_individual_rows(self, row_type_filter: str = None) -> List[Dict]:
        """Get all individual rows from all databases without grouping"""
        all_rows = []
        for app_name, adapter in self.adapters.items():
            rows = adapter.get_individual_rows_by_application(app_name, None, None, row_type_filter)
            all_rows.extend(rows)
        return all_rows
    
    def get_entry_by_id(self, entry_id: int, application_name: str = None) -> Optional[Dict]:
        """Get a specific entry by ID"""
        if application_name:
            # First try the specific application database
            adapter = self.adapters.get(application_name.upper())
            if adapter:
                entry = adapter.get_entry_by_id(entry_id, application_name)
                if entry:
                    return entry
        
        # If not found in specific application or no application specified, search all databases
        for app_name, adapter in self.adapters.items():
            try:
                entry = adapter.get_entry_by_id(entry_id)
                if entry:
                    return entry
            except Exception:
                continue
        return None
    
    def create_entry(self, entry_data: Dict) -> Optional[Dict]:
        """Create entry in appropriate database"""
        application_name = entry_data.get('application_name', '').upper()
        adapter = self.adapters.get(application_name)
        if not adapter:
            return None
        return adapter.create_entry(entry_data)
    
    def update_entry(self, entry_id: int, entry_data: Dict, application_name: str = None) -> Optional[Dict]:
        """Update entry in appropriate database"""
        # Use provided application_name or extract from entry_data
        if application_name:
            target_app = application_name.upper()
        else:
            target_app = entry_data.get('application_name', '').upper()
        
        adapter = self.adapters.get(target_app)
        if not adapter:
            return None
        return adapter.update_entry(entry_id, entry_data)
    
    def delete_entry(self, entry_id: int, application_name: str = None) -> bool:
        """Delete entry from appropriate database"""
        if application_name:
            # Delete from specific application database
            adapter = self.adapters.get(application_name.upper())
            if not adapter:
                return False
            return adapter.delete_entry(entry_id)
        else:
            # Search all databases and delete from the one that contains the entry
            for app_name, adapter in self.adapters.items():
                try:
                    if adapter.delete_entry(entry_id):
                        return True
                except Exception:
                    continue
            return False
    
    def get_all_entries(self) -> List[Dict]:
        """Get all entries from all databases"""
        all_entries = []
        for app_name, adapter in self.adapters.items():
            entries = adapter.get_all_entries()
            all_entries.extend(entries)
        return all_entries
    
    def get_setting(self, key: str, application_name: str = 'CVAR ALL') -> Optional[str]:
        """Get a setting value from the appropriate database"""
        adapter = self.adapters.get(application_name.upper())
        if not adapter:
            # Default to CVAR ALL if application not found
            adapter = self.adapters.get('CVAR ALL')
        return adapter.get_setting(key) if adapter else None
    
    def set_setting(self, key: str, value: str, application_name: str = 'CVAR ALL') -> bool:
        """Set a setting value in the appropriate database"""
        adapter = self.adapters.get(application_name.upper())
        if not adapter:
            # Default to CVAR ALL if application not found
            adapter = self.adapters.get('CVAR ALL')
        return adapter.set_setting(key, value) if adapter else False
    
    def _ensure_datasets_exist(self) -> bool:
        """Ensure all database tables exist - they are created automatically"""
        return True  # SQLite tables are created automatically in init_database()
