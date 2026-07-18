export default function ChatControls({
  aiConnected,
  connecting,
  aiTalking,
  connectAiSession,
  startAiTalking,
  stopAiTalking,
}) {
  return (
    <div className="controls">
      {!aiConnected ? (
        <button className="connect-button" onClick={connectAiSession} disabled={connecting}>
          {connecting ? 'Connecting Mochi...' : '✨ Connect Mochi'}
        </button>
      ) : (
        <button
          className={`talk-button ai-button ${aiTalking ? 'pressed' : ''}`}
          onPointerDown={startAiTalking}
          onPointerUp={stopAiTalking}
          onPointerCancel={stopAiTalking}
          onPointerLeave={() => aiTalking && stopAiTalking()}
        >
          <span className="mic-icon">🎤</span>
          <strong>{aiTalking ? 'I am listening...' : 'Hold to Talk'}</strong>
          <small>{aiTalking ? 'Let go for my answer' : 'Ask me something fun'}</small>
        </button>
      )}
      <p className="privacy-note">👨‍👩‍👦 Parent note: AI mode needs internet and an OpenAI API key configured in Vercel.</p>
    </div>
  )
}
