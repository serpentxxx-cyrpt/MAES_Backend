import { useEffect, useRef, useState } from 'react'
import { Send, PlayCircle, StopCircle } from 'lucide-react'
import { useSessionStore } from '../../stores/sessionStore'
import { useSession } from '../../hooks/useSession'
import { ChatBubble } from '../chat/ChatBubble'

interface ChatPanelProps {
  notebookId: string
  domain?: string
}

export function ChatPanel({ notebookId, domain = 'General' }: ChatPanelProps) {
  const { messages, isLoading, sessionId } = useSessionStore()
  const { startSession, sendMessage, endSession } = useSession(notebookId)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
    }
  }, [input])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    if (!sessionId) await startSession(domain)
    await sendMessage(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-800">
        <div>
          <h2 className="text-sm font-semibold text-surface-100">Socratic Tutor</h2>
          <p className="text-xs text-surface-500">{domain} · Ask anything, get guided — not answered</p>
        </div>
        {sessionId ? (
          <button onClick={endSession} className="btn-ghost text-red-400 hover:text-red-300 gap-1.5 text-xs">
            <StopCircle size={14} />
            End Session
          </button>
        ) : (
          <button onClick={() => startSession(domain)} className="btn-ghost gap-1.5 text-xs">
            <PlayCircle size={14} />
            Start Session
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-primary-900/30 border border-primary-700/40 flex items-center justify-center text-3xl">
              🤖
            </div>
            <div>
              <p className="text-surface-300 font-medium text-sm">Your Socratic Tutor is ready</p>
              <p className="text-surface-500 text-xs mt-1">Ask a question — I'll guide you to the answer,<br/>not give it to you.</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {['Help me understand derivatives', 'What is natural selection?', 'Explain photosynthesis'].map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q) }}
                  className="text-xs px-3 py-1.5 rounded-full border border-surface-700 text-surface-400 hover:border-primary-600 hover:text-primary-300 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <ChatBubble
            key={msg.id}
            message={msg}
            isLatest={idx === messages.length - 1}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-surface-800">
        {!sessionId && (
          <p className="text-xs text-amber-400/80 mb-2 flex items-center gap-1">
            ⚠️ No active session — a new one will start on your first message.
          </p>
        )}
        <div className="flex items-end gap-2 bg-surface-800 border border-surface-700 rounded-xl p-2 focus-within:ring-2 focus-within:ring-primary-500/50 focus-within:border-primary-600 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your question… (Shift+Enter for new line)"
            rows={1}
            className="flex-1 bg-transparent text-sm text-surface-100 placeholder-surface-500 resize-none outline-none leading-relaxed py-1 px-1 max-h-40"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="btn-primary rounded-lg p-2 h-8 w-8 flex-shrink-0 disabled:opacity-40"
          >
            <Send size={14} />
          </button>
        </div>
        <p className="text-xs text-surface-600 mt-1.5 ml-1">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
