# Snake Game Implementation Plan

> **For Hermes (Orchestrator):** This plan decomposes a full-stack Snake Game into bite-sized tasks for ORBIT (Opus 4.7) implementation.
>
> **WORKFLOW:**
> 1. Create a new `<ProjectsPage>` route: `/projects/snake`
> 2. Build game canvas component with keyboard input handling
> 3. Implement game logic (grid, snake movement, collision, food, scoring)
> 4. Style with Tailwind + gradient animations
> 5. Deploy to Vercel (auto-deploy on main branch)

---

## Goal
Build a fully functional Snake game in React that runs in Torre de Control (agent-os-dashboard) with real-time scoring, responsive design, keyboard controls, and dark mode support.

## Architecture
- **Frontend:** React component (game canvas + UI) using Tailwind CSS
- **Game Loop:** requestAnimationFrame for 60 FPS rendering
- **State:** React hooks (useState, useEffect) for game state management
- **Styling:** Tailwind CSS with gradient backgrounds, shadows, responsive layout
- **Deployment:** Existing Vercel setup (agent-os-dashboard)
- **Git Workflow:** Feature branch → PR → test on Vercel → merge to main

## Tech Stack
- React 18 (hooks)
- Tailwind CSS (styling)
- Vite (already in project)
- Canvas 2D API (rendering)
- Vercel (deployment)
- GitHub (version control)

---

## Phase 1: Setup & Navigation (5 min)

### Task 1: Create Snake game route in App.jsx

**Objective:** Add Snake game to the Projects page navigation so it's accessible from Torre de Control.

**Files:**
- Modify: `src/App.jsx` (add nav item)
- Create: `src/pages/SnakeGamePage.jsx` (new page component)
- Modify: `src/pages/ProjectsPage.jsx` (add Snake game link)

**Step 1: Read current App.jsx structure**

Already done above. Key info:
- NAV_ITEMS array defines navigation
- Pages are imported and conditionally rendered
- Current pages: Dashboard, Agents, Chat, Projects, Production

**Step 2: Add Snake game as new nav item**

Modify `src/App.jsx` — add to NAV_ITEMS array (after Projects):

```javascript
const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Torre de Control', icon: LayoutDashboard },
  { id: 'agents',     label: 'Agentes',           icon: Bot },
  { id: 'chat',       label: 'Chat Orquestador',  icon: MessageSquare },
  { id: 'projects',   label: 'Proyectos',          icon: Folders },
  { id: 'snake',      label: 'Snake Game',         icon: Zap },  // NEW
  { id: 'production', label: 'Prod / Vercel',      icon: Layers },
]
```

**Step 3: Import SnakeGamePage**

Add to imports in `src/App.jsx`:

```javascript
import SnakeGamePage from './pages/SnakeGamePage'
```

**Step 4: Add conditional render in App.jsx**

Find the section where pages are rendered (around line 80-90), add:

```javascript
{page === 'snake' && <SnakeGamePage />}
```

**Step 5: Commit**

```bash
cd /Users/nextaisolutionscr/NexAI/agent-os-dashboard
git add src/App.jsx
git commit -m "feat: add Snake game navigation to main app"
```

---

### Task 2: Create empty SnakeGamePage component

**Objective:** Create the page wrapper that will contain the Snake game.

**Files:**
- Create: `src/pages/SnakeGamePage.jsx`

**Step 1: Create the file with basic structure**

Create `src/pages/SnakeGamePage.jsx`:

```javascript
import React from 'react'
import SnakeGame from '../components/SnakeGame'

export default function SnakeGamePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <h1 className="text-4xl font-bold text-white mb-8">🐍 Snake Game</h1>
      <SnakeGame />
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/pages/SnakeGamePage.jsx
git commit -m "feat: create SnakeGamePage component skeleton"
```

---

## Phase 2: Game Component & Canvas Setup (10 min)

### Task 3: Create SnakeGame component with canvas

**Objective:** Build the main game component with canvas rendering infrastructure.

**Files:**
- Create: `src/components/SnakeGame.jsx`
- Create: `src/components/SnakeGame.module.css` (optional, for canvas styling)

**Step 1: Create basic SnakeGame component**

Create `src/components/SnakeGame.jsx`:

