import { useState } from 'react'
import { FileText, Link, Video, Clipboard, FileImage, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import type { Source } from '../../stores/sourceStore'
import { useSourceStore } from '../../stores/sourceStore'
import api from '../../lib/apiClient'

interface SourceCardProps {
  source: Source
}

const typeIcons: Record<string, React.ReactNode> = {
  pdf:     <FileText size={14} className="text-red-400" />,
  url:     <Link size={14} className="text-blue-400" />,
  youtube: <Video size={14} className="text-red-500" />,
  paste:   <Clipboard size={14} className="text-emerald-400" />,
  note:    <Clipboard size={14} className="text-amber-400" />,
  drive:   <FileImage size={14} className="text-blue-500" />,
}

const typeLabels: Record<string, string> = {
  pdf: 'PDF', url: 'Website', youtube: 'YouTube',
  paste: 'Text', note: 'Note', drive: 'Drive',
}

export function SourceCard({ source }: SourceCardProps) {
  const { toggleSource, removeSource } = useSourceStore()
  const [isRemoving, setIsRemoving] = useState(false)

  const handleRemove = async () => {
    setIsRemoving(true)
    try {
      await api.delete(`/sources/${source.id}`)
      removeSource(source.id)
    } finally {
      setIsRemoving(false)
    }
  }

  const handleToggle = async () => {
    toggleSource(source.id)
    await api.patch(`/sources/${source.id}/toggle`, { is_active: !source.isActive })
  }

  return (
    <div
      className={`group flex items-start gap-2.5 p-2.5 rounded-lg border transition-all duration-200 cursor-pointer
        ${source.isActive
          ? 'bg-surface-800/60 border-surface-700/50 hover:border-surface-600'
          : 'bg-surface-900/40 border-surface-800/50 opacity-60'
        }`}
    >
      <div className="mt-0.5 flex-shrink-0">
        {typeIcons[source.sourceType] ?? <FileText size={14} className="text-surface-400" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-surface-200 truncate">{source.title || 'Untitled'}</p>
        <p className="text-xs text-surface-500 mt-0.5">{typeLabels[source.sourceType]} · {new Date(source.createdAt).toLocaleDateString()}</p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={handleToggle} className="btn-icon p-1">
          {source.isActive
            ? <ToggleRight size={14} className="text-primary-400" />
            : <ToggleLeft size={14} className="text-surface-500" />
          }
        </button>
        <button onClick={handleRemove} disabled={isRemoving} className="btn-icon p-1 hover:text-red-400">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}
