import { useState } from 'react'
import { RotateCcw, ThumbsUp, ThumbsDown, Sparkles, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useNotebookStore } from '../../stores/notebookStore'
import { useNotebook } from '../../hooks/useNotebook'

interface FlashcardDeckProps { notebookId: string }

export function FlashcardDeck({ notebookId }: FlashcardDeckProps) {
  const { decks, updateCardStatus } = useNotebookStore()
  const { generateFlashcards } = useNotebook(notebookId)
  const [activeDeckIdx, setActiveDeckIdx] = useState(0)
  const [cardIdx, setCardIdx] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [topic, setTopic] = useState('')

  const deck = decks[activeDeckIdx]
  const card = deck?.cards[cardIdx]

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      await generateFlashcards(topic || undefined)
      setActiveDeckIdx(decks.length) // newest deck
      setCardIdx(0)
      setIsFlipped(false)
    } finally {
      setIsGenerating(false)
    }
  }

  const nextCard = () => { setCardIdx((i) => Math.min(i + 1, (deck?.cards.length ?? 1) - 1)); setIsFlipped(false) }
  const prevCard = () => { setCardIdx((i) => Math.max(i - 1, 0)); setIsFlipped(false) }

  const markCard = (status: 'got_it' | 'missed') => {
    if (!deck || !card) return
    updateCardStatus(deck.id, card.id, status)
    nextCard()
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="panel-heading">Flashcards</span>
        <button onClick={handleGenerate} disabled={isGenerating} className="btn-primary text-xs gap-1">
          {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          Generate
        </button>
      </div>

      {/* Topic input */}
      <input
        type="text"
        className="input-base text-xs"
        placeholder="Topic to focus on (optional)…"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
      />

      {/* Deck selector */}
      {decks.length > 1 && (
        <div className="flex gap-1 overflow-x-auto pb-1">
          {decks.map((d, i) => (
            <button
              key={d.id}
              onClick={() => { setActiveDeckIdx(i); setCardIdx(0); setIsFlipped(false) }}
              className={`text-xs px-2.5 py-1 rounded-full border flex-shrink-0 transition-all
                ${i === activeDeckIdx ? 'border-primary-600 text-primary-300 bg-primary-900/30' : 'border-surface-700 text-surface-500'}`}
            >
              {d.title}
            </button>
          ))}
        </div>
      )}

      {!deck && (
        <div className="text-center py-10">
          <p className="text-xs text-surface-500">No decks yet — generate one from your sources!</p>
        </div>
      )}

      {deck && card && (
        <>
          {/* Card counter */}
          <div className="flex items-center justify-between text-xs text-surface-500">
            <span>{deck.title}</span>
            <span>{cardIdx + 1} / {deck.cards.length}</span>
          </div>

          {/* Flashcard flip */}
          <div
            className="relative cursor-pointer"
            style={{ perspective: '1000px' }}
            onClick={() => setIsFlipped((f) => !f)}
          >
            <div
              className="relative transition-transform duration-500"
              style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
            >
              {/* Front */}
              <div className="glass-panel p-5 min-h-[140px] flex flex-col items-center justify-center text-center"
                style={{ backfaceVisibility: 'hidden' }}>
                <p className="text-xs text-surface-500 mb-2 uppercase tracking-wider">Question</p>
                <p className="text-sm text-surface-100 font-medium">{card.front}</p>
                <p className="text-xs text-surface-600 mt-3">Click to reveal answer</p>
              </div>
              {/* Back */}
              <div
                className="absolute inset-0 glass-panel p-5 flex flex-col items-center justify-center text-center bg-primary-900/20 border-primary-700/40"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <p className="text-xs text-primary-400 mb-2 uppercase tracking-wider">Answer</p>
                <p className="text-sm text-surface-100">{card.back}</p>
              </div>
            </div>
          </div>

          {/* Navigation + rating */}
          <div className="flex items-center justify-between">
            <button onClick={prevCard} disabled={cardIdx === 0} className="btn-icon disabled:opacity-30">
              <ChevronLeft size={16} />
            </button>
            <div className="flex gap-2">
              <button onClick={() => markCard('missed')} className="btn-ghost gap-1 text-xs text-red-400 hover:text-red-300">
                <ThumbsDown size={12} /> Missed
              </button>
              <button onClick={() => markCard('got_it')} className="btn-ghost gap-1 text-xs text-emerald-400 hover:text-emerald-300">
                <ThumbsUp size={12} /> Got it
              </button>
            </div>
            <button onClick={nextCard} disabled={cardIdx === deck.cards.length - 1} className="btn-icon disabled:opacity-30">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="h-1.5 bg-surface-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full transition-all duration-500"
                style={{ width: `${((cardIdx + 1) / deck.cards.length) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-surface-600">
              <span>✅ {deck.cards.filter(c => c.status === 'got_it').length} got it</span>
              <span>❌ {deck.cards.filter(c => c.status === 'missed').length} missed</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
