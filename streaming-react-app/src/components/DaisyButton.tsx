"use client"

import startImg from '@/assets/start-button-daisy.svg'
import stopImg from '@/assets/stop-button-daisy.svg'

interface DaisyButtonProps {
  isActive: boolean
  onToggle: () => void
}

export default function DaisyButton({ isActive, onToggle }: DaisyButtonProps) {
  const handleClick = () => {
    onToggle()
  }

  return (
    <button
      onClick={handleClick}
      className="relative w-56 h-56 sm:w-64 sm:h-64 lg:w-72 lg:h-72 rounded-full p-0 border-0 bg-transparent hover:bg-transparent focus:bg-transparent transition-all duration-300 hover:scale-105"
      aria-pressed={isActive}
      aria-label={isActive ? 'Stop translation' : 'Start translation'}
    >
      <img
        src={isActive ? stopImg : startImg}
        alt={isActive ? 'Stop' : 'Start'}
        className="w-full h-full object-contain transition-all duration-300"
      />
    </button>
  )
}