```javascript
import React, { useState, useEffect, useRef } from 'react'

const GRID_SIZE = 20
const CELL_SIZE = 20
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE

export default function SnakeGame() {
  const canvasRef = useRef(null)
  const [gameState, setGameState] = useState({
    snake: [{ x: 10, y: 10 }],
    food: { x: 15, y: 15 },
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    score: 0,
    gameOver: false,
    gameStarted: false,
  })

  // Draw game on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Draw grid
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath()
      ctx.moveTo(i * CELL_SIZE, 0)
      ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(0, i * CELL_SIZE)
      ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE)
      ctx.stroke()
    }

    // Draw snake
    ctx.fillStyle = '#10b981'
    gameState.snake.forEach((segment, index) => {
      ctx.fillRect(
        segment.x * CELL_SIZE + 1,
        segment.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      )
      // Head color (brighter)
      if (index === 0) {
        ctx.fillStyle = '#34d399'
      }
    })

    // Draw food
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.arc(
      gameState.food.x * CELL_SIZE + CELL_SIZE / 2,
      gameState.food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 2,
      0,
      Math.PI * 2
    )
    ctx.fill()
  }, [gameState])

  return (
    <div className="flex flex-col items-center gap-6">
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="border-4 border-purple-500 shadow-xl rounded-lg"
      />
      <div className="text-white text-xl font-bold">Score: {gameState.score}</div>
      {gameState.gameOver && (
        <div className="text-red-500 text-2xl font-bold">GAME OVER!</div>
      )}
      <button
        onClick={() => {
          setGameState({ ...gameState, gameStarted: true })
        }}
        className="px-6 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition"
      >
        {gameState.gameStarted ? 'RESTART' : 'START GAME'}
      </button>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/SnakeGame.jsx
git commit -m "feat: create SnakeGame component with canvas rendering"
```

---

## Phase 3: Game Logic (15 min)

### Task 4: Implement game loop with arrow key input

**Objective:** Handle keyboard input (arrow keys) and update game state every 150ms.

**Step 1: Add keyboard event listener**

Modify `src/components/SnakeGame.jsx` — add this useEffect before the drawing useEffect:

```javascript
  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e) => {
      const key = e.key.toLowerCase()
      if (!gameState.gameStarted) return

      // Prevent default arrow key behavior
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault()
      }

      switch (key) {
        case 'arrowup':
          setGameState(prev => ({
            ...prev,
            nextDirection: prev.direction.y === 0 ? { x: 0, y: -1 } : prev.nextDirection
          }))
          break
        case 'arrowdown':
          setGameState(prev => ({
            ...prev,
            nextDirection: prev.direction.y === 0 ? { x: 0, y: 1 } : prev.nextDirection
          }))
          break
        case 'arrowleft':
          setGameState(prev => ({
            ...prev,
            nextDirection: prev.direction.x === 0 ? { x: -1, y: 0 } : prev.nextDirection
          }))
          break
        case 'arrowright':
          setGameState(prev => ({
            ...prev,
            nextDirection: prev.direction.x === 0 ? { x: 1, y: 0 } : prev.nextDirection
          }))
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameState.gameStarted, gameState.direction])
```

**Step 2: Add game loop with setInterval**

Add this useEffect after the keyboard input one:

```javascript
  // Game loop
  useEffect(() => {
    if (!gameState.gameStarted || gameState.gameOver) return

    const interval = setInterval(() => {
      setGameState(prev => {
        // Update direction
        const direction = prev.nextDirection

        // Calculate new head position
        const newHead = {
          x: (prev.snake[0].x + direction.x + GRID_SIZE) % GRID_SIZE,
          y: (prev.snake[0].y + direction.y + GRID_SIZE) % GRID_SIZE,
        }

        // Check collision with self
        if (prev.snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          return { ...prev, gameOver: true }
        }

        // Check if food eaten
        const foodEaten = newHead.x === prev.food.x && newHead.y === prev.food.y

        let newSnake = [newHead, ...prev.snake]
        if (!foodEaten) {
          newSnake = newSnake.slice(0, -1)
        }

        const newFood = foodEaten
          ? {
              x: Math.floor(Math.random() * GRID_SIZE),
              y: Math.floor(Math.random() * GRID_SIZE),
            }
          : prev.food

        return {
          ...prev,
          snake: newSnake,
          food: newFood,
          direction,
          score: foodEaten ? prev.score + 10 : prev.score,
        }
      })
    }, 150)

    return () => clearInterval(interval)
  }, [gameState.gameStarted, gameState.gameOver])
```

