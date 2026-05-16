import React from 'react'
import SnakeGame from '../components/SnakeGame'

export default function SnakeGamePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <h1 className="text-4xl font-bold text-white mb-2">🐍 Snake Game</h1>
      <p className="text-gray-400 text-sm mb-8">Juega Snake en Torre de Control</p>
      <SnakeGame />
    </div>
  )
}
