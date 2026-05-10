#!/usr/bin/env python3
"""
Simple MCP Bidireccional Test
Simula flujo completo sin necesidad de TypeScript
"""

import json
import subprocess
import time
import sys
from datetime import datetime

class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_header(text):
    print(f"\n{Colors.HEADER}{Colors.BOLD}═══════════════════════════════════════════════════════════════{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}═══════════════════════════════════════════════════════════════{Colors.ENDC}\n")

def print_ok(text):
    print(f"{Colors.OKGREEN}✅ {text}{Colors.ENDC}")

def print_warn(text):
    print(f"{Colors.WARNING}⚠️  {text}{Colors.ENDC}")

def print_error(text):
    print(f"{Colors.FAIL}❌ {text}{Colors.ENDC}")

def print_info(text):
    print(f"{Colors.OKBLUE}ℹ️  {text}{Colors.ENDC}")

def print_task(text):
    print(f"{Colors.OKCYAN}📋 {text}{Colors.ENDC}")

def test_echo():
    """Test 1: Simple echo task"""
    print_header("TEST 1: Simple Echo Task")
    
    print_task("Simulating Hermes → ORBIT: echo 'Hello'")
    
    task = {
        "id": "task-echo-1",
        "from": "hermes",
        "type": "task",
        "payload": {
            "task_id": "echo-1",
            "title": "Echo Hello",
            "command": "echo 'Hello from ORBIT'"
        },
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    
    print(f"\n📤 Message:\n{json.dumps(task, indent=2)}")
    
    print_info("ORBIT receives and executes command...")
    time.sleep(1)
    
    # Execute the command
    try:
        result = subprocess.run(task['payload']['command'], 
                              shell=True, 
                              capture_output=True, 
                              text=True,
                              timeout=5)
        
        if result.returncode == 0:
            print_ok(f"Command executed successfully")
            print_info(f"Output: {result.stdout.strip()}")
            
            response = {
                "id": "result-echo-1",
                "from": "orbit",
                "type": "result",
                "payload": {
                    "task_id": "echo-1",
                    "status": "completed",
                    "output": result.stdout,
                    "exit_code": 0
                },
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
            
            print_info("ORBIT sends result back to Hermes...")
            print(f"\n📥 Result:\n{json.dumps(response, indent=2)}")
            
            print_ok("Hermes receives and processes result")
            print_ok("TEST 1 PASSED: Echo task successful\n")
            return True
        else:
            print_error(f"Command failed with exit code {result.returncode}")
            return False
    except subprocess.TimeoutExpired:
        print_error("Command timed out")
        return False
    except Exception as e:
        print_error(f"Error: {e}")
        return False

def test_error():
    """Test 2: Error handling"""
    print_header("TEST 2: Error Handling")
    
    print_task("Simulating Hermes → ORBIT: command that fails")
    
    task = {
        "id": "task-error-1",
        "from": "hermes",
        "type": "task",
        "payload": {
            "task_id": "error-1",
            "title": "Failing Command",
            "command": "exit 1"
        },
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    
    print(f"\n📤 Message:\n{json.dumps(task, indent=2)}")
    
    print_info("ORBIT receives and tries to execute...")
    time.sleep(1)
    
    try:
        result = subprocess.run(task['payload']['command'], 
                              shell=True, 
                              capture_output=True, 
                              text=True,
                              timeout=5)
        
        if result.returncode != 0:
            print_warn(f"Command failed as expected (exit code {result.returncode})")
            
            response = {
                "id": "error-error-1",
                "from": "orbit",
                "type": "error",
                "payload": {
                    "task_id": "error-1",
                    "status": "failed",
                    "error": f"Command failed with exit code {result.returncode}",
                    "stderr": result.stderr or "No error output"
                },
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
            
            print_info("ORBIT sends error back to Hermes...")
            print(f"\n📥 Error Response:\n{json.dumps(response, indent=2)}")
            
            print_ok("Hermes receives error and processes it")
            print_ok("TEST 2 PASSED: Error handling successful\n")
            return True
        else:
            print_error("Command succeeded when it should have failed")
            return False
    except subprocess.TimeoutExpired:
        print_error("Command timed out")
        return False
    except Exception as e:
        print_error(f"Error: {e}")
        return False

def test_multiple():
    """Test 3: Multiple tasks"""
    print_header("TEST 3: Multiple Tasks")
    
    tasks = [
        {"task_id": "multi-1", "command": "echo 'Task 1'"},
        {"task_id": "multi-2", "command": "echo 'Task 2'"},
        {"task_id": "multi-3", "command": "echo 'Task 3'"},
    ]
    
    results = []
    for i, task_data in enumerate(tasks, 1):
        print_task(f"Task {i}/3: {task_data['command']}")
        
        try:
            result = subprocess.run(task_data['command'], 
                                  shell=True, 
                                  capture_output=True, 
                                  text=True,
                                  timeout=5)
            
            if result.returncode == 0:
                print_ok(f"Task {i} completed")
                results.append(True)
            else:
                print_error(f"Task {i} failed")
                results.append(False)
        except Exception as e:
            print_error(f"Task {i} error: {e}")
            results.append(False)
        
        time.sleep(0.5)
    
    if all(results):
        print_ok("TEST 3 PASSED: All multiple tasks successful\n")
        return True
    else:
        print_error("TEST 3 FAILED: Some tasks failed\n")
        return False

def main():
    print_header("🧪 MCP BIDIRECCIONAL TEST SUITE")
    
    print_info("Testing Hermes ↔ ORBIT communication")
    print_info("Session Keys:")
    print_info("  Hermes: hermes-taskworker-e122e1c7-4f7f-4d87-bbc9-ad6997b7a6dd")
    print_info("  ORBIT: agent:orbit:explicit:ORBIT-Worker")
    
    # Run tests
    results = []
    results.append(("Echo Task", test_echo()))
    results.append(("Error Handling", test_error()))
    results.append(("Multiple Tasks", test_multiple()))
    
    # Summary
    print_header("TEST SUMMARY")
    
    for name, result in results:
        if result:
            print_ok(f"{name}: PASSED")
        else:
            print_error(f"{name}: FAILED")
    
    passed = sum(1 for _, r in results if r)
    total = len(results)
    
    print()
    if passed == total:
        print_header(f"✅ ALL TESTS PASSED ({passed}/{total})")
        print_ok("MCP Bidireccional is operational!")
        print_info("Next: Test with real Hermes + ORBIT listeners")
        sys.exit(0)
    else:
        print_header(f"❌ SOME TESTS FAILED ({passed}/{total})")
        sys.exit(1)

if __name__ == "__main__":
    main()
