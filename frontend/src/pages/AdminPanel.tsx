import { useState } from 'react'
import { Settings, Play, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import api from '../lib/apiClient'

export function AdminPanel() {
  const [simRunning, setSimRunning] = useState(false)
  const [simReport, setSimReport] = useState<Record<string, unknown> | null>(null)
  const [simConfig, setSimConfig] = useState({ profile_id: 'sim_profile_001', n_turns: 10, learning_rate: 'slow' })
  const [showReport, setShowReport] = useState(false)

  const runSimulation = async () => {
    setSimRunning(true)
    setSimReport(null)
    try {
      const { data } = await api.post('/simulate', simConfig)
      setSimReport(data.report)
      setShowReport(true)
    } finally {
      setSimRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-950">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Admin Panel</h1>
          <p className="text-surface-400 text-sm mt-1">System configuration and simulation runner</p>
        </div>

        {/* Simulation runner */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Settings size={16} className="text-primary-400" />
            <h2 className="text-sm font-semibold text-surface-100">F8 — Adversarial Simulation</h2>
          </div>
          <p className="text-xs text-surface-400">
            Run an offline simulation with a synthetic student profile to tune rubric thresholds and validate Agent A/B behaviour.
          </p>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-surface-400 mb-1 block">Profile ID</label>
              <input type="text" className="input-base text-xs"
                value={simConfig.profile_id}
                onChange={(e) => setSimConfig((c) => ({ ...c, profile_id: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-surface-400 mb-1 block">Turns</label>
              <input type="number" className="input-base text-xs" min={1} max={50}
                value={simConfig.n_turns}
                onChange={(e) => setSimConfig((c) => ({ ...c, n_turns: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="text-xs text-surface-400 mb-1 block">Learning Rate</label>
              <select className="input-base text-xs"
                value={simConfig.learning_rate}
                onChange={(e) => setSimConfig((c) => ({ ...c, learning_rate: e.target.value }))}>
                <option value="fast">Fast</option>
                <option value="average">Average</option>
                <option value="slow">Slow</option>
              </select>
            </div>
          </div>

          <button onClick={runSimulation} disabled={simRunning} className="btn-primary gap-2">
            {simRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            {simRunning ? 'Running simulation…' : 'Run Simulation'}
          </button>

          {simReport && (
            <div className="space-y-2">
              <button
                onClick={() => setShowReport((v) => !v)}
                className="flex items-center gap-2 text-xs text-primary-400 hover:text-primary-300"
              >
                {showReport ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                Simulation Report
              </button>
              {showReport && (
                <pre className="glass-panel p-4 text-xs text-surface-300 overflow-x-auto max-h-64 animate-slide-up">
                  {JSON.stringify(simReport, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* System info */}
        <div className="glass-panel p-5 space-y-3">
          <h2 className="text-sm font-semibold text-surface-100">System Configuration</h2>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              ['Agent A Model', 'llama-3.1-8b-instant (Groq)'],
              ['Agent B Model', 'gemini-1.5-flash (Google)'],
              ['Fallback Model', 'mistralai/mistral-7b (OpenRouter)'],
              ['Orchestration', 'LangGraph v1.0'],
              ['Primary DB', 'Supabase PostgreSQL'],
              ['Audit DB', 'Neon Serverless PG'],
              ['Session Cache', 'Upstash Redis'],
              ['Approval Threshold', 'Avg ≥ 3.5 AND Correctness ≥ 4'],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col gap-0.5 p-2.5 bg-surface-800/40 rounded-lg">
                <span className="text-surface-500">{k}</span>
                <span className="text-surface-200 font-medium">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
