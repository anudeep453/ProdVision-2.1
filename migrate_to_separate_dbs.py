"""
Migration script to split prodvision.db into cvar_all.db, cvar_nyq.db, xva.db, reg.db
"""
import sqlite3
import os

def migrate_to_separate_dbs():
    src_db = './data/prodvision.db'
    db_map = {
        'CVAR ALL': './data/cvar_all.db',
        'CVAR NYQ': './data/cvar_nyq.db',
        'XVA': './data/xva.db',
        'REG': './data/reg.db'
    }
    if not os.path.exists(src_db):
        print(f"Source database {src_db} not found.")
        return
    src_conn = sqlite3.connect(src_db)
    src_cur = src_conn.cursor()
    src_cur.execute('SELECT * FROM entries')
    columns = [desc[0] for desc in src_cur.description]
    rows = src_cur.fetchall()
    for app, db_path in db_map.items():
        # Create target DB and tables if not exist
        tgt_conn = sqlite3.connect(db_path)
        tgt_cur = tgt_conn.cursor()
        # Create entries table (copy schema from source)
        src_cur.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='entries'")
        create_sql = src_cur.fetchone()[0]
        tgt_cur.execute(create_sql)
        # Copy rows for this application
        for row in rows:
            entry = dict(zip(columns, row))
            if entry.get('application_name') == app:
                placeholders = ','.join(['?'] * len(columns))
                tgt_cur.execute(f"INSERT INTO entries ({','.join(columns)}) VALUES ({placeholders})", row)
        tgt_conn.commit()
        tgt_conn.close()
    src_conn.close()
    print("Migration complete. Data split into separate DBs.")

if __name__ == '__main__':
    migrate_to_separate_dbs()
