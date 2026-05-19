import { useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import api, { createTurnStream } from '../lib/apiClient'
import type { TurnSSEEvent } from '../lib/apiClient'
import { supabase } from '../lib/supabaseClient'
import { useSessionStore } from '../stores/sessionStore'

export function useSession(notebookId: string) {
  const {
    sessionId, setSessionId, addMessage, setLoading,
    pushThinkingStep, updateThinkingStep, clearThinkingSteps,
    setRegister, setBloomLevel, isLoading,
  } = useSessionStore()

  const streamRef = useRef<EventSource | null>(null)

  const startSession = useCallback(async (domain: string) => {
    const { data } = await api.post('/session/start', {
      notebook_id: notebookId,
      domain,
    })
    setSessionId(data.session_id)
    return data.session_id
  }, [notebookId, setSessionId])

  const sendMessage = useCallback(async (text: string) => {
    if (!sessionId || isLoading) return

    // Add student message immediately
    addMessage({
      id: uuidv4(),
      role: 'student',
      text,
      timestamp: new Date(),
    })

    // Add a placeholder tutor message that will be filled by SSE
    const tutorMsgId = uuidv4()
    addMessage({
      id: tutorMsgId,
      role: 'tutor',
      text: '',
      thinkingSteps: [],
      timestamp: new Date(),
    })

    setLoading(true)
    clearThinkingSteps()

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    const stepLabels: Record<string, string> = {
      agent_a_start:   '🤖 Agent A drafting hint…',
      agent_a_done:    '✅ Draft ready — sending to auditor',
      agent_b_start:   '🔍 Agent B evaluating…',
      agent_b_done:    '📊 Rubric scores computed',
      revision_start:  '🔄 Agent A revising hint…',
      revision_done:   '✅ Revision complete',
      agent_b_recheck: '🔍 Agent B re-evaluating…',
      final_hint:      '✅ Approved — delivering response',
      error:           '❌ Error in pipeline',
    }

    const src = createTurnStream(
      sessionId,
      text,
      token,
      (ev: TurnSSEEvent) => {
        const label = stepLabels[ev.event] ?? ev.event

        if (ev.event === 'agent_a_start' || ev.event === 'agent_b_start' || ev.event === 'revision_start') {
          pushThinkingStep({ event: ev.event, label, status: 'pending' })
        } else if (ev.event === 'agent_a_done' || ev.event === 'revision_done') {
          updateThinkingStep(
            ev.event === 'agent_a_done' ? 'agent_a_start' : 'revision_start',
            { status: 'done', durationMs: (ev.data as { duration_ms: number }).duration_ms }
          )
          pushThinkingStep({ event: ev.event, label, status: 'done' })
        } else if (ev.event === 'agent_b_done') {
          const d = ev.data as unknown as { scores: Record<string,number>; decision: string; note?: string }
          updateThinkingStep('agent_b_start', { status: 'done' })
          const scoreText = Object.entries(d.scores)
            .map(([k, v]) => `${k.replace('_', ' ')}: ${v}`)
            .join(' | ')
          pushThinkingStep({
            event: 'agent_b_done',
            label: `📊 ${scoreText}`,
            detail: d.decision === 'REQUEST_REVISION' ? `Note: "${d.note}"` : undefined,
            status: 'done',
          })
        } else if (ev.event === 'agent_b_recheck') {
          pushThinkingStep({ event: 'agent_b_recheck', label, status: 'done' })
        } else if (ev.event === 'final_hint') {
          const d = ev.data as { hint_text: string; bloom_level: string; register: string }
          pushThinkingStep({ event: 'final_hint', label, status: 'done' })
          setRegister(d.register || 'socratic')
          setBloomLevel(d.bloom_level || 'remember')
          // Update the placeholder tutor message
          useSessionStore.getState().updateLastTutorMessage({
            text: d.hint_text,
            bloomLevel: d.bloom_level,
            register: d.register,
            thinkingSteps: useSessionStore.getState().activeThinkingSteps,
          })
          setLoading(false)
        }
      },
      () => { setLoading(false) },
      () => {
        pushThinkingStep({ event: 'error', label: '❌ Connection error', status: 'error' })
        setLoading(false)
      }
    )

    streamRef.current = src
  }, [sessionId, isLoading, addMessage, setLoading, clearThinkingSteps, pushThinkingStep, updateThinkingStep, setRegister, setBloomLevel])

  const endSession = useCallback(async () => {
    if (!sessionId) return
    streamRef.current?.close()
    await api.post('/session/end', { session_id: sessionId })
    setSessionId(null)
  }, [sessionId, setSessionId])

  return { startSession, sendMessage, endSession, sessionId }
}
