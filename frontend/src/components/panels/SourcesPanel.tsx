import { useState, useRef, useCallback } from 'react'
import { Upload, Link, Video, FileText, Clipboard, CheckCircle2, Loader2, FilePlus } from 'lucide-react'
import { useSourceStore } from '../../stores/sourceStore'
import { useSources } from '../../hooks/useSources'
import { Modal } from '../shared/Modal'
import { SourceCard } from './SourceCard'

interface SourcesPanelProps {
  notebookId: string
}

type ImportMode = 'file' | 'url' | 'youtube' | 'paste' | null

export function SourcesPanel({ notebookId }: SourcesPanelProps) {
  const { sources } = useSourceStore()
  const { uploadFile, importUrl, importYouTube, pasteText, isUploading } = useSources(notebookId)
  const [importMode, setImportMode] = useState<ImportMode>(null)
  const [urlInput, setUrlInput] = useState('')
  const [pasteTitle, setPasteTitle] = useState('')
  const [pasteContent, setPasteContent] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const files = Array.from(e.dataTransfer.files)
      for (const file of files) await uploadFile(file)
    },
    [uploadFile]
  )

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    for (const file of files) await uploadFile(file)
    e.target.value = ''
  }

  const handleImport = async () => {
    if (importMode === 'url' && urlInput.trim()) {
      await importUrl(urlInput.trim())
    } else if (importMode === 'youtube' && urlInput.trim()) {
      await importYouTube(urlInput.trim())
    } else if (importMode === 'paste' && pasteContent.trim()) {
      await pasteText(pasteTitle || 'Untitled note', pasteContent.trim())
    }
    setImportMode(null)
    setUrlInput('')
    setPasteTitle('')
    setPasteContent('')
  }

  const activeCount = sources.filter((s) => s.isActive).length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-surface-800">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-surface-100">Sources</h2>
            <p className="text-xs text-surface-500">{sources.length} source{sources.length !== 1 ? 's' : ''} · {activeCount} active</p>
          </div>
          <button onClick={() => fileInputRef.current?.click()} className="btn-icon">
            <FilePlus size={16} />
          </button>
          <input ref={fileInputRef} type="file" className="hidden" multiple onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.txt,.md,.csv,.epub,.png,.jpg,.jpeg" />
        </div>

        {/* Import buttons */}
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { mode: 'file' as const, icon: Upload, label: 'Upload File' },
            { mode: 'url' as const, icon: Link, label: 'Website URL' },
            { mode: 'youtube' as const, icon: Video, label: 'YouTube' },
            { mode: 'paste' as const, icon: Clipboard, label: 'Paste Text' },
          ].map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => mode === 'file' ? fileInputRef.current?.click() : setImportMode(mode)}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs text-surface-400 hover:text-surface-200 bg-surface-800/60 hover:bg-surface-700/60 border border-surface-700/50 transition-all duration-150"
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Drop zone */}
      <div
        className={`mx-4 mt-3 border-2 border-dashed rounded-xl p-4 text-center text-xs transition-all duration-200 cursor-pointer
          ${isDragging
            ? 'border-primary-500 bg-primary-900/20 text-primary-300'
            : 'border-surface-700 text-surface-500 hover:border-surface-500 hover:text-surface-400'
          }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 size={14} className="animate-spin text-primary-400" />
            <span className="text-primary-300">Processing…</span>
          </div>
        ) : (
          <>
            <Upload size={16} className="mx-auto mb-1.5 opacity-60" />
            Drop files here or click to browse
          </>
        )}
      </div>

      {/* Source list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {sources.length === 0 && (
          <div className="text-center py-8">
            <FileText size={28} className="mx-auto text-surface-700 mb-2" />
            <p className="text-xs text-surface-500">No sources yet</p>
            <p className="text-xs text-surface-600 mt-1">Add sources to ground the tutor's knowledge</p>
          </div>
        )}
        {sources.map((src) => (
          <SourceCard key={src.id} source={src} />
        ))}
      </div>

      {/* Import Modal */}
      <Modal
        isOpen={importMode === 'url' || importMode === 'youtube' || importMode === 'paste'}
        onClose={() => setImportMode(null)}
        title={
          importMode === 'url' ? '🔗 Import Website' :
          importMode === 'youtube' ? '▶️ Import YouTube' :
          '📋 Paste Text'
        }
      >
        <div className="space-y-3">
          {(importMode === 'url' || importMode === 'youtube') && (
            <div>
              <label className="text-xs text-surface-400 mb-1 block">
                {importMode === 'youtube' ? 'YouTube URL' : 'Website URL'}
              </label>
              <input
                type="url"
                className="input-base"
                placeholder={importMode === 'youtube' ? 'https://youtube.com/watch?v=...' : 'https://example.com'}
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                autoFocus
              />
            </div>
          )}
          {importMode === 'paste' && (
            <>
              <input
                type="text"
                className="input-base"
                placeholder="Source title (optional)"
                value={pasteTitle}
                onChange={(e) => setPasteTitle(e.target.value)}
              />
              <textarea
                className="input-base min-h-[120px] resize-none"
                placeholder="Paste your text content here…"
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                autoFocus
              />
            </>
          )}
          <div className="flex gap-2 justify-end pt-1">
            <button onClick={() => setImportMode(null)} className="btn-ghost">Cancel</button>
            <button onClick={handleImport} disabled={isUploading} className="btn-primary">
              {isUploading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Import
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
