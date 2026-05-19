import type { Message } from '../../stores/sessionStore'
import { BloomBadge } from './BloomBadge'
import { ThinkingTrail } from './ThinkingTrail'
import { TypingIndicator } from './TypingIndicator'
import { useSessionStore } from '../../stores/sessionStore'

interface ChatBubbleProps {
  message: Message
  isLatest?: boolean
}

export function ChatBubble({ message, isLatest }: ChatBubbleProps) {
  const { isLoading } = useSessionStore()
  const isStudent = message.role === 'student'
  const isTutor = message.role === 'tutor'
  const isEmpty = isTutor && !message.text

  return (
    <div
      className={`flex gap-3 animate-slide-up ${isStudent ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold shadow-lg
          ${isStudent
            ? 'bg-gradient-to-br from-primary-500 to-primary-700 text-white'
            : 'bg-gradient-to-br from-surface-700 to-surface-800 text-primary-400 border border-surface-600'
          }`}
      >
        {isStudent ? 'You' : '🤖'}
      </div>

      {/* Bubble */}
      <div className={`flex flex-col gap-1.5 max-w-[75%] ${isStudent ? 'items-end' : 'items-start'}`}>
        {/* Thinking trail — only for tutor */}
        {isTutor && (message.thinkingSteps?.length ?? 0) > 0 && (
          <ThinkingTrail
            steps={message.thinkingSteps ?? []}
            isStreaming={isEmpty && isLoading && isLatest}
          />
        )}
        {/* Streaming thinking trail for latest empty tutor message */}
        {isTutor && isEmpty && isLoading && isLatest && (
          <ThinkingTrail steps={useSessionStore.getState().activeThinkingSteps} isStreaming />
        )}

        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed
            ${isStudent
              ? 'bg-primary-600 text-white rounded-tr-sm'
              : 'bg-surface-800 text-surface-100 border border-surface-700/50 rounded-tl-sm'
            }`}
        >
          {isEmpty && isLoading && isLatest ? (
            <TypingIndicator />
          ) : (
            <p className="whitespace-pre-wrap">{message.text}</p>
          )}
        </div>

        {/* Bloom badge + timestamp */}
        {isTutor && message.text && (
          <div className="flex items-center gap-2">
            {message.bloomLevel && <BloomBadge level={message.bloomLevel} />}
            <span className="text-xs text-surface-600">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
        {isStudent && (
          <span className="text-xs text-surface-600 mr-1">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  )
}
