interface BloomBadgeProps {
  level: string
  size?: 'sm' | 'md'
}

const config: Record<string, { label: string; color: string; emoji: string }> = {
  remember:  { label: 'Remember',  color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',   emoji: '💡' },
  understand:{ label: 'Understand',color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', emoji: '🧠' },
  apply:     { label: 'Apply',     color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',       emoji: '⚙️' },
  analyze:   { label: 'Analyze',   color: 'bg-violet-500/20 text-violet-300 border-violet-500/30', emoji: '🔬' },
  evaluate:  { label: 'Evaluate',  color: 'bg-pink-500/20 text-pink-300 border-pink-500/30',       emoji: '⚖️' },
  create:    { label: 'Create',    color: 'bg-orange-500/20 text-orange-300 border-orange-500/30', emoji: '🎨' },
}

export function BloomBadge({ level, size = 'sm' }: BloomBadgeProps) {
  const c = config[level] ?? config.remember
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'
  return (
    <span className={`bloom-badge border ${c.color} ${sizeClass}`}>
      {c.emoji} {c.label}
    </span>
  )
}
