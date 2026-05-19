import { useState } from 'react'
import { ChevronDown, ChevronRight, Cpu } from 'lucide-react'
import type { ThinkingStep } from '../../stores/sessionStore'
import { ThinkingStepItem } from './ThinkingStep'

interface ThinkingTrailProps {
  steps: ThinkingStep[]
  isStreaming?: boolean
}

export function ThinkingTrail({ steps, isStreaming = false }: ThinkingTrailProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (steps.length === 0 && !isStreaming) return null

  const doneCount = steps.filter((s) => s.status === 'done').length
  const totalCount = steps.length

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs text-surface-500 hover:text-surface-300 transition-colors duration-150 group"
      >
        <Cpu size={12} className="text-primary-500 group-hover:text-primary-400" />
        <span className="font-medium">
          {isStreaming && doneCount < totalCount ? 'Thinking…' : 'Thinking process'}
        </span>
        {totalCount > 0 && !isStreaming && (
          <span className="text-surface-600">({doneCount}/{totalCount} steps)</span>
        )}
        {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>

      {isOpen && (
        <div className="mt-1.5 ml-1 pl-3 border-l border-surface-700/60 animate-slide-up">
          {steps.map((step, i) => (
            <ThinkingStepItem key={step.event + i} step={step} index={i} />
          ))}
          {isStreaming && steps.length === 0 && (
            <div className="thinking-step text-surface-600">Waiting for agent…</div>
          )}
        </div>
      )}
    </div>
  )
}
