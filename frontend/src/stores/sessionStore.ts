import { create } from 'zustand'

export interface Message {
  id: string
  role: 'student' | 'tutor'
  text: string
  bloomLevel?: string
  register?: string
  thinkingSteps?: ThinkingStep[]
  timestamp: Date
}

export interface ThinkingStep {
  event: string
  label: string
  detail?: string
  durationMs?: number
  status: 'pending' | 'done' | 'error'
}

interface SessionState {
  sessionId: string | null
  messages: Message[]
  isLoading: boolean
  currentRegister: string
  currentBloomLevel: string
  activeThinkingSteps: ThinkingStep[]

  setSessionId: (id: string | null) => void
  addMessage: (msg: Message) => void
  updateLastTutorMessage: (updates: Partial<Message>) => void
  setLoading: (v: boolean) => void
  setRegister: (r: string) => void
  setBloomLevel: (b: string) => void
  pushThinkingStep: (step: ThinkingStep) => void
  updateThinkingStep: (event: string, updates: Partial<ThinkingStep>) => void
  clearThinkingSteps: () => void
  reset: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  sessionId: null,
  messages: [],
  isLoading: false,
  currentRegister: 'socratic',
  currentBloomLevel: 'remember',
  activeThinkingSteps: [],

  setSessionId: (id) => set({ sessionId: id }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateLastTutorMessage: (updates) =>
    set((s) => {
      const msgs = [...s.messages]
      const idx = msgs.map((m) => m.role).lastIndexOf('tutor')
      if (idx !== -1) msgs[idx] = { ...msgs[idx], ...updates }
      return { messages: msgs }
    }),
  setLoading: (v) => set({ isLoading: v }),
  setRegister: (r) => set({ currentRegister: r }),
  setBloomLevel: (b) => set({ currentBloomLevel: b }),
  pushThinkingStep: (step) =>
    set((s) => ({ activeThinkingSteps: [...s.activeThinkingSteps, step] })),
  updateThinkingStep: (event, updates) =>
    set((s) => ({
      activeThinkingSteps: s.activeThinkingSteps.map((st) =>
        st.event === event ? { ...st, ...updates } : st
      ),
    })),
  clearThinkingSteps: () => set({ activeThinkingSteps: [] }),
  reset: () =>
    set({
      sessionId: null,
      messages: [],
      isLoading: false,
      currentRegister: 'socratic',
      currentBloomLevel: 'remember',
      activeThinkingSteps: [],
    }),
}))
