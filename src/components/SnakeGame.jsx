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
          setGameState(prev => (
            {
              ...prev,
              nextDirection: prev.direction.y === 0 ? { x: 0, y: -1 } : prev.nextDirection
            }
          ))
          break
        case 'arrowdown':
          setGameState(prev => (
            {
              ...prev,
              nextDirection: prev.direction.y === 0 ? { x: 0, y: 1 } : prev.nextDirection
            }
          ))
          break
        case 'arrowleft':
          setGameState(prev => (
            {
              ...prev,
              nextDirection: prev.direction.x === 0 ? { x: -1, y: 0 } : prev.nextDirection
            }
          ))
          break
        case 'arrowright':
          setGameState(prev => (
            {
              ...prev,
              nextDirection: prev.direction.x === 0 ? { x: 1, y: 0 } : prev.nextDirection
            }
          ))
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameState.gameStarted, gameState.direction])

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
}
