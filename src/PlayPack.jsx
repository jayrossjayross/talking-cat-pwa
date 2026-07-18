import { useEffect, useRef, useState } from 'react'
import Cat from './components/Cat'
import CopyControls from './playpack/CopyControls'
import ChatControls from './playpack/ChatControls'
import { ParentGate, ParentSettings } from './playpack/ParentModals'
import { readStoredChoice, VOICE_STYLES } from './playpack/config'
import { playTinyReaction } from './playpack/sounds'
import useAiMode from './playpack/useAiMode'
import usePlayback from './playpack/usePlayback'
import useRecorder from './playpack/useRecorder'
import './styles/play-pack.css'

export default function PlayPack() {
  const [mode, setMode] = useState('copy')
  const [mood, setMood] = useState('idle')
  const [reaction, setReaction] = useState('none')
  const [status, setStatus] = useState('Hi! I am Mochi. Tap my head or talk to me!')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [gateOpen, setGateOpen] = useState(false)
  const [gateQuestion, setGateQuestion] = useState({ left: 4, right: 3, answer: 7 })
  const [gateAnswer, setGateAnswer] = useState('')
  const [gateError, setGateError] = useState('')
  const [volume, setVolume] = useState(() => Number(localStorage.getItem('mochi-volume') || 0.9))
  const [talkControl, setTalkControl] = useState(() => readStoredChoice('mochi-talk-control', ['hold', 'tap'], 'hold'))
  const [voiceStyle, setVoiceStyle] = useState(() => readStoredChoice('mochi-voice-style', Object.keys(VOICE_STYLES), 'kitten'))
  const reactionTimerRef = useRef(null)
  const previousVolumeRef = useRef(volume > 0 ? volume : 0.9)

  useEffect(() => {
    localStorage.setItem('mochi-volume', String(volume))
    if (volume > 0) previousVolumeRef.current = volume
  }, [volume])

  useEffect(() => {
    localStorage.setItem('mochi-talk-control', talkControl)
  }, [talkControl])

  useEffect(() => {
    localStorage.setItem('mochi-voice-style', voiceStyle)
  }, [voiceStyle])

  useEffect(() => () => clearTimeout(reactionTimerRef.current), [])

  const playback = usePlayback({ volume, voiceStyle, setMood, setReaction, setStatus })
  const ai = useAiMode({ volume, setMood, setStatus })

  function copyPrompt() {
    return talkControl === 'tap'
      ? 'Tap the purple button to start, then tap again when finished!'
      : 'Hold the purple button and say something!'
  }

  const recorder = useRecorder({
    talkControl,
    busy: ai.connecting || ai.aiTalking,
    copyPrompt,
    beforeStart: () => {
      playback.stopPlayback(null)
      playback.clearReplay()
    },
    onRecording: playback.acceptRecording,
    setMood,
    setReaction,
    setStatus,
  })

  function changeMode(nextMode) {
    if (recorder.recording) recorder.stopCopying()
    playback.stopPlayback(null)
    if (nextMode === 'copy') ai.stopAiSession()
    setMode(nextMode)
    setMood('idle')
    setReaction('none')
    setStatus(nextMode === 'copy'
      ? copyPrompt()
      : 'Connect me, then hold the blue button while you talk.')
  }

  function interactWithMochi(part) {
    if (recorder.recording || ai.aiTalking || playback.isPlaying) return
    const reactions = {
      head: { mood: 'happy', message: 'Purrrr! Head scratches are my favorite!', sound: 'purr' },
      belly: { mood: 'giggling', message: 'Hee hee! My belly is ticklish!', sound: 'giggle' },
      paws: { mood: 'waving', message: 'High paw, best friend!', sound: 'paw' },
      tail: { mood: 'surprised', message: 'Mrrp! You found my wiggly tail!', sound: 'surprise' },
    }
    const next = reactions[part] || reactions.head
    clearTimeout(reactionTimerRef.current)
    setReaction(part)
    setMood(next.mood)
    setStatus(next.message)
    playTinyReaction(next.sound, volume)
    reactionTimerRef.current = setTimeout(() => {
      setMood('idle')
      setReaction('none')
    }, 1200)
  }

  function openParentGate() {
    const left = Math.floor(Math.random() * 5) + 4
    const right = Math.floor(Math.random() * 5) + 2
    setGateQuestion({ left, right, answer: left + right })
    setGateAnswer('')
    setGateError('')
    setGateOpen(true)
  }

  function submitParentGate(event) {
    event.preventDefault()
    if (Number(gateAnswer) === gateQuestion.answer) {
      setGateOpen(false)
      setSettingsOpen(true)
      setGateError('')
    } else {
      setGateError('Not quite. A grown-up can try again.')
      setGateAnswer('')
    }
  }

  function toggleMute() {
    setVolume((current) => current === 0 ? previousVolumeRef.current || 0.9 : 0)
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">MY LITTLE TALKING FRIEND</p>
          <h1>Mochi <span>the Cat</span></h1>
        </div>
        <div className="top-actions">
          <button className="sound-button" onClick={toggleMute} aria-label={volume === 0 ? 'Unmute Mochi' : 'Mute Mochi'}>
            {volume === 0 ? '🔇' : '🔊'}
          </button>
          <button className="settings-button" onClick={openParentGate} aria-label="Open parent settings">⚙️</button>
        </div>
      </header>

      <section className="mode-tabs" aria-label="Game mode">
        <button className={mode === 'copy' ? 'active' : ''} onClick={() => changeMode('copy')}>
          <span>🎙️</span> Copy Me
        </button>
        <button className={mode === 'chat' ? 'active chat' : ''} onClick={() => changeMode('chat')}>
          <span>💬</span> Talk With Me
        </button>
      </section>

      <section className="play-card">
        <div className={`speech-bubble ${mood}`} aria-live="polite">{status}</div>
        <Cat mood={mood} reaction={reaction} onInteract={interactWithMochi} />

        {mode === 'copy' ? (
          <CopyControls
            {...recorder}
            talkControl={talkControl}
            voiceStyle={voiceStyle}
            hasReplay={playback.hasReplay}
            isPlaying={playback.isPlaying}
            replayLastRecording={playback.replayLastRecording}
            stopPlayback={playback.stopPlayback}
          />
        ) : (
          <ChatControls {...ai} />
        )}
      </section>

      <footer>Made with love for little cat lovers 🐾</footer>

      <ParentGate
        open={gateOpen}
        question={gateQuestion}
        answer={gateAnswer}
        error={gateError}
        setAnswer={setGateAnswer}
        onClose={() => setGateOpen(false)}
        onSubmit={submitParentGate}
      />
      <ParentSettings
        open={settingsOpen}
        volume={volume}
        setVolume={setVolume}
        talkControl={talkControl}
        setTalkControl={setTalkControl}
        voiceStyle={voiceStyle}
        setVoiceStyle={setVoiceStyle}
        isPlaying={playback.isPlaying}
        stopPlayback={playback.stopPlayback}
        aiConnected={ai.aiConnected}
        stopAiSession={ai.stopAiSession}
        onClose={() => setSettingsOpen(false)}
      />
    </main>
  )
}
