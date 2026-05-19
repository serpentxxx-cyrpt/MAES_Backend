import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { useNotebook } from '../../hooks/useNotebook'

interface StudyGuideProps { notebookId: string }

export function StudyGuide({ notebookId }: StudyGuideProps) {
  const { generateStudyGuide } = useNotebook(notebookId)
  const [guide, setGuide] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const result = await generateStudyGuide()
      setGuide(result)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="panel-heading">Study Guide</span>
        <button onClick={handleGenerate} disabled={isGenerating} className="btn-primary text-xs gap-1">
          {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          Generate
        </button>
      </div>
      {!guide && !isGenerating && (
        <div className="text-center py-10">
          <p className="text-xs text-surface-500">Generate a structured study guide from your sources</p>
        </div>
      )}
      {isGenerating && (
        <div className="flex items-center justify-center py-10 gap-2">
          <Loader2 size={16} className="animate-spin text-primary-400" />
          <span className="text-xs text-surface-400">Building study guide…</span>
        </div>
      )}
      {guide && (
        <div className="glass-panel p-4 animate-fade-in">
          <pre className="text-xs text-surface-200 whitespace-pre-wrap leading-relaxed font-sans">{guide}</pre>
        </div>
      )}
    </div>
  )
}
