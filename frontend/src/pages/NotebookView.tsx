import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { SourcesPanel } from '../components/panels/SourcesPanel'
import { ChatPanel } from '../components/panels/ChatPanel'
import { StudioPanel } from '../components/panels/StudioPanel'
import { StatusBar } from '../components/shared/StatusBar'
import { useNotebookStore } from '../stores/notebookStore'
import { useSourceStore } from '../stores/sourceStore'
import api from '../lib/apiClient'

export function NotebookView() {
  const { id: notebookId } = useParams<{ id: string }>()
  const { setActiveNotebook } = useNotebookStore()
  const { setSources } = useSourceStore()
  const [isLoading, setIsLoading] = useState(true)
  const [notebook, setNotebook] = useState<{ title: string; domain?: string } | null>(null)

  useEffect(() => {
    if (!notebookId) return
    const load = async () => {
      const [nbRes, srcRes] = await Promise.all([
        api.get(`/notebooks/${notebookId}`),
        api.get(`/sources/${notebookId}`),
      ])
      setNotebook(nbRes.data.notebook)
      setActiveNotebook(nbRes.data.notebook)
      setSources(srcRes.data.sources.map((s: { createdAt: string }) => ({ ...s, createdAt: new Date(s.createdAt) })))
      setIsLoading(false)
    }
    load().catch(() => setIsLoading(false))
  }, [notebookId, setActiveNotebook, setSources])

  if (!notebookId) return null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 size={24} className="animate-spin text-primary-400" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-surface-950">
      {/* Notebook title bar */}
      <div className="px-4 py-2 border-b border-surface-800 bg-surface-900/60 backdrop-blur-sm flex items-center gap-3">
        <span className="text-sm font-semibold text-surface-100 truncate">{notebook?.title ?? 'Notebook'}</span>
        {notebook?.domain && (
          <span className="text-xs text-primary-400 bg-primary-900/30 px-2 py-0.5 rounded-full">{notebook.domain}</span>
        )}
      </div>

      {/* 3-Panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left — Sources */}
        <div className="w-64 flex-shrink-0 border-r border-surface-800 overflow-hidden flex flex-col">
          <SourcesPanel notebookId={notebookId} />
        </div>

        {/* Center — Chat */}
        <div className="flex-1 overflow-hidden flex flex-col border-r border-surface-800">
          <ChatPanel notebookId={notebookId} domain={notebook?.domain} />
        </div>

        {/* Right — Studio */}
        <div className="w-72 flex-shrink-0 overflow-hidden flex flex-col">
          <StudioPanel notebookId={notebookId} />
        </div>
      </div>

      {/* Status bar */}
      <StatusBar />
    </div>
  )
}
