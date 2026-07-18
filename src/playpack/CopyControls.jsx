import { COPY_LIMIT_MS, VOICE_STYLES } from './config'

export default function CopyControls({
  recording,
  recordingElapsed,
  audioLevel,
  talkControl,
  voiceStyle,
  hasReplay,
  isPlaying,
  beginHoldCopying,
  endHoldCopying,
  toggleCopying,
  replayLastRecording,
  stopPlayback,
}) {
  const progress = Math.min(100, (recordingElapsed / COPY_LIMIT_MS) * 100)
  const secondsLeft = Math.max(0, Math.ceil((COPY_LIMIT_MS - recordingElapsed) / 1000))
  const activeBars = Math.max(1, Math.round(audioLevel * 10))

  return (
    <div className="controls">
      {recording && (
        <div className="recording-panel" aria-label={`${secondsLeft} seconds remaining`}>
          <div className="recording-timer" style={{ '--recording-progress': `${progress}%` }}>
            <span>{secondsLeft}</span>
          </div>
          <div className="sound-meter" aria-hidden="true">
            {Array.from({ length: 10 }, (_, index) => (
              <span key={index} className={index < activeBars ? 'active' : ''} />
            ))}
          </div>
          <strong>Listening to you...</strong>
        </div>
      )}

      <button
        className={`talk-button copy-button ${recording ? 'pressed' : ''}`}
        onPointerDown={talkControl === 'hold' ? beginHoldCopying : undefined}
        onPointerUp={talkControl === 'hold' ? endHoldCopying : undefined}
        onPointerCancel={talkControl === 'hold' ? endHoldCopying : undefined}
        onPointerLeave={talkControl === 'hold' ? endHoldCopying : undefined}
        onClick={talkControl === 'tap' ? toggleCopying : undefined}
        aria-pressed={recording}
      >
        <span className="mic-icon">{recording ? '👂' : '🎤'}</span>
        <strong>{recording ? 'Listening...' : talkControl === 'tap' ? 'Tap to Talk' : 'Hold to Talk'}</strong>
        <small>
          {recording
            ? talkControl === 'tap' ? 'Tap again when finished' : 'Let go when finished'
            : `I will copy you as ${VOICE_STYLES[voiceStyle].label} Mochi`}
        </small>
      </button>

      {hasReplay && !recording && (
        <div className="quick-actions">
          <button className="replay-button" onClick={replayLastRecording} disabled={isPlaying}>
            ↻ Replay
          </button>
          {isPlaying && <button className="stop-button" onClick={() => stopPlayback()}>■ Stop</button>}
        </div>
      )}
      <p className="privacy-note">🔒 Your recording stays on this device. It is cleared when you record again or close Mochi.</p>
    </div>
  )
}
