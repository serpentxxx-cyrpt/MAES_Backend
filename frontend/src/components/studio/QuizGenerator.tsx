import { useState } from 'react'
import { Sparkles, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { useNotebook } from '../../hooks/useNotebook'

interface QuizGeneratorProps { notebookId: string }

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correct_index: number
  explanation: string
  bloom_level: string
}

export function QuizGenerator({ notebookId }: QuizGeneratorProps) {
  const { generateQuiz } = useNotebook(notebookId)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [numQ, setNumQ] = useState(5)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')

  const handleGenerate = async () => {
    setIsGenerating(true)
    setAnswers({})
    setRevealed({})
    try {
      const data = await generateQuiz(numQ, difficulty)
      setQuestions(data.questions ?? [])
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAnswer = (qId: string, idx: number) => {
    if (revealed[qId]) return
    setAnswers((a) => ({ ...a, [qId]: idx }))
    setRevealed((r) => ({ ...r, [qId]: true }))
  }

  const score = questions.filter((q) => answers[q.id] === q.correct_index).length

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="panel-heading">Quiz</span>
        {questions.length > 0 && (
          <span className="text-xs text-primary-300 font-medium">
            {score}/{Object.keys(revealed).length} correct
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs text-surface-500 mb-1 block">Questions</label>
          <select
            value={numQ}
            onChange={(e) => setNumQ(Number(e.target.value))}
            className="input-base text-xs"
          >
            {[3, 5, 10, 15].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs text-surface-500 mb-1 block">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as 'easy'|'medium'|'hard')}
            className="input-base text-xs"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      <button onClick={handleGenerate} disabled={isGenerating} className="btn-primary w-full gap-2">
        {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        Generate Quiz
      </button>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, qi) => (
          <div key={q.id} className="glass-panel p-3 space-y-2 animate-slide-up">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-surface-200">{qi + 1}. {q.question}</p>
              <span className="text-xs text-surface-600 flex-shrink-0">{q.bloom_level}</span>
            </div>
            <div className="space-y-1.5">
              {q.options.map((opt, oi) => {
                const isSelected = answers[q.id] === oi
                const isCorrect = q.correct_index === oi
                const isWrong = isSelected && !isCorrect
                return (
                  <button
                    key={oi}
                    onClick={() => handleAnswer(q.id, oi)}
                    className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-all duration-200
                      ${!revealed[q.id] ? 'border-surface-700 text-surface-300 hover:border-primary-600 hover:text-primary-300' : ''}
                      ${revealed[q.id] && isCorrect ? 'border-emerald-500 bg-emerald-900/20 text-emerald-300' : ''}
                      ${isWrong ? 'border-red-500 bg-red-900/20 text-red-300' : ''}
                      ${revealed[q.id] && !isCorrect && !isWrong ? 'border-surface-700 text-surface-500' : ''}
                    `}
                  >
                    <span className="flex items-center gap-2">
                      {revealed[q.id] && isCorrect && <CheckCircle size={11} className="text-emerald-400 flex-shrink-0" />}
                      {isWrong && <XCircle size={11} className="text-red-400 flex-shrink-0" />}
                      {opt}
                    </span>
                  </button>
                )
              })}
            </div>
            {revealed[q.id] && (
              <p className="text-xs text-surface-500 italic pt-1 border-t border-surface-700/50">
                💡 {q.explanation}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
