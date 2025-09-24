#!/usr/bin/env python3
"""
Fix PRB duplicates in the database
Remove duplicate PRBs that exist in both legacy fields and prbs table
"""

import sqlite3
import os

def fix_prb_duplicates():
    """Remove duplicate PRBs from the database"""
    db_path = "./data/prodvision.db"
    
    if not os.path.exists(db_path):
        print("❌ Database not found at", db_path)
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("🔍 Analyzing PRB duplicates...")
    
    # Find entries that have both legacy PRB fields AND prbs table entries
    cursor.execute('''
        SELECT DISTINCT e.id, e.prb_id_number, e.prb_id_status, e.prb_link
        FROM entries e 
        INNER JOIN prbs p ON e.id = p.entry_id 
        WHERE e.prb_id_number IS NOT NULL AND e.prb_id_number != ''
    ''')
    
    entries_with_duplicates = cursor.fetchall()
    print(f"Found {len(entries_with_duplicates)} entries with potential PRB duplicates")
    
    for entry_id, legacy_prb_number, legacy_prb_status, legacy_prb_link in entries_with_duplicates:
        print(f"\n📋 Processing entry {entry_id}:")
        print(f"  Legacy PRB: {legacy_prb_number} ({legacy_prb_status})")
        
        # Get all PRBs from prbs table for this entry
        cursor.execute('SELECT id, prb_id_number, prb_id_status, prb_link FROM prbs WHERE entry_id = ?', (entry_id,))
        prbs_records = cursor.fetchall()
        
        print(f"  PRBs table entries: {len(prbs_records)}")
        
        # Check for exact duplicates
        duplicate_prb_ids = []
        for prb_id, prb_number, prb_status, prb_link in prbs_records:
            if prb_number == legacy_prb_number:
                print(f"    🔍 Found duplicate PRB {prb_number} in prbs table (ID: {prb_id})")
                duplicate_prb_ids.append(prb_id)
        
        if duplicate_prb_ids:
            print(f"  🧹 Removing {len(duplicate_prb_ids)} duplicate PRB(s) from prbs table...")
            for prb_id in duplicate_prb_ids:
                cursor.execute('DELETE FROM prbs WHERE id = ?', (prb_id,))
            print(f"  ✅ Deleted {len(duplicate_prb_ids)} duplicate PRB(s)")
    
    # Also remove exact duplicates within the prbs table itself
    print("\n🔍 Checking for duplicates within prbs table...")
    cursor.execute('''
        SELECT entry_id, prb_id_number, COUNT(*) as count
        FROM prbs 
        WHERE prb_id_number IS NOT NULL AND prb_id_number != ''
        GROUP BY entry_id, prb_id_number 
        HAVING COUNT(*) > 1
    ''')
    
    internal_duplicates = cursor.fetchall()
    print(f"Found {len(internal_duplicates)} PRB duplicates within prbs table")
    
    for entry_id, prb_number, count in internal_duplicates:
        print(f"📋 Entry {entry_id}: PRB {prb_number} appears {count} times")
        
        # Keep only the first occurrence (lowest ID)
        cursor.execute('''
            DELETE FROM prbs 
            WHERE entry_id = ? AND prb_id_number = ? 
            AND id NOT IN (
                SELECT MIN(id) FROM prbs 
                WHERE entry_id = ? AND prb_id_number = ?
            )
        ''', (entry_id, prb_number, entry_id, prb_number))
        
        deleted_count = cursor.rowcount
        print(f"  ✅ Deleted {deleted_count} duplicate PRB(s)")
    
    # Commit changes
    conn.commit()
    print("\n✅ All PRB duplicates have been cleaned up!")
    
    # Show final stats
    cursor.execute('SELECT COUNT(*) FROM entries WHERE prb_id_number IS NOT NULL AND prb_id_number != ""')
    legacy_count = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM prbs')
    prbs_count = cursor.fetchone()[0]
    
    print(f"\n📊 Final statistics:")
    print(f"  Entries with legacy PRB fields: {legacy_count}")
    print(f"  Total entries in prbs table: {prbs_count}")
    
    conn.close()

if __name__ == "__main__":
    fix_prb_duplicates()