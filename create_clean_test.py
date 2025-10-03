#!/usr/bin/env python3
"""
Create a clean test entry to verify Item Set alignment fix.
"""

import sqlite3
from datetime import datetime

def create_clean_test():
    # Connect directly to database
    conn = sqlite3.connect("data/cvar_all.db")
    cursor = conn.cursor()
    
    # Create a new main entry
    now = datetime.now().isoformat()
    cursor.execute("""
        INSERT INTO main_entries (
            id, priority, time_loss, status, created_at, updated_at, grouping_key
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (None, 'High', 'Test time loss', 'Active', now, now, f'test_{now}'))
    
    entry_id = cursor.lastrowid
    grouping_key = f'test_{now}'
    
    # Add exactly 2 issues
    cursor.execute("""
        INSERT INTO issues (entry_id, description, created_at, grouping_key, array_index)
        VALUES (?, ?, ?, ?, ?)
    """, (entry_id, 'First issue - Item Set 1 (empty PRB/HIIM)', now, grouping_key, 0))
    
    cursor.execute("""
        INSERT INTO issues (entry_id, description, created_at, grouping_key, array_index)
        VALUES (?, ?, ?, ?, ?)
    """, (entry_id, 'Second issue - Item Set 2 (should get PRB/HIIM)', now, grouping_key, 1))
    
    conn.commit()
    conn.close()
    
    print(f"✅ Created clean test entry with ID: {entry_id}")
    print(f"📍 Go to http://localhost:7070 (NOT 5000)")
    print(f"🎯 Test procedure:")
    print(f"1. Find entry ID {entry_id} in CVAR ALL")
    print(f"2. Click Edit")
    print(f"3. You should see exactly 2 Item Set cards")
    print(f"4. Add PRB and HIIM ONLY to 'Item Set 2'")
    print(f"5. Save and verify they stay in Item Set 2")
    
    return entry_id

if __name__ == "__main__":
    create_clean_test()