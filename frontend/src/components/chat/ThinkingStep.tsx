import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import type { ThinkingStep } from '../../stores/sessionStore'

interface ThinkingStepProps {
  step: ThinkingStep
  index: number
}

export function ThinkingStepItem({ step, index }: ThinkingStepProps) {
  return (
    <div
      className="thinking-step animate-fade-in"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <span className="mt-0.5 flex-shrink-0">
        {step.status === 'pending' && (
          <Loader2 size={12} className="text-primary-400 animate-spin" />
        )}
        {step.status === 'done' && (
          <CheckCircle size={12} className="text-emerald-400" />
        )}
        {step.status === 'error' && (
          <XCircle size={12} className="text-red-400" />
        )}
      </span>
      <div className="flex flex-col gap-0.5">
        <span className={step.status === 'pending' ? 'text-surface-300' : 'text-surface-400'}>
          {step.label}
          {step.durationMs !== undefined && (
            <span className="ml-1 text-surface-600">{step.durationMs}ms</span>
          )}
        </span>
        {step.detail && (
          <span className="text-surface-500 italic text-xs">{step.detail}</span>
        )}
      </div>
    </div>
  )
}
