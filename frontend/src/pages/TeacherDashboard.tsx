import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import { Users, BookOpen, TrendingUp, Star } from 'lucide-react'
import api from '../lib/apiClient'

interface SessionStat {
  session_id: string
  student_id: string
  domain: string
  started_at: string
  avg_hint_quality: number
  avg_bloom: number
  turns: number
}

export function TeacherDashboard() {
  const [stats, setStats] = useState<SessionStat[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get('/audit/dashboard/summary')
      .then((r) => { setStats(r.data.sessions ?? []); setIsLoading(false) })
      .catch(() => setIsLoading(false))
  }, [])

  const bloomData = ['remember','understand','apply','analyze','evaluate','create'].map((level) => ({
    level: level.charAt(0).toUpperCase() + level.slice(1),
    count: Math.floor(Math.random() * 20), // will be replaced with real data
  }))

  const statCards = [
    { label: 'Total Sessions', value: stats.length, icon: BookOpen, color: 'text-primary-400' },
    { label: 'Unique Students', value: new Set(stats.map(s => s.student_id)).size, icon: Users, color: 'text-emerald-400' },
    { label: 'Avg Turns/Session', value: stats.length ? (stats.reduce((a,s) => a + s.turns, 0) / stats.length).toFixed(1) : 0, icon: TrendingUp, color: 'text-amber-400' },
    { label: 'Avg Hint Quality', value: stats.length ? (stats.reduce((a,s) => a + s.avg_hint_quality, 0) / stats.length).toFixed(1) : 0, icon: Star, color: 'text-pink-400' },
  ]

  return (
    <div className="min-h-screen bg-surface-950">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Teacher Dashboard</h1>
          <p className="text-surface-400 text-sm mt-1">Session analytics and learning insights</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass-panel p-4">
              <Icon size={18} className={`${color} mb-2`} />
              <p className="text-2xl font-bold text-surface-50">{value}</p>
              <p className="text-xs text-surface-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Bloom distribution */}
          <div className="glass-panel p-5">
            <h3 className="text-sm font-semibold text-surface-200 mb-4">Bloom Level Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={bloomData} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="level" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Session quality over time */}
          <div className="glass-panel p-5">
            <h3 className="text-sm font-semibold text-surface-200 mb-4">Hint Quality Over Time</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats.map((s, i) => ({ turn: i + 1, quality: s.avg_hint_quality }))} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="turn" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis domain={[0, 5]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }} />
                <Line type="monotone" dataKey="quality" stroke="#818cf8" strokeWidth={2} dot={{ r: 3, fill: '#6366f1' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sessions table */}
        <div className="glass-panel overflow-hidden">
          <div className="px-5 py-3 border-b border-surface-700/50">
            <h3 className="text-sm font-semibold text-surface-200">Recent Sessions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-surface-800">
                  {['Student', 'Domain', 'Turns', 'Avg Quality', 'Date'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-surface-400 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-surface-500">No sessions yet</td></tr>
                )}
                {stats.map((s) => (
                  <tr key={s.session_id} className="border-b border-surface-800/50 hover:bg-surface-800/30 transition-colors">
                    <td className="px-4 py-2.5 text-surface-300 font-mono">{s.student_id.slice(0,8)}…</td>
                    <td className="px-4 py-2.5 text-surface-300">{s.domain}</td>
                    <td className="px-4 py-2.5 text-surface-300">{s.turns}</td>
                    <td className="px-4 py-2.5">
                      <span className={`bloom-badge ${s.avg_hint_quality >= 4 ? 'bg-emerald-900/30 text-emerald-300' : 'bg-amber-900/30 text-amber-300'}`}>
                        {s.avg_hint_quality.toFixed(1)}/5
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-surface-500">{new Date(s.started_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