**Step 3: Commit**

```bash
git add src/components/SnakeGame.jsx
git commit -m "feat: add keyboard input and game loop logic"
```

---

### Task 5: Add restart game functionality

**Objective:** Allow player to restart after game over or toggle between playing states.

**Step 1: Update button click handler**

Modify the button in the return statement:

```javascript
<button
  onClick={() => {
    if (gameState.gameOver) {
      setGameState({
        snake: [{ x: 10, y: 10 }],
        food: { x: 15, y: 15 },
        direction: { x: 1, y: 0 },
        nextDirection: { x: 1, y: 0 },
        score: 0,
        gameOver: false,
        gameStarted: true,
      })
    } else if (gameState.gameStarted) {
      setGameState(prev => ({ ...prev, gameStarted: false }))
    } else {
      setGameState(prev => ({ ...prev, gameStarted: true }))
    }
  }}
  className="px-6 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition"
>
  {gameState.gameOver ? 'RESTART GAME' : gameState.gameStarted ? 'PAUSE' : 'START GAME'}
</button>
```

**Step 2: Commit**

```bash
git add src/components/SnakeGame.jsx
git commit -m "feat: add restart and pause functionality"
```

---

## Phase 4: Styling & Polish (5 min)

### Task 6: Add animations and improve visuals

**Objective:** Enhance game with smooth animations, better colors, and responsive design.

**Step 1: Update component styling**

Modify `src/components/SnakeGame.jsx` return statement:

```javascript
  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-1 rounded-2xl shadow-2xl">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="border-4 border-slate-900 shadow-2xl rounded-xl bg-slate-800 block"
        />
      </div>

      <div className="flex justify-between items-center w-full px-4 gap-8">
        <div className="text-center flex-1">
          <p className="text-gray-400 text-sm uppercase tracking-widest">Score</p>
          <p className="text-4xl font-bold text-transparent bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text">
            {gameState.score}
          </p>
        </div>

        <div className="text-center flex-1">
          <p className="text-gray-400 text-sm uppercase tracking-widest">Status</p>
          <p className={`text-2xl font-bold ${
            gameState.gameOver ? 'text-red-500' :
            gameState.gameStarted ? 'text-green-500' :
            'text-yellow-500'
          }`}>
            {gameState.gameOver ? 'GAME OVER' : gameState.gameStarted ? 'PLAYING' : 'READY'}
          </p>
        </div>
      </div>

      <button
        onClick={() => {
          if (gameState.gameOver) {
            setGameState({
              snake: [{ x: 10, y: 10 }],
              food: { x: 15, y: 15 },
              direction: { x: 1, y: 0 },
              nextDirection: { x: 1, y: 0 },
              score: 0,
              gameOver: false,
              gameStarted: true,
            })
          } else if (gameState.gameStarted) {
            setGameState(prev => ({ ...prev, gameStarted: false }))
          } else {
            setGameState(prev => ({ ...prev, gameStarted: true }))
          }
        }}
        className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 text-lg"
      >
        {gameState.gameOver ? '🔄 RESTART GAME' : gameState.gameStarted ? '⏸ PAUSE' : '▶ START GAME'}
      </button>

      <div className="text-gray-400 text-sm text-center">
        <p>Use arrow keys to move • Eat red food to grow • Avoid yourself!</p>
      </div>
    </div>
  )
```

**Step 2: Commit**

```bash
git add src/components/SnakeGame.jsx
git commit -m "style: enhance game visuals with animations and better UI"
```

---

## Phase 5: Testing & Deployment (10 min)

### Task 7: Local testing and verification

**Objective:** Verify the game works correctly locally before pushing to production.

**Step 1: Start dev server**

```bash
cd /Users/nextaisolutionscr/NexAI/agent-os-dashboard
npm run dev
```

**Step 2: Navigate to Snake game**

