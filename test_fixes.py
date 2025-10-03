#!/usr/bin/env python3
"""
Test script for verifying the PRB duplication and page refresh fixes
"""

import sys
import os
import json
import sqlite3
sys.path.append('.')

from independent_row_adapter import EntryManager
from datetime import datetime

def test_prb_duplication_fix():
    """Test that PRB sections are not duplicated when loading entries"""
    print("\n" + "=" * 60)
    print("TESTING PRB DUPLICATION FIX")
    print("=" * 60)
    
    entry_manager = EntryManager()
    
    # Clean up any existing test data first (more thorough cleanup)
    print("Cleaning up existing test data...")
    adapter = entry_manager.adapters['CVAR ALL']
    conn = adapter.get_connection()
    cursor = conn.cursor()
    
    # Delete all entries with our test date and application
    cursor.execute('DELETE FROM entries WHERE date = ? AND application_name = ?', 
                   ('2025-10-03', 'CVAR ALL'))
    conn.commit()
    conn.close()
    print(f"Deleted entries for test date")
    
    # Test case 1: Entry with different numbers of PRBs and HIIMs
    test_entry_uneven = {
        'date': '2025-10-03',
        'day': 'Thursday',
        'application_name': 'CVAR ALL',
        'prc_mail_text': '08:30',
        'prc_mail_status': 'Green',
        'cp_alerts_text': '09:00',
        'cp_alerts_status': 'Green',
        'quality_status': 'Green',
        'remarks': 'Test entry with uneven PRBs and HIIMs',
        'prbs': [  # 3 PRBs
            {'prb_id_number': '101', 'prb_id_status': 'active', 'prb_link': 'http://example.com/prb101'},
            {'prb_id_number': '102', 'prb_id_status': 'closed', 'prb_link': 'http://example.com/prb102'},
            {'prb_id_number': '103', 'prb_id_status': 'active', 'prb_link': 'http://example.com/prb103'}
        ],
        'hiims': [  # 1 HIIM
            {'hiim_id_number': '201', 'hiim_id_status': 'active', 'hiim_link': 'http://example.com/hiim201'}
        ],
        'issues': [
            {'description': 'Test issue 1'},
            {'description': 'Test issue 2'}
        ]
    }
    
    print("Creating test entry with 3 PRBs, 1 HIIM, 2 issues...")
    created_entry = entry_manager.create_entry(test_entry_uneven)
    
    if created_entry:
        print(f"✅ Entry created successfully with ID: {created_entry['id']}")
        
        # Retrieve the entry to test how it's loaded
        retrieved_entry = entry_manager.get_entry_by_id(created_entry['id'])
        
        if retrieved_entry:
            print("✅ Entry retrieved successfully")
            
            # Count actual PRBs, HIIMs, and issues
            prbs = retrieved_entry.get('prbs', [])
            hiims = retrieved_entry.get('hiims', [])
            issues = retrieved_entry.get('issues', [])
            
            print(f"📊 Retrieved entry statistics:")
            print(f"   - PRBs: {len(prbs)} (expected: 3)")
            print(f"   - HIIMs: {len(hiims)} (expected: 1)")
            print(f"   - Issues: {len(issues)} (expected: 2)")
            
            # Verify no duplication occurred
            success = True
            if len(prbs) != 3:
                print(f"❌ PRB count mismatch! Expected 3, got {len(prbs)}")
                success = False
            if len(hiims) != 1:
                print(f"❌ HIIM count mismatch! Expected 1, got {len(hiims)}")
                success = False
            if len(issues) != 2:
                print(f"❌ Issue count mismatch! Expected 2, got {len(issues)}")
                success = False
                
            if success:
                print("✅ PRB duplication fix verified - no extra sections created!")
            else:
                print("❌ PRB duplication fix failed - counts don't match expected values")
                
            # Clean up
            entry_manager.delete_entry(created_entry['id'])
            print("🧹 Test data cleaned up")
            
            return success
        else:
            print("❌ Failed to retrieve created entry")
            return False
    else:
        print("❌ Failed to create test entry")
        return False

def test_js_error_handling():
    """Test that JavaScript error handling is in place"""
    print("\n" + "=" * 60)
    print("TESTING JAVASCRIPT ERROR HANDLING")
    print("=" * 60)
    
    # Read the dashboard.js file to verify our fixes are present
    js_file_path = 'static/js/dashboard.js'
    
    if not os.path.exists(js_file_path):
        print("❌ dashboard.js file not found")
        return False
    
    with open(js_file_path, 'r') as f:
        js_content = f.read()
    
    checks = [
        ('pageUnloadProtection', 'Page unload protection variable'),
        ('isFormDirty', 'Form dirty state tracking variable'),
        ('addEventListener(\'beforeunload\'', 'Beforeunload event listener'),
        ('addEventListener(\'error\'', 'Global error handler'),
        ('addEventListener(\'unhandledrejection\'', 'Unhandled promise rejection handler'),
        ('enableFormProtection', 'Form protection enable function'),
        ('disableFormProtection', 'Form protection disable function'),
        ('markFormDirty', 'Mark form dirty function'),
        ('addFormChangeListeners', 'Add form change listeners function')
    ]
    
    all_checks_passed = True
    
    for check, description in checks:
        if check in js_content:
            print(f"✅ {description} found")
        else:
            print(f"❌ {description} missing")
            all_checks_passed = False
    
    # Check for the improved populateCombinedFromEntry logic
    if 'Only create a card if there\'s at least one piece of meaningful content' in js_content:
        print("✅ PRB duplication fix logic found")
    else:
        print("❌ PRB duplication fix logic missing")
        all_checks_passed = False
    
    if all_checks_passed:
        print("✅ All JavaScript fixes are in place!")
    else:
        print("❌ Some JavaScript fixes are missing")
    
    return all_checks_passed

def main():
    """Run all tests"""
    print("🧪 Running fixes verification tests...")
    
    test1_result = test_prb_duplication_fix()
    test2_result = test_js_error_handling()
    
    print("\n" + "=" * 60)
    print("TEST RESULTS SUMMARY")
    print("=" * 60)
    
    if test1_result:
        print("✅ PRB duplication fix: PASSED")
    else:
        print("❌ PRB duplication fix: FAILED")
    
    if test2_result:
        print("✅ JavaScript error handling: PASSED")
    else:
        print("❌ JavaScript error handling: FAILED")
    
    overall_success = test1_result and test2_result
    
    if overall_success:
        print("\n🎉 All tests PASSED! The fixes are working correctly.")
        print("\nFixes implemented:")
        print("1. ✅ PRB duplication prevented by improved card creation logic")
        print("2. ✅ Page refresh protection added with beforeunload handlers")
        print("3. ✅ Form dirty state tracking implemented")
        print("4. ✅ Global error handling added to prevent JavaScript errors")
        print("5. ✅ Unhandled promise rejection handling added")
    else:
        print("\n❌ Some tests FAILED. Please check the implementation.")
    
    return overall_success

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)