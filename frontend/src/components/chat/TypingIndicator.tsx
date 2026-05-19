export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 w-fit">
      <div className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse-dot" style={{ animationDelay: '0ms' }} />
      <div className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse-dot" style={{ animationDelay: '200ms' }} />
      <div className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse-dot" style={{ animationDelay: '400ms' }} />
    </div>
  )
}
