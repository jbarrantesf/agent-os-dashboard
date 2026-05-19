"""
Control Tower Kanban API — FastAPI Gateway
Provides REST + WebSocket interface to Hermes Kanban DB

Run: python -m uvicorn api:app --host 0.0.0.0 --port 8000 --reload
"""

from fastapi import FastAPI, APIRouter, Query, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Dict
from datetime import datetime
from pathlib import Path
import asyncio
import json
import sqlite3

# ============================================================================
# Hermes Kanban DB Wrapper (SQLite)
# ============================================================================

class KanbanDB:
    """SQLite-backed kanban database wrapper"""
    
    def __init__(self, board="default"):
        self.db_path = Path.home() / ".hermes" / "kanban" / f"{board}.db"
        self.board = board
        
        # Ensure database exists
        if not self.db_path.exists():
            self.db_path.parent.mkdir(parents=True, exist_ok=True)
            self._init_db()
    
    def _init_db(self):
        """Initialize database schema"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                status TEXT DEFAULT 'triage',
                assigned_to TEXT,
                project TEXT,
                estimated_hours REAL,
                priority TEXT DEFAULT 'medium',
                created_at TEXT,
                updated_at TEXT
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS comments (
                id TEXT PRIMARY KEY,
                task_id TEXT NOT NULL,
                text TEXT,
                author TEXT,
                created_at TEXT,
                FOREIGN KEY(task_id) REFERENCES tasks(id)
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id TEXT PRIMARY KEY,
                task_id TEXT NOT NULL,
                event_type TEXT,
                data TEXT,
                created_at TEXT,
                FOREIGN KEY(task_id) REFERENCES tasks(id)
            )
        """)
        
        conn.commit()
        conn.close()
    
    def list_tasks(self, status=None, assigned_to=None, project=None) -> List[Dict]:
        """List all tasks with optional filters"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        query = "SELECT * FROM tasks WHERE 1=1"
        params = []
        
        if status:
            query += " AND status = ?"
            params.append(status)
        if assigned_to:
            query += " AND assigned_to = ?"
            params.append(assigned_to)
        if project:
            query += " AND project = ?"
            params.append(project)
        
        query += " ORDER BY created_at DESC"
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    def get_task(self, task_id: str) -> Optional[Dict]:
        """Get single task"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None
    
    def claim(self, task_id: str, assignee: str) -> bool:
        """Claim task"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE tasks SET assigned_to = ?, status = 'in-progress', updated_at = ? WHERE id = ?",
            (assignee, datetime.now().isoformat(), task_id)
        )
        conn.commit()
        conn.close()
        return True
    
    def complete(self, task_id: str) -> bool:
        """Mark task as done"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE tasks SET status = 'done', updated_at = ? WHERE id = ?",
            (datetime.now().isoformat(), task_id)
        )
        conn.commit()
        conn.close()
        return True
    
    def comment(self, task_id: str, text: str, author: str = "hermes") -> str:
        """Add comment to task"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        comment_id = f"comment-{datetime.now().timestamp()}"
        cursor.execute(
            """INSERT INTO comments (id, task_id, text, author, created_at) 
               VALUES (?, ?, ?, ?, ?)""",
            (comment_id, task_id, text, author, datetime.now().isoformat())
        )
        conn.commit()
        conn.close()
        return comment_id
    
    def get_comments(self, task_id: str) -> List[Dict]:
        """Get comments for task"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM comments WHERE task_id = ? ORDER BY created_at DESC", (task_id,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    
    def get_events(self, task_id: str) -> List[Dict]:
        """Get events for task"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM events WHERE task_id = ? ORDER BY created_at DESC LIMIT 20", (task_id,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    
    def stats(self) -> Dict:
        """Get stats by status and assignee"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # By status
        cursor.execute("SELECT status, COUNT(*) as count FROM tasks GROUP BY status")
        status_stats = {row[0]: row[1] for row in cursor.fetchall()}
        
        # By assignee
        cursor.execute("SELECT assigned_to, COUNT(*) as count FROM tasks WHERE assigned_to IS NOT NULL GROUP BY assigned_to")
        assignee_stats = {row[0]: row[1] for row in cursor.fetchall()}
        
        conn.close()
        
        return {
            "by_status": status_stats,
            "by_assignee": assignee_stats,
            "total": sum(status_stats.values())
        }

# ============================================================================
# WebSocket Connection Manager
# ============================================================================

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    async def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
    
    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

# ============================================================================
# FastAPI App Setup
# ============================================================================

app = FastAPI(
    title="Control Tower Kanban API",
    description="REST + WebSocket API for Hermes Kanban",
    version="0.1.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create router
router = APIRouter(prefix="/api/kanban", tags=["kanban"])

# ============================================================================
# REST Endpoints
# ============================================================================

@router.get("/tasks")
async def list_tasks(
    board: str = "default",
    status: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    project: Optional[str] = Query(None),
):
    """List all tasks with optional filters"""
    try:
        db = KanbanDB(board=board)
        tasks = db.list_tasks(status=status, assigned_to=assigned_to, project=project)
        return {
            "success": True,
            "board": board,
            "count": len(tasks),
            "tasks": tasks
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tasks/{task_id}")
async def get_task(task_id: str, board: str = "default"):
    """Get single task with full details"""
    try:
        db = KanbanDB(board=board)
        task = db.get_task(task_id)
        
        if not task:
            raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
        
        comments = db.get_comments(task_id)
        events = db.get_events(task_id)
        
        return {
            "success": True,
            "task": task,
            "comments": comments,
            "events": events
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tasks/{task_id}/claim")
async def claim_task(task_id: str, assignee: str, board: str = "default"):
    """Claim task"""
    try:
        db = KanbanDB(board=board)
        task = db.get_task(task_id)
        
        if not task:
            raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
        
        db.claim(task_id, assignee)
        
        # Broadcast update
        await manager.broadcast({
            "type": "task_claimed",
            "task_id": task_id,
            "assigned_to": assignee,
            "timestamp": datetime.now().isoformat()
        })
        
        return {
            "success": True,
            "task_id": task_id,
            "assigned_to": assignee,
            "status": "in-progress"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tasks/{task_id}/complete")
async def complete_task(task_id: str, board: str = "default"):
    """Mark task as done"""
    try:
        db = KanbanDB(board=board)
        task = db.get_task(task_id)
        
        if not task:
            raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
        
        db.complete(task_id)
        
        # Broadcast update
        await manager.broadcast({
            "type": "task_completed",
            "task_id": task_id,
            "status": "done",
            "timestamp": datetime.now().isoformat()
        })
        
        return {
            "success": True,
            "task_id": task_id,
            "status": "done"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tasks/{task_id}/comment")
async def add_comment(task_id: str, text: str, board: str = "default", author: str = "hermes"):
    """Add comment to task"""
    try:
        db = KanbanDB(board=board)
        task = db.get_task(task_id)
        
        if not task:
            raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
        
        comment_id = db.comment(task_id, text, author=author)
        
        # Broadcast update
        await manager.broadcast({
            "type": "comment_added",
            "task_id": task_id,
            "comment_id": comment_id,
            "text": text,
            "author": author,
            "timestamp": datetime.now().isoformat()
        })
        
        return {
            "success": True,
            "comment_id": comment_id,
            "task_id": task_id,
            "text": text
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_stats(board: str = "default"):
    """Get kanban stats"""
    try:
        db = KanbanDB(board=board)
        stats = db.stats()
        return {
            "success": True,
            "board": board,
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health():
    """Health check"""
    return {
        "status": "healthy",
        "service": "control-tower-kanban-api",
        "timestamp": datetime.now().isoformat()
    }

# ============================================================================
# WebSocket Endpoint
# ============================================================================

@router.websocket("/ws/kanban")
async def websocket_kanban(websocket: WebSocket, board: str = "default"):
    """WebSocket for live kanban updates"""
    await manager.connect(websocket)
    
    try:
        # Send initial snapshot
        db = KanbanDB(board=board)
        tasks = db.list_tasks()
        stats = db.stats()
        
        await websocket.send_json({
            "type": "snapshot",
            "board": board,
            "tasks": tasks,
            "stats": stats,
            "timestamp": datetime.now().isoformat()
        })
        
        # Keep connection alive
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                # Process client message if needed
            except asyncio.TimeoutError:
                # Send heartbeat
                await websocket.send_json({
                    "type": "heartbeat",
                    "timestamp": datetime.now().isoformat()
                })
            except WebSocketDisconnect:
                manager.disconnect(websocket)
                break
    
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)

# ============================================================================
# Register router and include in app
# ============================================================================

app.include_router(router)

# ============================================================================
# Root endpoint
# ============================================================================

@app.get("/")
async def root():
    return {
        "service": "Control Tower Kanban API",
        "docs": "/docs",
        "endpoints": {
            "tasks": "/api/kanban/tasks",
            "websocket": "/api/kanban/ws/kanban",
            "health": "/api/kanban/health"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
