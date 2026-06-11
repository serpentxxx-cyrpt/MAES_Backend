import React from 'react';
import ReactMarkdown from 'react-markdown';
import {
  StickyNote, CreditCard, ClipboardList, BookMarked,
  ChevronLeft, ChevronRight, RotateCcw, Check, X, RefreshCw
} from 'lucide-react';

interface Flashcard { id: string; deckId: string; front: string; back: string; status: 'unseen' | 'review' | 'mastered'; sortOrder: number; }
interface FlashcardDeck { id: string; notebookId: string; title: string; createdAt: string; cards: Flashcard[]; }
interface QuizQuestion { id: string; question: string; options: string[]; correct_index: number; explanation: string; bloom_level: string; }
interface Quiz { id: string; questions: QuizQuestion[]; }
interface Source { id: string; notebookId: string; sourceType: 'pdf' | 'url' | 'youtube' | 'paste'; title: string; isActive: boolean; createdAt: string; }

interface StudioPanelProps {
  studioTab: 'notes' | 'flashcards' | 'quiz' | 'study_guide';
  setStudioTab: (tab: 'notes' | 'flashcards' | 'quiz' | 'study_guide') => void;
  notes: string;
  handleNotesChange: (val: string) => void;
  flashcardTopic: string;
  setFlashcardTopic: (val: string) => void;
  handleGenerateFlashcards: () => void;
  isGeneratingCards: boolean;
  sources: Source[];
  activeDeck: FlashcardDeck | null;
  currentCardIdx: number;
  setCurrentCardIdx: React.Dispatch<React.SetStateAction<number>>;
  isFlipped: boolean;
  setIsFlipped: (val: boolean) => void;
  handleCardMastery: (status: 'review' | 'mastered') => void;
  currentQuiz: Quiz | null;
  setCurrentQuiz: (quiz: Quiz | null) => void;
  quizDifficulty: 'easy' | 'medium' | 'hard';
  setQuizDifficulty: (val: 'easy' | 'medium' | 'hard') => void;
  quizSize: number;
  setQuizSize: (val: number) => void;
  handleGenerateQuiz: () => void;
  isGeneratingQuiz: boolean;
  quizAnswers: Record<number, number>;
  setQuizAnswers: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  submittedQuiz: boolean;
  setSubmittedQuiz: (val: boolean) => void;
  calculateQuizScore: () => number;
  studyGuide?: string | null;
  isGeneratingGuide?: boolean;
  handleGenerateGuide?: () => void;
}

const TABS = [
  { key: 'notes',       label: 'Notes',     icon: StickyNote },
  { key: 'flashcards',  label: 'Flashcards',icon: CreditCard },
  { key: 'quiz',        label: 'Quiz',      icon: ClipboardList },
  { key: 'study_guide', label: 'Guide',     icon: BookMarked },
] as const;

