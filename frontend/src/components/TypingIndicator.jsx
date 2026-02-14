/**
 * TypingIndicator Component
 *
 * Animated dots shown while the AI is processing a response.
 * Uses CSS keyframe animation defined in index.css.
 */

export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 mb-4" role="status" aria-label="AI is thinking">
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
        <span className="text-white text-xs font-bold">AI</span>
      </div>

      {/* Animated dots */}
      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-0.5">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>
    </div>
  );
}
