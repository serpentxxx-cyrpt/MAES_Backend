import { useState } from 'react'
import { Plus, Save, X } from 'lucide-react'
import { useNotebookStore } from '../../stores/notebookStore'
import { useNotebook } from '../../hooks/useNotebook'

interface NotesEditorProps { notebookId: string }

export function NotesEditor({ notebookId }: NotesEditorProps) {
  const { notes, addNote } = useNotebookStore()
  const { createNote, saveNote } = useNotebook(notebookId)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')

  const handleCreate = async () => {
    if (!newContent.trim()) return
    await createNote(newTitle || 'Untitled note', newContent)
    setIsCreating(false)
    setNewTitle('')
    setNewContent('')
  }

  const handleSave = async (id: string) => {
    await saveNote(id, editContent)
    setEditingId(null)
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="panel-heading">My Notes</span>
        <button onClick={() => setIsCreating(true)} className="btn-icon">
          <Plus size={14} />
        </button>
      </div>

      {/* New note form */}
      {isCreating && (
        <div className="glass-panel p-3 space-y-2 animate-slide-up">
          <input
            type="text"
            className="input-base text-xs"
            placeholder="Note title…"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
          />
          <textarea
            className="input-base text-xs min-h-[80px] resize-none"
            placeholder="Write your note…"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setIsCreating(false)} className="btn-ghost text-xs"><X size={12} /> Cancel</button>
            <button onClick={handleCreate} className="btn-primary text-xs"><Save size={12} /> Save</button>
          </div>
        </div>
      )}

      {notes.length === 0 && !isCreating && (
        <div className="text-center py-8">
          <p className="text-xs text-surface-500">No notes yet</p>
          <p className="text-xs text-surface-600 mt-1">Save chat responses or create notes manually</p>
        </div>
      )}

      {notes.map((note) => (
        <div key={note.id} className="glass-panel p-3 group animate-fade-in">
          {editingId === note.id ? (
            <div className="space-y-2">
              <textarea
                className="input-base text-xs min-h-[80px] resize-none"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditingId(null)} className="btn-ghost text-xs"><X size={12} /></button>
                <button onClick={() => handleSave(note.id)} className="btn-primary text-xs"><Save size={12} /> Save</button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => { setEditingId(note.id); setEditContent(note.content) }}
              className="cursor-text"
            >
              <p className="text-xs font-medium text-surface-200 mb-1">{note.title}</p>
              <p className="text-xs text-surface-400 line-clamp-3 whitespace-pre-wrap">{note.content}</p>
              <p className="text-xs text-surface-600 mt-1.5">{new Date(note.updatedAt).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
