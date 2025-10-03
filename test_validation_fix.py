#!/usr/bin/env python3
"""
Test the validation fix for null values in arrays.
"""

import json
import requests

def test_validation_fix():
    print("🔧 Testing Validation Fix for Null Values")
    print("=" * 45)
    
    # Test data that matches the format from the frontend
    test_payload = {
        "date": "2025-10-02",
        "day": "Thursday", 
        "application_name": "CVAR ALL",
        "issue_description": "",
        "prb_id_number": None,
        "prb_id_status": "",
        "prb_link": "",
        "hiim_id_number": None,
        "hiim_id_status": "",
        "hiim_link": "",
        "remarks": "",
        "time_loss": "",
        "prc_mail_text": "12:33",
        "prc_mail_status": "Green",
        "cp_alerts_text": "",
        "cp_alerts_status": "",
        "quality_status": "",
        "issues": [
            {"description": "test"},
            {"description": "test1"}
        ],
        "prbs": [
            None,  # This null value was causing the error
            {
                "prb_id_number": 111111,
                "prb_id_status": "",
                "prb_link": "",
                "related_issue": "test1"
            }
        ],
        "hiims": [
            None,  # This null value was causing the error
            {
                "hiim_id_number": 11111,
                "hiim_id_status": "",
                "hiim_link": "",
                "related_issue": "test1"
            }
        ]
    }
    
    print("✅ Test payload prepared with null values in arrays")
    print(f"📋 Issues: {len(test_payload['issues'])} items")
    print(f"📋 PRBs: {len(test_payload['prbs'])} items (with null placeholder)")
    print(f"📋 HIIMs: {len(test_payload['hiims'])} items (with null placeholder)")
    
    print(f"\n🎯 Expected Result:")
    print(f"   ✓ Validation should pass (no more 'NoneType' error)")
    print(f"   ✓ Entry should be created successfully")
    print(f"   ✓ Item Set 1: Issue 'test' with no PRB/HIIM")
    print(f"   ✓ Item Set 2: Issue 'test1' with PRB 111111 and HIIM 11111")
    
    try:
        # Make the API call
        response = requests.post(
            'http://localhost:7070/api/entries',
            json=test_payload,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 201:
            result = response.json()
            print(f"\n🎉 SUCCESS: Entry created with ID {result.get('id')}")
            print(f"✅ Validation fix is working correctly!")
            print(f"✅ Null values in arrays are handled properly")
            return True
        else:
            print(f"\n❌ FAILED: Status {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"\n⚠️  Cannot connect to Flask app at http://localhost:7070")
        print(f"Please start the Flask app with: python3 app.py")
        return False
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    test_validation_fix()