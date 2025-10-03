"""
New Independent Row Database Schema Design

Current Problem:
- Entries table stores main data
- Child tables (prbs, hiims, issues) create parent-child dependencies via foreign keys
- This couples multiple rows at the database level

New Solution:
- Single flattened entries table where each row is completely independent
- Each PRB, HIIM, or Issue gets its own row in the entries table
- All rows for the same date share the same common data (date, prc_mail, etc.)
- No foreign key relationships between rows
- UI groups by date for display only

Schema Changes:
1. Remove child tables (prbs, hiims, issues)
2. Add row_type field to distinguish between different types of entries
3. Add grouping_key to identify rows that should be visually grouped (same date + application)
4. Store one specific item per row (either PRB, HIIM, or Issue)

New entries table structure:
- id: Primary key (independent for each row)
- date: Entry date
- application_name: Application type
- row_type: 'main', 'prb', 'hiim', 'issue' (indicates what this row represents)
- grouping_key: Computed field for UI grouping (date + application_name)
- 
- Common fields (shared across all rows for same date):
  - prc_mail_text, prc_mail_status
  - cp_alerts_text, cp_alerts_status
  - quality_status, remarks
  
- Row-specific fields (only populated based on row_type):
  - prb_id_number, prb_id_status, prb_link (for row_type='prb')
  - hiim_id_number, hiim_id_status, hiim_link (for row_type='hiim')
  - issue_description (for row_type='issue')

Benefits:
- Each row is completely independent at database level
- No cascading deletes or foreign key constraints
- Can process, update, delete any row without affecting others
- UI grouping is purely presentation layer
- Maintains data integrity through application logic, not DB constraints
"""

# Example of new data structure:

# Old structure (parent-child):
old_entry_example = {
    "id": 1,
    "date": "2025-10-03",
    "application_name": "CVAR ALL",
    "prc_mail_text": "08:30",
    "prc_mail_status": "Green",
    "cp_alerts_text": "09:00", 
    "cp_alerts_status": "Green",
    "quality_status": "Green",
    "remarks": "No issues",
    "prbs": [  # Child records in separate table
        {"prb_id_number": "123", "prb_id_status": "active"},
        {"prb_id_number": "456", "prb_id_status": "closed"}
    ],
    "hiims": [  # Child records in separate table
        {"hiim_id_number": "789", "hiim_id_status": "active"}
    ],
    "issues": [  # Child records in separate table
        {"description": "Network slowness"}
    ]
}

# New structure (independent rows):
new_entries_example = [
    # Main entry row
    {
        "id": 1,
        "date": "2025-10-03",
        "application_name": "CVAR ALL",
        "row_type": "main",
        "grouping_key": "2025-10-03_CVAR ALL",
        "prc_mail_text": "08:30",
        "prc_mail_status": "Green",
        "cp_alerts_text": "09:00",
        "cp_alerts_status": "Green", 
        "quality_status": "Green",
        "remarks": "No issues",
        # All other fields null for main row
    },
    # Independent PRB row 1
    {
        "id": 2,
        "date": "2025-10-03",
        "application_name": "CVAR ALL", 
        "row_type": "prb",
        "grouping_key": "2025-10-03_CVAR ALL",
        "prc_mail_text": "08:30",  # Duplicated for independence
        "prc_mail_status": "Green",
        "cp_alerts_text": "09:00",
        "cp_alerts_status": "Green",
        "quality_status": "Green", 
        "remarks": "No issues",
        "prb_id_number": "123",
        "prb_id_status": "active",
        # All other PRB/HIIM/Issue fields null
    },
    # Independent PRB row 2
    {
        "id": 3,
        "date": "2025-10-03",
        "application_name": "CVAR ALL",
        "row_type": "prb", 
        "grouping_key": "2025-10-03_CVAR ALL",
        "prc_mail_text": "08:30",  # Duplicated for independence
        "prc_mail_status": "Green",
        "cp_alerts_text": "09:00",
        "cp_alerts_status": "Green",
        "quality_status": "Green",
        "remarks": "No issues", 
        "prb_id_number": "456",
        "prb_id_status": "closed",
    },
    # Independent HIIM row
    {
        "id": 4,
        "date": "2025-10-03",
        "application_name": "CVAR ALL",
        "row_type": "hiim",
        "grouping_key": "2025-10-03_CVAR ALL", 
        "prc_mail_text": "08:30",  # Duplicated for independence
        "prc_mail_status": "Green",
        "cp_alerts_text": "09:00",
        "cp_alerts_status": "Green",
        "quality_status": "Green",
        "remarks": "No issues",
        "hiim_id_number": "789",
        "hiim_id_status": "active",
    },
    # Independent Issue row
    {
        "id": 5,
        "date": "2025-10-03", 
        "application_name": "CVAR ALL",
        "row_type": "issue",
        "grouping_key": "2025-10-03_CVAR ALL",
        "prc_mail_text": "08:30",  # Duplicated for independence
        "prc_mail_status": "Green",
        "cp_alerts_text": "09:00", 
        "cp_alerts_status": "Green",
        "quality_status": "Green",
        "remarks": "No issues",
        "issue_description": "Network slowness",
    }
]