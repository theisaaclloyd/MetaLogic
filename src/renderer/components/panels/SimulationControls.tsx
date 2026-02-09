import { useCallback } from 'react'
import { useSimulationStore } from '../../stores/simulationStore'

// Logarithmic mapping: slider 0-100 → 1ms-1000ms
function sliderToMs(value: number): number {
  // 0 → 1ms, 50 → ~32ms, 100 → 1000ms
  return Math.round(Math.pow(10, (value / 100) * 3))
}

function msToSlider(ms: number): number {
  // Inverse: 1ms → 0, 32ms → ~50, 1000ms → 100
  if (ms <= 1) return 0
  return (Math.log10(ms) / 3) * 100
}

function formatTime(t: number): string {
  if (t < 10000) return String(t)
  if (t < 1_000_000) return (t / 1000).toPrecision(4).replace(/\.?0+$/, '') + 'K'
  if (t < 1_000_000_000) return (t / 1_000_000).toPrecision(4).replace(/\.?0+$/, '') + 'M'
  return (t / 1_000_000_000).toPrecision(4).replace(/\.?0+$/, '') + 'B'
}

export function SimulationControls() {
  const { status, currentTime, msPerTick, setMsPerTick, run, pause, step, reset } =
    useSimulationStore()

  const isRunning = status === 'running'
  const isPaused = status === 'paused'

  const sliderValue = msToSlider(msPerTick)
  const ticksPerSec = msPerTick > 0 ? Math.round(1000 / msPerTick) : 0

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const ms = sliderToMs(parseFloat(e.target.value))
      setMsPerTick(ms)
    },
    [setMsPerTick]
  )

  return (
    <div className="flex items-center gap-2 bg-gray-800 rounded-lg border border-gray-700 p-2 shadow-lg">
      {/* Play/Pause Button */}
      <button
        onClick={isRunning ? pause : run}
        className={`
          p-2 rounded-md transition-colors
          ${
            isRunning
              ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
              : 'bg-green-600 hover:bg-green-500 text-white'
          }
        `}
        title={isRunning ? 'Pause (F6)' : 'Run (F5)'}
      >
        {isRunning ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
      </button>

      {/* Step Button */}
      <button
        onClick={() => step(1)}
        disabled={isRunning}
        className={`
          p-2 rounded-md transition-colors
          ${
            isRunning
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          }
        `}
        title="Step (F7)"
      >
        <StepIcon className="w-5 h-5" />
      </button>

      {/* Reset Button */}
      <button
        onClick={reset}
        className="p-2 rounded-md bg-red-600 hover:bg-red-500 text-white transition-colors"
        title="Reset (F8)"
      >
        <ResetIcon className="w-5 h-5" />
      </button>

      {/* Separator */}
      <div className="w-px h-6 bg-gray-600" />

      {/* Speed Control */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Speed:</span>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={sliderValue}
          onChange={handleSliderChange}
          className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-xs text-gray-300 w-24 tabular-nums">
          {msPerTick}ms ({ticksPerSec}/s)
        </span>
      </div>

      {/* Separator */}
      <div className="w-px h-6 bg-gray-600" />

      {/* Status Display */}
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isRunning ? 'bg-green-500 animate-pulse' : isPaused ? 'bg-yellow-500' : 'bg-gray-500'
          }`}
        />
        <span className="text-xs text-gray-300 capitalize">{status}</span>
      </div>

      {/* Time Display */}
      <div className="ml-2 text-xs text-gray-400 w-16 text-right tabular-nums">
        t={formatTime(currentTime)}
      </div>
    </div>
  )
}

// Icon Components
function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function StepIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
        clipRule="evenodd"
      />
      <path d="M13 8a1 1 0 011 1v2a1 1 0 11-2 0V9a1 1 0 011-1z" />
    </svg>
  )
}

function ResetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
        clipRule="evenodd"
      />
    </svg>
  )
}
