#!/bin/bash

# Real MCP Integration Test
# Inicia listeners reales y prueba comunicación

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     🔄 REAL MCP INTEGRATION TEST — Hermes ↔ ORBIT             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

WORKSPACE="/Users/nextaisolutionscr/.openclaw/workspace"
HERMES_SESSION="hermes-taskworker-e122e1c7-4f7f-4d87-bbc9-ad6997b7a6dd"
ORBIT_SESSION="agent:orbit:explicit:ORBIT-Worker"

echo "📋 Configuration:"
echo "   Workspace: $WORKSPACE"
echo "   Hermes Session: $HERMES_SESSION"
echo "   ORBIT Session: $ORBIT_SESSION"
echo ""

# Check if files exist
if [ ! -f "$WORKSPACE/orbit-listener.ts" ]; then
    echo "❌ orbit-listener.ts not found"
    exit 1
fi

if [ ! -f "$WORKSPACE/hermes-listener.ts" ]; then
    echo "❌ hermes-listener.ts not found"
    exit 1
fi

echo "✅ All files found"
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "NEXT STEPS:"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "1️⃣ TERMINAL A (ORBIT Listener):"
echo "   cd $WORKSPACE"
echo "   node orbit-listener.ts"
echo ""
echo "2️⃣ TERMINAL B (Hermes Listener):"
echo "   cd $WORKSPACE"
echo "   node hermes-listener.ts"
echo ""
echo "3️⃣ TERMINAL C (Test Commands):"
echo "   cd $WORKSPACE"
echo "   bash run-real-test.sh commands"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

if [ "$1" == "commands" ]; then
    echo "🚀 Sending test commands..."
    echo ""
    
    # Give listeners time to start
    sleep 2
    
    echo "📤 TEST 1: Simple echo"
    echo "   Command: echo 'Hello from real test'"
    cat << 'TASK1' | node
const message = {
  id: "task-real-1",
  from: "hermes",
  type: "task",
  payload: {
    task_id: "real-1",
    title: "Real Test - Echo",
    command: "echo 'Hello from real test'"
  },
  timestamp: new Date().toISOString()
};
console.log(JSON.stringify(message));
TASK1
    
    sleep 1
    
    echo ""
    echo "📤 TEST 2: Show current directory"
    echo "   Command: pwd"
    cat << 'TASK2' | node
const message = {
  id: "task-real-2",
  from: "hermes",
  type: "task",
  payload: {
    task_id: "real-2",
    title: "Real Test - PWD",
    command: "pwd"
  },
  timestamp: new Date().toISOString()
};
console.log(JSON.stringify(message));
TASK2
    
    sleep 1
    
    echo ""
    echo "📤 TEST 3: List files"
    echo "   Command: ls -la *.ts | head -5"
    cat << 'TASK3' | node
const message = {
  id: "task-real-3",
  from: "hermes",
  type: "task",
  payload: {
    task_id: "real-3",
    title: "Real Test - LS",
    command: "ls -la *.ts | head -5"
  },
  timestamp: new Date().toISOString()
};
console.log(JSON.stringify(message));
TASK3
    
    sleep 1
    
    echo ""
    echo "📤 TEST 4: Error test"
    echo "   Command: false (will fail)"
    cat << 'TASK4' | node
const message = {
  id: "task-real-4",
  from: "hermes",
  type: "task",
  payload: {
    task_id: "real-4",
    title: "Real Test - Error",
    command: "false"
  },
  timestamp: new Date().toISOString()
};
console.log(JSON.stringify(message));
TASK4
    
    echo ""
    echo "✅ Test commands sent!"
    echo "   Check Terminal A (ORBIT) for execution logs"
    echo "   Check Terminal B (Hermes) for result processing"
    
else
    echo "⏳ Ready for testing"
    echo ""
    echo "To run tests, open 3 terminals:"
    echo ""
    echo "Terminal A: cd $WORKSPACE && node orbit-listener.ts"
    echo "Terminal B: cd $WORKSPACE && node hermes-listener.ts"
    echo "Terminal C: bash run-real-test.sh commands"
fi
