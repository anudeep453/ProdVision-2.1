#!/usr/bin/env python3
"""
Master script to add dummy data for all dashboards with Time Loss field
"""

import sys
import os
import subprocess

def run_script(script_name, description):
    """Run a dummy data script and return success status"""
    try:
        print(f"\n{'='*60}")
        print(f"🚀 Running {description}...")
        print(f"{'='*60}")
        
        result = subprocess.run([sys.executable, script_name], 
                              capture_output=True, text=True, cwd=os.getcwd())
        
        if result.returncode == 0:
            print(result.stdout)
            print(f"✅ {description} completed successfully!")
            return True
        else:
            print(f"❌ {description} failed!")
            print("STDOUT:", result.stdout)
            print("STDERR:", result.stderr)
            return False
    except Exception as e:
        print(f"❌ Error running {description}: {str(e)}")
        return False

def main():
    print("🎯 ProdVision Dummy Data Generator with Time Loss Field")
    print("=" * 70)
    print("This script will create realistic dummy data for all dashboards")
    print("including the new Time Loss field with proper timing validation.")
    print("=" * 70)
    
    # Scripts to run in order
    scripts = [
        ("add_dummy_data_cvar_all.py", "CVAR ALL Dummy Data"),
        ("add_dummy_data_cvar_nyq.py", "CVAR NYQ Dummy Data"),
        ("add_dummy_data_xva.py", "XVA Dummy Data"),
        ("add_dummy_data_reg.py", "REG Dummy Data"),
        ("add_dummy_data_others.py", "OTHERS Dummy Data")
    ]
    
    successful = 0
    failed = 0
    
    for script_name, description in scripts:
        if os.path.exists(script_name):
            if run_script(script_name, description):
                successful += 1
            else:
                failed += 1
        else:
            print(f"❌ Script {script_name} not found!")
            failed += 1
    
    # Summary
    print(f"\n{'='*70}")
    print(f"📊 SUMMARY")
    print(f"{'='*70}")
    print(f"✅ Successful: {successful} dashboards")
    print(f"❌ Failed: {failed} dashboards")
    print(f"📈 Total scripts: {len(scripts)}")
    
    if successful == len(scripts):
        print(f"\n🎉 ALL DUMMY DATA CREATED SUCCESSFULLY!")
        print(f"🚀 Ready to test all dashboards with realistic data!")
        print(f"✅ All entries include Time Loss field with proper timing formats")
        print(f"\nTime Loss examples included:")
        print(f"- 15 min, 30 minutes, 1 hour")
        print(f"- 1hr 30min, 2hrs 15min") 
        print(f"- 45 mins, 90 minutes, 3 hours")
    else:
        print(f"\n⚠️  Some scripts failed. Please check the error messages above.")
    
    print(f"\n🔧 Next steps:")
    print(f"1. Start the application: python3 app.py")
    print(f"2. Open browser: http://127.0.0.1:7070")
    print(f"3. Test each dashboard (CVAR ALL, CVAR NYQ, XVA, REG, OTHERS)")
    print(f"4. Verify Time Loss column appears correctly")
    print(f"5. Test add/edit functionality with Time Loss validation")

if __name__ == "__main__":
    main()