import { useSessionStore } from '../../stores/sessionStore'

const registerColors: Record<string, string> = {
  socratic:        'text-primary-400 bg-primary-900/30 border-primary-700/50',
  analogy_first:   'text-emerald-400 bg-emerald-900/30 border-emerald-700/50',
  worked_example:  'text-amber-400 bg-amber-900/30 border-amber-700/50',
  error_correction:'text-rose-400 bg-rose-900/30 border-rose-700/50',
}

const registerLabels: Record<string, string> = {
  socratic:        '❓ Socratic',
  analogy_first:   '💡 Analogy',
  worked_example:  '📝 Worked Example',
  error_correction:'🔍 Error Correction',
}

const bloomColors: Record<string, string> = {
  remember:  'bg-amber-500/20 text-amber-300',
  understand:'bg-emerald-500/20 text-emerald-300',
  apply:     'bg-blue-500/20 text-blue-300',
  analyze:   'bg-violet-500/20 text-violet-300',
  evaluate:  'bg-pink-500/20 text-pink-300',
  create:    'bg-orange-500/20 text-orange-300',
}

export function StatusBar() {
  const { currentRegister, currentBloomLevel, sessionId } = useSessionStore()

  return (
    <div className="h-8 border-t border-surface-800 bg-surface-950/80 backdrop-blur-sm flex items-center justify-between px-4 gap-4 text-xs">
      <div className="flex items-center gap-3">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${registerColors[currentRegister] ?? registerColors.socratic}`}>
          {registerLabels[currentRegister] ?? currentRegister}
        </span>
        <span className={`bloom-badge ${bloomColors[currentBloomLevel] ?? bloomColors.remember}`}>
          📚 Bloom: {currentBloomLevel.charAt(0).toUpperCase() + currentBloomLevel.slice(1)}
        </span>
      </div>
      <div className="flex items-center gap-2 text-surface-500">
        {sessionId ? (
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Session active
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-surface-600" />
            No active session
          </span>
        )}
      </div>
    </div>
  )
}
