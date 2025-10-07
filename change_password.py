#!/usr/bin/env python3
"""Change the admin password for ProdVision.

Usage:
  python change_password.py --password NEWPASS
  python change_password.py               # interactive (hidden prompt twice)

The password hash is stored in the settings table under key 'admin_password'
inside the CVAR ALL database (primary adapter) via EntryManager.
"""
import argparse
import getpass
import sys
import bcrypt

from independent_row_adapter import EntryManager

KEY_NAME = 'admin_password'


def prompt_password_interactive():
    pw1 = getpass.getpass('Enter new password: ')
    if not pw1:
        print('❌ Password cannot be empty')
        sys.exit(1)
    pw2 = getpass.getpass('Confirm new password: ')
    if pw1 != pw2:
        print('❌ Passwords do not match')
        sys.exit(1)
    return pw1


def set_password(raw_password: str) -> None:
    # Hash with bcrypt (default cost via gensalt)
    hashed = bcrypt.hashpw(raw_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    em = EntryManager()
    ok = em.set_setting(KEY_NAME, hashed, application_name='CVAR ALL')
    if not ok:
        print('❌ Failed to store password hash')
        sys.exit(2)
    print('✅ Password updated successfully.')


def main():
    parser = argparse.ArgumentParser(description='Change ProdVision admin password')
    parser.add_argument('--password', '-p', help='New password (unsafe to use in shared shell histories)')
    args = parser.parse_args()

    if args.password:
        raw = args.password.strip()
    else:
        raw = prompt_password_interactive()

    if len(raw) < 6:
        print('⚠️  Warning: Password is short (<6 chars). Consider a longer password.')
    set_password(raw)


if __name__ == '__main__':
    main()