- Open browser: `http://localhost:5173/` (or Vite's default port)
- Click "Snake Game" in navigation
- Verify canvas renders with grid

**Step 3: Test gameplay**

- Click "START GAME"
- Press arrow keys to move snake
- Verify:
  - [ ] Snake moves smoothly
  - [ ] Snake wraps around edges (grid wraparound)
  - [ ] Red circle food appears
  - [ ] Score increases when eating food
  - [ ] Snake grows after eating
  - [ ] Game ends when snake hits itself
  - [ ] Can restart after game over
  - [ ] Can pause/unpause

**Step 4: Test responsive design**

- Open DevTools (F12)
- Test on mobile (iPhone SE, etc.)
- Verify game is playable on small screens

**Step 5: Commit and push**

```bash
git push origin feature/snake-game
```

**Step 6: Create Pull Request**

On GitHub (agent-os-dashboard repo):
1. Open PR from `feature/snake-game` → `main`
2. Title: "feat: add Snake game to Torre de Control"
3. Description:
   ```
   ## Description
   Adds a fully functional Snake game playable in Torre de Control.
   
   ## Features
   - Grid-based movement with arrow keys
   - Collision detection (self + edges)
   - Score tracking
   - Pause/restart functionality
   - Dark mode with Tailwind styling
   - Responsive canvas rendering
   
   ## Testing
   - [x] Game logic verified
   - [x] Keyboard input working
   - [x] Responsive design tested
   - [x] No console errors
   ```
4. Wait for Vercel preview deployment
5. Test on preview: click link in PR comments
6. Merge to main (auto-deploys to Vercel)

---

### Task 8: Deploy to production (Vercel)

**Objective:** Get Snake game live on production URL.

**Step 1: Monitor Vercel deployment**

Once PR is merged to main:
- Vercel auto-triggers deployment
- Check status at: https://vercel.com/dashboard
- Project: `agent-os-dashboard`
- Wait for "Ready" status

**Step 2: Verify production**

- Open: `https://agent-os-dashboard.vercel.app/` (or your custom domain)
- Click "Snake Game" nav
- Play and verify all features work

**Step 3: Share with team**

Send message to team:
```
🐍 Snake Game is LIVE in Torre de Control!
Visit: https://agent-os-dashboard.vercel.app/
Play now and compete for high scores!
```

---

## Verification Checklist

After all tasks complete, verify:

- [ ] Snake game accessible from Torre de Control navigation
- [ ] Game canvas renders correctly (grid visible)
- [ ] Keyboard input (arrow keys) works
- [ ] Snake moves smoothly with 150ms game loop
- [ ] Food spawns randomly and is consumed correctly
- [ ] Score increments by 10 per food eaten
- [ ] Snake grows when eating food
- [ ] Game ends on self-collision
- [ ] Edges wrap (snake comes out opposite side)
- [ ] Pause and restart buttons work
- [ ] Status display (READY / PLAYING / GAME OVER) correct
- [ ] Dark mode styling applied
- [ ] Responsive on mobile devices
- [ ] No console errors or warnings
- [ ] Vercel deployment successful
- [ ] Live URL works in production

---

## File Structure Reference

```
src/
├── pages/
│   ├── DashboardPage.jsx
│   ├── AgentsPage.jsx
│   ├── ChatPage.jsx
│   ├── ProjectsPage.jsx
│   ├── ProductionPage.jsx
│   └── SnakeGamePage.jsx          ← NEW
├── components/
│   ├── SnakeGame.jsx               ← NEW
│   └── [other components]
└── App.jsx                         ← MODIFIED
```

---

## Git Workflow Summary

```bash
# Create feature branch
git checkout -b feature/snake-game

# Make changes across 8 tasks (commit after each)
git commit -m "feat: add Snake game navigation..."
git commit -m "feat: create SnakeGamePage component..."
# ... etc

# Push and create PR
git push origin feature/snake-game

# (GitHub: create PR, test on Vercel preview)
# After review/approval:
git checkout main
git pull
# PR merge triggers auto-deploy to Vercel
```

---

## Success Metrics

✅ **Game is playable** — All core mechanics work  
✅ **Responsive design** — Works on desktop and mobile  
✅ **Production ready** — Deployed on Vercel  
✅ **Team accessible** — Visible in Torre de Control  

---

**Plan created:** 2026-05-15  
**Estimated effort:** 45 minutes (implementation via ORBIT)  
**Technology:** React 18, Tailwind CSS, Canvas API, Vercel  
