import { useCallback } from 'react'
import api from '../lib/apiClient'
import type { Note, FlashcardDeck } from '../stores/notebookStore'
import { useNotebookStore } from '../stores/notebookStore'

export function useNotebook(notebookId: string) {
  const { addNote, updateNote, setNotes, setDecks, addDeck } = useNotebookStore()

  const loadNotes = useCallback(async () => {
    const { data } = await api.get(`/notebooks/${notebookId}/notes`)
    setNotes(data.notes.map((n: Note) => ({ ...n, createdAt: new Date(n.createdAt), updatedAt: new Date(n.updatedAt) })))
  }, [notebookId, setNotes])

  const createNote = useCallback(async (title: string, content: string) => {
    const { data } = await api.post(`/notebooks/${notebookId}/notes`, { title, content })
    addNote({ ...data.note, createdAt: new Date(), updatedAt: new Date() })
  }, [notebookId, addNote])

  const saveNote = useCallback(async (id: string, content: string) => {
    await api.patch(`/notebooks/${notebookId}/notes/${id}`, { content })
    updateNote(id, { content, updatedAt: new Date() })
  }, [notebookId, updateNote])

  const loadDecks = useCallback(async () => {
    const { data } = await api.get(`/notebooks/${notebookId}/decks`)
    setDecks(data.decks.map((d: FlashcardDeck) => ({ ...d, createdAt: new Date(d.createdAt) })))
  }, [notebookId, setDecks])

  const generateFlashcards = useCallback(async (topic?: string) => {
    const { data } = await api.post(`/studio/flashcards`, {
      notebook_id: notebookId,
      topic,
    })
    addDeck({ ...data.deck, createdAt: new Date() })
    return data.deck as FlashcardDeck
  }, [notebookId, addDeck])

  const generateQuiz = useCallback(async (numQuestions = 5, difficulty = 'medium') => {
    const { data } = await api.post('/studio/quiz', {
      notebook_id: notebookId,
      num_questions: numQuestions,
      difficulty,
    })
    return data.quiz
  }, [notebookId])

  const generateStudyGuide = useCallback(async () => {
    const { data } = await api.post('/studio/study-guide', { notebook_id: notebookId })
    return data.guide as string
  }, [notebookId])

  return { loadNotes, createNote, saveNote, loadDecks, generateFlashcards, generateQuiz, generateStudyGuide }
}
