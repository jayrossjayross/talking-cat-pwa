import { useEffect, useRef, useState } from 'react'
import Cat from './components/Cat'

const COPY_LIMIT_MS = 8000

function bestRecorderOptions() {
  if (!window.MediaRecorder?.isTypeSupported) return undefined
  const types = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm']
  const mimeType = types.find((type) => MediaRecorder.isTypeSupported(type))
  return mimeType ? { mimeType } : undefined
}

export default function App() {
  const [mode, setMode] = useState('copy')
  const [mood, setMood] = useState('idle')
  const [status, setStatus] = useState('Hi! I am Mochi. Tap my head or talk to me!')
  const [recording, setRecording] = useState(false)
  const [aiConnected, setAiConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [aiTalking, setAiTalking] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [volume, setVolume] = useState(() => Number(localStorage.getItem('mochi-volume') || 0.9))

  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const copyStreamRef = useRef(null)
  const copyTimerRef = useRef(null)
  const audioRef = useRef(null)

  const peerRef = useRef(null)
  const channelRef = useRef(null)
  const aiStreamRef = useRef(null)
  const remoteAudioRef = useRef(null)

  useEffect(() => {
    localStorage.setItem('mochi-volume', String(volume))
    if (audioRef.current) audioRef.current.volume = volume
    if (remoteAudioRef.current) remoteAudioRef.current.volume = volume
  }, [volume])

  useEffect(() => () => {
    clearTimeout(copyTimerRef.current)
    recorderRef.current?.state === 'recording' && recorderRef.current.stop()
    copyStreamRef.current?.getTracks().forEach((track) => track.stop())
    audioRef.current?.pause()
    stopAiSession()
  }, [])

  function changeMode(nextMode) {
    if (recording) stopCopying()
    if (nextMode === 'copy') stopAiSession()
    setMode(nextMode)
    setMood('idle')
    setStatus(nextMode === 'copy'
      ? 'Hold the purple button and say something!'
      : 'Connect me, then hold the blue button while you talk.')
  }

  async function startCopying() {
    if (recording || connecting || aiTalking) return
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        throw new Error('Voice recording is not supported in this browser.')
      }

      audioRef.current?.pause()
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
      copyStreamRef.current = stream
      chunksRef.current = []

      const recorder = new MediaRecorder(stream, bestRecorderOptions())
      recorderRef.current = recorder
      recorder.ondataavailable = (event) => {
        if (event.data?.size) chunksRef.current.push(event.data)
      }
      recorder.onerror = () => {
        setStatus('Oops! I could not hear that. Please try again.')
        setMood('idle')
      }
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
        copyStreamRef.current = null
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        chunksRef.current = []
        if (blob.size > 100) playCopy(blob)
        else {
          setMood('idle')
          setStatus('I did not hear anything. Try again!')
        }
      }

      recorder.start()
      setRecording(true)
      setMood('listening')
      setStatus('I am listening...')
      copyTimerRef.current = setTimeout(stopCopying, COPY_LIMIT_MS)
    } catch (error) {
      setRecording(false)
      setMood('idle')
      setStatus(error.name === 'NotAllowedError'
        ? 'Please allow microphone access so I can copy you.'
        : error.message || 'The microphone could not start.')
    }
  }

  function stopCopying() {
    clearTimeout(copyTimerRef.current)
    copyTimerRef.current = null
    setRecording(false)
    if (recorderRef.current?.state === 'recording') {
      setStatus('My turn!')
      recorderRef.current.stop()
    }
  }

  async function playCopy(blob) {
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    audioRef.current = audio
    audio.volume = volume
    audio.playbackRate = 1.28
    audio.preservesPitch = false
    audio.webkitPreservesPitch = false
    audio.onplay = () => {
      setMood('speaking')
      setStatus('Meow meow! That is what you said!')
    }
    audio.onended = () => {
      URL.revokeObjectURL(url)
      setMood('happy')
      setStatus('Again! Again!')
      setTimeout(() => setMood('idle'), 1100)
    }
    audio.onerror = () => {
      URL.revokeObjectURL(url)
      setMood('idle')
      setStatus('I recorded you, but my voice got stuck. Try once more!')
    }
    try {
      await audio.play()
    } catch {
      setMood('idle')
      setStatus('Tap the screen once, then try again.')
    }
  }

  function petMochi() {
    if (recording || aiTalking || mood === 'speaking') return
    const messages = [
      'Purrrr! I like that!',
      'Hee hee! My ears are ticklish!',
      'You are my best friend!',
      'Meow! More pets please!',
    ]
    setMood('happy')
    setStatus(messages[Math.floor(Math.random() * messages.length)])
    playTinyMeow()
    setTimeout(() => setMood('idle'), 1000)
  }

  function playTinyMeow() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      const context = new AudioContext()
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'triangle'
      oscillator.frequency.setValueAtTime(520, context.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(760, context.currentTime + 0.12)
      oscillator.frequency.exponentialRampToValueAtTime(430, context.currentTime + 0.35)
      gain.gain.setValueAtTime(0.0001, context.currentTime)
      gain.gain.exponentialRampToValueAtTime(Math.max(0.03, volume * 0.12), context.currentTime + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.38)
      oscillator.connect(gain).connect(context.destination)
      oscillator.start()
      oscillator.stop(context.currentTime + 0.4)
      oscillator.onended = () => context.close()
    } catch {
      // The visual pet reaction still works when synthesized audio is unavailable.
    }
  }

  async function connectAiSession() {
    if (aiConnected || connecting) return
    setConnecting(true)
    setStatus('Waking up my conversation brain...')
    setMood('listening')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
      aiStreamRef.current = stream
      const [track] = stream.getAudioTracks()
      track.enabled = false

      const peer = new RTCPeerConnection()
      peerRef.current = peer
      peer.addTrack(track, stream)

      const remoteAudio = new Audio()
      remoteAudio.autoplay = true
      remoteAudio.playsInline = true
      remoteAudio.volume = volume
      remoteAudioRef.current = remoteAudio
      peer.ontrack = (event) => {
        remoteAudio.srcObject = event.streams[0]
        remoteAudio.onplaying = () => {
          setMood('speaking')
          setStatus('Mochi is talking...')
        }
        remoteAudio.onpause = () => {
          setMood('idle')
          setStatus('Hold the button when you want to talk again.')
        }
      }

      const channel = peer.createDataChannel('oai-events')
      channelRef.current = channel
      channel.onopen = () => {
        setAiConnected(true)
        setConnecting(false)
        setMood('happy')
        setStatus('I am ready! Hold the blue button and talk to me.')
        setTimeout(() => setMood('idle'), 900)
      }
      channel.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          if (message.type === 'input_audio_buffer.speech_started') {
            setMood('listening')
            setStatus('I can hear you!')
          }
          if (message.type === 'response.created') {
            setMood('listening')
            setStatus('Hmm... let me think!')
          }
          if (message.type === 'response.done') {
            setAiTalking(false)
          }
          if (message.type === 'error') {
            setStatus(message.error?.message || 'My conversation brain had a hiccup.')
          }
        } catch {
          // Ignore non-JSON WebRTC events.
        }
      }
      channel.onerror = () => setStatus('My conversation connection had a hiccup.')

      const offer = await peer.createOffer()
      await peer.setLocalDescription(offer)
      const response = await fetch('/api/realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp' },
        body: offer.sdp,
      })
      if (!response.ok) {
        let detail = 'Conversation mode is not ready.'
        try {
          const payload = await response.json()
          detail = payload.detail || detail
        } catch {
          detail = await response.text() || detail
        }
        throw new Error(detail)
      }
      const answerSdp = await response.text()
      await peer.setRemoteDescription({ type: 'answer', sdp: answerSdp })
    } catch (error) {
      stopAiSession()
      setConnecting(false)
      setMood('idle')
      setStatus(error.name === 'NotAllowedError'
        ? 'Please allow microphone access so we can talk.'
        : error.message || 'Conversation mode could not connect.')
    }
  }

  function startAiTalking() {
    if (!aiConnected || aiTalking) return
    const track = aiStreamRef.current?.getAudioTracks()[0]
    if (!track) return
    if (channelRef.current?.readyState === 'open') {
      channelRef.current.send(JSON.stringify({ type: 'response.cancel' }))
    }
    track.enabled = true
    setAiTalking(true)
    setMood('listening')
    setStatus('I am listening...')
  }

  function stopAiTalking() {
    const track = aiStreamRef.current?.getAudioTracks()[0]
    if (track) track.enabled = false
    if (aiTalking) {
      setAiTalking(false)
      setMood('listening')
      setStatus('Thinking of a tiny cat answer...')
    }
  }

  function stopAiSession() {
    aiStreamRef.current?.getTracks().forEach((track) => track.stop())
    aiStreamRef.current = null
    channelRef.current?.close()
    channelRef.current = null
    peerRef.current?.close()
    peerRef.current = null
    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause()
      remoteAudioRef.current.srcObject = null
    }
    remoteAudioRef.current = null
    setAiConnected(false)
    setAiTalking(false)
    setConnecting(false)
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">MY LITTLE TALKING FRIEND</p>
          <h1>Mochi <span>the Cat</span></h1>
        </div>
        <button className="settings-button" onClick={() => setSettingsOpen(true)} aria-label="Open parent settings">⚙️</button>
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
        <div className={`speech-bubble ${mood}`}>{status}</div>
        <Cat mood={mood} onPet={petMochi} />

        {mode === 'copy' ? (
          <div className="controls">
            <button
              className={`talk-button copy-button ${recording ? 'pressed' : ''}`}
              onPointerDown={startCopying}
              onPointerUp={stopCopying}
              onPointerCancel={stopCopying}
              onPointerLeave={() => recording && stopCopying()}
            >
              <span className="mic-icon">🎤</span>
              <strong>{recording ? 'Listening...' : 'Hold to Talk'}</strong>
              <small>{recording ? 'Let go when finished' : 'I will copy your voice'}</small>
            </button>
            <p className="privacy-note">🔒 Your recording stays on this device and disappears after Mochi repeats it.</p>
          </div>
        ) : (
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
        )}
      </section>

      <footer>Made with love for little cat lovers 🐾</footer>

      {settingsOpen && (
        <div className="modal-backdrop" onClick={() => setSettingsOpen(false)}>
          <section className="settings-card" onClick={(event) => event.stopPropagation()}>
            <button className="close-button" onClick={() => setSettingsOpen(false)} aria-label="Close settings">×</button>
            <h2>Parent Settings</h2>
            <label htmlFor="volume">Mochi's volume</label>
            <input
              id="volume"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
            />
            <div className="setting-info">
              <strong>Safe by design</strong>
              <p>Copy mode never uploads or saves recordings. AI mode uses short, child-friendly replies and asks for no personal information.</p>
            </div>
            {aiConnected && <button className="disconnect-button" onClick={stopAiSession}>Disconnect AI conversation</button>}
            <button className="done-button" onClick={() => setSettingsOpen(false)}>Done</button>
          </section>
        </div>
      )}
    </main>
  )
}
