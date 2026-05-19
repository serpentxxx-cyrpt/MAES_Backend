import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, BookOpen, Clock, FileText, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import type { Notebook } from '../stores/notebookStore'
import { useNotebookStore } from '../stores/notebookStore'
import api from '../lib/apiClient'
import { Modal } from '../components/shared/Modal'

export function NotebookList() {
  const navigate = useNavigate()
  const { notebooks, setNotebooks, addNotebook } = useNotebookStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDomain, setNewDomain] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data } = await api.get('/notebooks')
      setNotebooks(
        (data.notebooks as Notebook[]).map((n) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          updatedAt: new Date(n.updatedAt),
        }))
      )
      setIsLoading(false)
    }
    load().catch(() => setIsLoading(false))
  }, [setNotebooks])

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    setIsCreating(true)
    try {
      const { data } = await api.post('/notebooks', {
        title: newTitle.trim(),
        domain: newDomain.trim() || undefined,
      })
      addNotebook({ ...data.notebook, createdAt: new Date(), updatedAt: new Date() })
      setShowModal(false)
      setNewTitle('')
      setNewDomain('')
      navigate(`/notebook/${data.notebook.id}`)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-950">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold gradient-text">My Notebooks</h1>
            <p className="text-surface-400 text-sm mt-1">Your Socratic learning workspaces</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary gap-2">
            <Plus size={16} />
            New Notebook
          </button>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="animate-spin text-primary-400" />
          </div>
        ) : notebooks.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-2xl bg-primary-900/20 border border-primary-800/30 flex items-center justify-center mx-auto mb-4">
              <BookOpen size={32} className="text-primary-500" />
            </div>
            <h2 className="text-surface-200 font-semibold mb-2">No notebooks yet</h2>
            <p className="text-surface-500 text-sm mb-6">Create your first notebook to start learning with your Socratic AI tutor</p>
            <button onClick={() => setShowModal(true)} className="btn-primary gap-2">
              <Plus size={16} /> Create Notebook
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notebooks.map((nb) => (
              <button
                key={nb.id}
                onClick={() => navigate(`/notebook/${nb.id}`)}
                className="glass-panel p-5 text-left group hover:border-primary-600/50 hover:shadow-primary-900/20 hover:shadow-xl transition-all duration-300 animate-fade-in"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-700/20 border border-primary-700/30 flex items-center justify-center group-hover:from-primary-500/30 transition-all">
                    <BookOpen size={18} className="text-primary-400" />
                  </div>
                </div>
                <h3 className="font-semibold text-surface-100 text-sm mb-1 truncate">{nb.title}</h3>
                {nb.domain && <p className="text-xs text-primary-400/80 mb-3">{nb.domain}</p>}
                <div className="flex items-center gap-3 text-xs text-surface-500">
                  <span className="flex items-center gap-1"><FileText size={11} />{nb.sourceCount ?? 0} sources</span>
                  <span className="flex items-center gap-1"><Clock size={11} />{nb.updatedAt.toLocaleDateString()}</span>
                </div>
              </button>
            ))}

            {/* New notebook card */}
            <button
              onClick={() => setShowModal(true)}
              className="border-2 border-dashed border-surface-700 rounded-panel p-5 flex flex-col items-center justify-center gap-2 text-surface-500 hover:border-primary-600 hover:text-primary-400 transition-all duration-200 min-h-[140px]"
            >
              <Plus size={20} />
              <span className="text-sm">New Notebook</span>
            </button>
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="📓 New Notebook">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-surface-400 mb-1 block">Title *</label>
            <input
              type="text"
              className="input-base"
              placeholder="e.g. Calculus Study Notes"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-surface-400 mb-1 block">Subject / Domain (optional)</label>
            <input
              type="text"
              className="input-base"
              placeholder="e.g. High school calculus, Intro biology…"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
            />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button onClick={() => setShowModal(false)} className="btn-ghost">Cancel</button>
            <button onClick={handleCreate} disabled={!newTitle.trim() || isCreating} className="btn-primary">
              {isCreating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Create
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
