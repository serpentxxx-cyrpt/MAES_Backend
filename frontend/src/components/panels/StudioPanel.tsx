import { useState } from 'react'
import { StickyNote, Layers, HelpCircle, BookOpen, TrendingUp } from 'lucide-react'
import { useNotebookStore } from '../../stores/notebookStore'
import { NotesEditor } from '../studio/NotesEditor'
import { FlashcardDeck } from '../studio/FlashcardDeck'
import { QuizGenerator } from '../studio/QuizGenerator'
import { StudyGuide } from '../studio/StudyGuide'
import { BloomChart } from '../studio/BloomChart'

interface StudioPanelProps {
  notebookId: string
}

const TABS = [
  { id: 'notes' as const,      label: 'Notes',     icon: StickyNote  },
  { id: 'flashcards' as const, label: 'Cards',     icon: Layers      },
  { id: 'quiz' as const,       label: 'Quiz',      icon: HelpCircle  },
  { id: 'guide' as const,      label: 'Guide',     icon: BookOpen    },
  { id: 'progress' as const,   label: 'Progress',  icon: TrendingUp  },
]

export function StudioPanel({ notebookId }: StudioPanelProps) {
  const { activeTab, setActiveTab } = useNotebookStore()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-surface-800">
        <h2 className="text-sm font-semibold text-surface-100 mb-3">Studio</h2>
        {/* Tab bar */}
        <div className="flex gap-1 bg-surface-800/60 rounded-lg p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-md text-xs transition-all duration-200
                ${activeTab === id
                  ? 'bg-surface-700 text-primary-300 shadow-sm'
                  : 'text-surface-500 hover:text-surface-300'
                }`}
            >
              <Icon size={13} />
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'notes'      && <NotesEditor notebookId={notebookId} />}
        {activeTab === 'flashcards' && <FlashcardDeck notebookId={notebookId} />}
        {activeTab === 'quiz'       && <QuizGenerator notebookId={notebookId} />}
        {activeTab === 'guide'      && <StudyGuide notebookId={notebookId} />}
        {activeTab === 'progress'   && <BloomChart />}
      </div>
    </div>
  )
}
