import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis } from 'recharts'
import { useSessionStore } from '../../stores/sessionStore'

const BLOOM_ORDER = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']

export function BloomChart() {
  const { messages } = useSessionStore()

  const tutorMessages = messages.filter((m) => m.role === 'tutor' && m.bloomLevel)

  // Count frequency per level
  const freq = BLOOM_ORDER.map((level) => ({
    level: level.charAt(0).toUpperCase() + level.slice(1),
    count: tutorMessages.filter((m) => m.bloomLevel === level).length,
  }))

  // Progression over turns
  const progression = tutorMessages.map((m, i) => ({
    turn: i + 1,
    level: BLOOM_ORDER.indexOf(m.bloomLevel ?? 'remember') + 1,
  }))

  return (
    <div className="p-4 space-y-5">
      <span className="panel-heading">Learning Progress</span>

      {tutorMessages.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-xs text-surface-500">No session data yet — start chatting to see your Bloom progression</p>
        </div>
      ) : (
        <>
          {/* Radar chart — Bloom distribution */}
          <div>
            <p className="text-xs text-surface-400 mb-2">Bloom Level Distribution</p>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={freq} outerRadius={70}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="level" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Radar
                  name="Turns" dataKey="count" fill="#6366f1" fillOpacity={0.35} stroke="#818cf8" strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Area chart — progression over time */}
          <div>
            <p className="text-xs text-surface-400 mb-2">Bloom Level Over Turns</p>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={progression} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="bloomGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="turn" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis domain={[1, 6]} ticks={[1,2,3,4,5,6]} tickFormatter={(v) => BLOOM_ORDER[(v as number)-1]?.slice(0,3) ?? ''} tick={{ fill: '#64748b', fontSize: 9 }} />
                <Tooltip
                  formatter={(v) => BLOOM_ORDER[(v as number)-1] ?? String(v)}
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
                />
                <Area type="monotone" dataKey="level" stroke="#818cf8" fill="url(#bloomGrad)" strokeWidth={2} dot={{ r: 3, fill: '#6366f1' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Summary chips */}
          <div className="flex flex-wrap gap-1.5">
            {freq.filter((f) => f.count > 0).map((f) => (
              <span key={f.level} className="text-xs px-2 py-0.5 rounded-full bg-primary-900/30 border border-primary-700/40 text-primary-300">
                {f.level}: {f.count}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
