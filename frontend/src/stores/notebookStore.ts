import { create } from 'zustand'

export interface Notebook {
  id: string
  title: string
  domain?: string
  createdAt: Date
  updatedAt: Date
  sourceCount?: number
}

export interface Note {
  id: string
  notebookId: string
  title: string
  content: string
  sourceRefs: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Flashcard {
  id: string
  deckId: string
  front: string
  back: string
  status: 'unseen' | 'got_it' | 'missed'
  sortOrder: number
}

export interface FlashcardDeck {
  id: string
  notebookId: string
  title: string
  cards: Flashcard[]
  createdAt: Date
}

interface NotebookState {
  notebooks: Notebook[]
  activeNotebook: Notebook | null
  notes: Note[]
  decks: FlashcardDeck[]
  activeTab: 'notes' | 'flashcards' | 'quiz' | 'guide' | 'progress'

  setNotebooks: (nbs: Notebook[]) => void
  setActiveNotebook: (nb: Notebook | null) => void
  addNotebook: (nb: Notebook) => void
  setNotes: (notes: Note[]) => void
  addNote: (note: Note) => void
  updateNote: (id: string, updates: Partial<Note>) => void
  setDecks: (decks: FlashcardDeck[]) => void
  addDeck: (deck: FlashcardDeck) => void
  updateCardStatus: (deckId: string, cardId: string, status: Flashcard['status']) => void
  setActiveTab: (tab: NotebookState['activeTab']) => void
}

export const useNotebookStore = create<NotebookState>((set) => ({
  notebooks: [],
  activeNotebook: null,
  notes: [],
  decks: [],
  activeTab: 'notes',

  setNotebooks: (notebooks) => set({ notebooks }),
  setActiveNotebook: (nb) => set({ activeNotebook: nb }),
  addNotebook: (nb) => set((s) => ({ notebooks: [nb, ...s.notebooks] })),
  setNotes: (notes) => set({ notes }),
  addNote: (note) => set((s) => ({ notes: [note, ...s.notes] })),
  updateNote: (id, updates) =>
    set((s) => ({
      notes: s.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    })),
  setDecks: (decks) => set({ decks }),
  addDeck: (deck) => set((s) => ({ decks: [...s.decks, deck] })),
  updateCardStatus: (deckId, cardId, status) =>
    set((s) => ({
      decks: s.decks.map((d) =>
        d.id === deckId
          ? {
              ...d,
              cards: d.cards.map((c) =>
                c.id === cardId ? { ...c, status } : c
              ),
            }
          : d
      ),
    })),
  setActiveTab: (tab) => set({ activeTab: tab }),
}))