export default function StudioPanel({
  studioTab, setStudioTab, notes, handleNotesChange,
  flashcardTopic, setFlashcardTopic, handleGenerateFlashcards, isGeneratingCards,
  sources, activeDeck, currentCardIdx, setCurrentCardIdx, isFlipped, setIsFlipped, handleCardMastery,
  currentQuiz, setCurrentQuiz, quizDifficulty, setQuizDifficulty, quizSize, setQuizSize,
  handleGenerateQuiz, isGeneratingQuiz, quizAnswers, setQuizAnswers, submittedQuiz, setSubmittedQuiz, calculateQuizScore,
  studyGuide, isGeneratingGuide, handleGenerateGuide,
}: StudioPanelProps) {

  const hasSources = sources.some(s => s.isActive);

  return (
    <aside className="studio-panel">
      {/* Tab Bar */}
      <div className="studio-tabs">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setStudioTab(key)}
            className={`studio-tab ${studioTab === key ? 'active' : ''}`}
            title={label}
          >
            <Icon size={13} style={{ display: 'inline', marginRight: 3 }} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Body */}
      <div className="studio-body">

        {/* ── NOTES ── */}
        {studioTab === 'notes' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ink)' }}>My Notes</span>
              <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>Auto-saved</span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              className="input"
              style={{ flex: 1, resize: 'none', minHeight: 320, fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', lineHeight: 1.7 }}
              placeholder="Jot down key ideas, formulas, and takeaways as you learn..."
            />
          </div>
        )}

        {/* ── FLASHCARDS ── */}
        {studioTab === 'flashcards' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {/* Generator */}
            <div className="card" style={{ gap: '0.75rem', display: 'flex', flexDirection: 'column' }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ink)' }}>Generate Flashcards</p>
              <input
                type="text"
                value={flashcardTopic}
                onChange={(e) => setFlashcardTopic(e.target.value)}
                className="input"
                style={{ fontSize: '0.8125rem' }}
                placeholder="Topic focus (optional, e.g. Big-O complexity)"
              />
              <button
                onClick={handleGenerateFlashcards}
                disabled={isGeneratingCards || !hasSources}
                className="btn btn-primary btn-full btn-sm"
              >
                {isGeneratingCards ? (
                  <><RefreshCw size={13} className="animate-spin" /> Generating...</>
                ) : (
                  <><CreditCard size={13} /> Generate Deck</>
                )}
              </button>
              {!hasSources && (
                <p style={{ fontSize: '0.75rem', color: 'var(--stone-500)', textAlign: 'center' }}>
                  Add and enable a source first.
                </p>
              )}
            </div>

            {/* Active deck */}
            {activeDeck && activeDeck.cards.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>{activeDeck.title}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--stone-500)' }}>{currentCardIdx + 1} / {activeDeck.cards.length}</span>
                </div>

                <div className="flashcard" onClick={() => setIsFlipped(!isFlipped)}>
                  <span className="flashcard-face-label">{isFlipped ? 'Answer' : 'Question'}</span>
                  <p className="flashcard-text">
                    {isFlipped ? activeDeck.cards[currentCardIdx].back : activeDeck.cards[currentCardIdx].front}
                  </p>
                  <p className="flashcard-hint">Click to reveal {isFlipped ? 'question' : 'answer'}</p>
                </div>

                {isFlipped && (
                  <div style={{ display: 'flex', gap: '0.5rem', animation: 'fadeIn 0.2s ease' }}>
                    <button onClick={() => handleCardMastery('review')} className="btn btn-secondary" style={{ flex: 1, fontSize: '0.8rem' }}>
                      <RotateCcw size={13} /> Review Again
                    </button>
                    <button onClick={() => handleCardMastery('mastered')} className="btn btn-primary" style={{ flex: 1, fontSize: '0.8rem' }}>
                      <Check size={13} /> Mastered
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button
                    disabled={currentCardIdx === 0}
                    onClick={() => { setCurrentCardIdx(p => p - 1); setIsFlipped(false); }}
                    className="btn btn-ghost btn-sm"
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <button
                    disabled={currentCardIdx === activeDeck.cards.length - 1}
                    onClick={() => { setCurrentCardIdx(p => p + 1); setIsFlipped(false); }}
                    className="btn btn-ghost btn-sm"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--stone-400)', fontSize: '0.8125rem' }}>
                No deck generated yet. Generate one above.
              </div>
            )}
          </div>
        )}

        {/* ── QUIZ ── */}
        {studioTab === 'quiz' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {!currentQuiz ? (
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ink)' }}>Generate Practice Quiz</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label className="pref-label" style={{ fontSize: '0.75rem' }}>Difficulty</label>
                  <select value={quizDifficulty} onChange={(e: any) => setQuizDifficulty(e.target.value)} className="input select" style={{ fontSize: '0.8rem' }}>
                    <option value="easy">Easy — Knowledge recall</option>
                    <option value="medium">Medium — Application</option>
                    <option value="hard">Hard — Analysis & Synthesis</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label className="pref-label" style={{ fontSize: '0.75rem' }}>Number of questions: {quizSize}</label>
                  <input
                    type="range" min={3} max={10} value={quizSize}
                    onChange={(e) => setQuizSize(Number(e.target.value))}
                    style={{ accentColor: 'var(--green)', width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--stone-400)' }}>
                    <span>3</span><span>10</span>
                  </div>
                </div>

                <button
                  onClick={handleGenerateQuiz}
                  disabled={isGeneratingQuiz || !hasSources}
                  className="btn btn-primary btn-full btn-sm"
                >
                  {isGeneratingQuiz ? (
                    <><RefreshCw size={13} className="animate-spin" /> Generating...</>
                  ) : (
                    <><ClipboardList size={13} /> Generate Quiz</>
                  )}
                </button>
                {!hasSources && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--stone-500)', textAlign: 'center' }}>Add and enable a source first.</p>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ink)' }}>
                    Practice Quiz
                    {submittedQuiz && (
                      <span style={{ marginLeft: '0.5rem', color: 'var(--green)', fontWeight: 700 }}>
                        {calculateQuizScore()}/{currentQuiz.questions.length} correct
                      </span>
                    )}
                  </span>
                  <button onClick={() => { setCurrentQuiz(null); setQuizAnswers({}); setSubmittedQuiz(false); }} className="btn btn-ghost btn-xs">
                    <X size={12} /> Reset
                  </button>
                </div>

                {/* Questions */}
                {currentQuiz.questions.map((q, qIdx) => {
                  const isCorrect = quizAnswers[qIdx] === q.correct_index;
                  return (
                    <div key={q.id} style={{ background: 'var(--off-white)', border: '1.5px solid var(--stone-200)', borderRadius: 'var(--radius)', padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <span style={{ background: 'var(--green)', color: '#fff', borderRadius: 'var(--radius-sm)', padding: '0.1rem 0.45rem', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
                          Q{qIdx + 1}
                        </span>
                        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.5 }}>{q.question}</p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        {q.options.map((opt, optIdx) => {
                          let className = 'quiz-option';
                          if (submittedQuiz) {
                            if (optIdx === q.correct_index) className += ' correct';
                            else if (quizAnswers[qIdx] === optIdx && !isCorrect) className += ' wrong';
                            else className += ' dimmed';
                          } else if (quizAnswers[qIdx] === optIdx) {
                            className += ' selected';
                          }
                          return (
                            <button
                              key={optIdx}
                              disabled={submittedQuiz}
                              onClick={() => setQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }))}
                              className={className}
                            >
                              <span style={{ fontWeight: 600, marginRight: '0.5rem' }}>{String.fromCharCode(65 + optIdx)}.</span>
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {submittedQuiz && (
                        <div style={{ background: isCorrect ? 'var(--green-100)' : 'var(--error-light)', border: `1px solid ${isCorrect ? 'var(--green-300)' : 'rgba(192,57,43,0.25)'}`, borderRadius: 'var(--radius-sm)', padding: '0.625rem 0.75rem', fontSize: '0.8rem', color: isCorrect ? 'var(--green-800)' : 'var(--error)' }}>
                          <p style={{ fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            {isCorrect ? <><Check size={13} /> Correct</> : <><X size={13} /> Incorrect</>}
                            <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'inherit', opacity: 0.7, marginLeft: 'auto' }}>
                              {q.bloom_level}
                            </span>
                          </p>
                          <p style={{ color: 'var(--ink)', opacity: 0.8 }}>{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}

                {!submittedQuiz ? (
                  <button
                    onClick={() => setSubmittedQuiz(true)}
                    disabled={Object.keys(quizAnswers).length < currentQuiz.questions.length}
                    className="btn btn-primary btn-full btn-sm"
                  >
                    Submit Answers
                  </button>
                ) : (
                  <button
                    onClick={() => { setCurrentQuiz(null); setQuizAnswers({}); setSubmittedQuiz(false); }}
                    className="btn btn-secondary btn-full btn-sm"
                  >
                    <RefreshCw size={13} /> New Quiz
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── STUDY GUIDE ── */}
        {studioTab === 'study_guide' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ink)' }}>AI Study Guide</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--stone-500)', lineHeight: 1.5 }}>
                Generate a comprehensive study guide from your active sources, including key concepts, summaries, and practice questions.
              </p>
              <button
                onClick={handleGenerateGuide}
                disabled={isGeneratingGuide || !hasSources}
                className="btn btn-primary btn-full btn-sm"
              >
                {isGeneratingGuide ? (
                  <><RefreshCw size={13} className="animate-spin" /> Generating...</>
                ) : (
                  <><BookMarked size={13} /> {studyGuide ? 'Regenerate Guide' : 'Generate Study Guide'}</>
                )}
              </button>
              {!hasSources && (
                <p style={{ fontSize: '0.75rem', color: 'var(--stone-500)', textAlign: 'center' }}>Add and enable a source first.</p>
              )}
            </div>

            {studyGuide ? (
              <div className="card study-guide-content" style={{ flex: 1 }}>
                <ReactMarkdown>{studyGuide}</ReactMarkdown>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--stone-400)', fontSize: '0.8125rem' }}>
                No study guide yet. Click "Generate" to create one.
              </div>
            )}
          </div>
        )}

      </div>
    </aside>
  );
}
