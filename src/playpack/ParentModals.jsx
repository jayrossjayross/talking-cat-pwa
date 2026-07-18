import { VOICE_STYLES } from './config'

export function ParentGate({ open, question, answer, error, setAnswer, onClose, onSubmit }) {
  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="settings-card gate-card" onSubmit={onSubmit} onClick={(event) => event.stopPropagation()}>
        <button className="close-button" type="button" onClick={onClose} aria-label="Close parent check">×</button>
        <div className="gate-icon">🔐</div>
        <h2>Grown-up Check</h2>
        <p>What is <strong>{question.left} + {question.right}</strong>?</p>
        <input
          className="gate-input"
          type="number"
          inputMode="numeric"
          autoFocus
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          aria-label="Answer to parent question"
        />
        {error && <p className="gate-error" role="alert">{error}</p>}
        <button className="done-button" type="submit">Unlock Settings</button>
      </form>
    </div>
  )
}

export function ParentSettings({
  open,
  volume,
  setVolume,
  talkControl,
  setTalkControl,
  voiceStyle,
  setVoiceStyle,
  isPlaying,
  stopPlayback,
  aiConnected,
  stopAiSession,
  onClose,
}) {
  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="settings-card" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" onClick={onClose} aria-label="Close settings">×</button>
        <h2>Parent Settings</h2>

        <div className="settings-section">
          <div className="setting-heading">
            <label htmlFor="volume">Mochi's volume</label>
            <span>{Math.round(volume * 100)}%</span>
          </div>
          <input
            id="volume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
          />
        </div>

        <div className="settings-section">
          <label>Copy Me control</label>
          <div className="choice-row" role="group" aria-label="Copy Me control style">
            <button className={talkControl === 'hold' ? 'active' : ''} onClick={() => setTalkControl('hold')}>
              ☝️ Hold to talk
            </button>
            <button className={talkControl === 'tap' ? 'active' : ''} onClick={() => setTalkControl('tap')}>
              👆 Tap to start/stop
            </button>
          </div>
        </div>

        <div className="settings-section">
          <label>Mochi's copy voice</label>
          <div className="voice-grid" role="group" aria-label="Mochi voice style">
            {Object.entries(VOICE_STYLES).map(([key, voice]) => (
              <button key={key} className={voiceStyle === key ? 'active' : ''} onClick={() => setVoiceStyle(key)}>
                <span>{voice.icon}</span>
                {voice.label}
              </button>
            ))}
          </div>
        </div>

        <div className="setting-info">
          <strong>Safe by design</strong>
          <p>Copy mode never uploads recordings. Replay is kept only in memory and disappears when Mochi closes. AI mode uses short, child-friendly replies and asks for no personal information.</p>
        </div>
        {isPlaying && <button className="disconnect-button" onClick={() => stopPlayback()}>Stop Mochi's voice</button>}
        {aiConnected && <button className="disconnect-button" onClick={stopAiSession}>Disconnect AI conversation</button>}
        <button className="done-button" onClick={onClose}>Done</button>
      </section>
    </div>
  )
}
