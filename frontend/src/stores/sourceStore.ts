import { create } from 'zustand'

export interface Source {
  id: string
  notebookId: string
  sourceType: 'pdf' | 'url' | 'youtube' | 'drive' | 'paste' | 'note'
  title: string
  rawContent?: string
  metadata?: Record<string, unknown>
  isActive: boolean
  createdAt: Date
}

interface SourceState {
  sources: Source[]
  isUploading: boolean
  addSource: (src: Source) => void
  toggleSource: (id: string) => void
  removeSource: (id: string) => void
  setUploading: (v: boolean) => void
  setSources: (srcs: Source[]) => void
}

export const useSourceStore = create<SourceState>((set) => ({
  sources: [],
  isUploading: false,

  addSource: (src) => set((s) => ({ sources: [...s.sources, src] })),
  toggleSource: (id) =>
    set((s) => ({
      sources: s.sources.map((src) =>
        src.id === id ? { ...src, isActive: !src.isActive } : src
      ),
    })),
  removeSource: (id) =>
    set((s) => ({ sources: s.sources.filter((src) => src.id !== id) })),
  setUploading: (v) => set({ isUploading: v }),
  setSources: (srcs) => set({ sources: srcs }),
}))
