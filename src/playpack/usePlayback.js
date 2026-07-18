import { useEffect, useRef, useState } from 'react'
import { VOICE_STYLES } from './config'

export default function usePlayback({ volume, voiceStyle, setMood, setReaction, setStatus }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasReplay, setHasReplay] = useState(false)
  const audioRef = useRef(null)
  const audioUrlRef = useRef(null)
  const lastRecordingRef = useRef(null)
  const happyTimerRef = useRef(null)

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  useEffect(() => () => {
    clearTimeout(happyTimerRef.current)
    const audio = audioRef.current
    if (audio) {
      audio.onplay = null
      audio.onended = null
      audio.onerror = null
      audio.pause()
    }
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
    audioRef.current = null
    audioUrlRef.current = null
    lastRecordingRef.current = null
  }, [])

  function releaseAudioUrl() {
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
    audioUrlRef.current = null
  }

  function stopPlayback(nextStatus = 'Ready when you are!') {
    const audio = audioRef.current
    if (audio) {
      audio.onplay = null
      audio.onended = null
      audio.onerror = null
      audio.pause()
      audio.currentTime = 0
    }
    audioRef.current = null
    releaseAudioUrl()
    setIsPlaying(false)
    if (nextStatus !== null) {
      setMood('idle')
      setReaction('none')
      setStatus(nextStatus)
    }
  }

  async function playCopy(blob, replaying = false) {
    if (!blob) return
    stopPlayback(null)
    const url = URL.createObjectURL(blob)
    audioUrlRef.current = url
    const audio = new Audio(url)
    const selectedVoice = VOICE_STYLES[voiceStyle]
    audioRef.current = audio
    audio.volume = volume
    audio.playbackRate = voiceStyle === 'silly'
      ? selectedVoice.rate + (Math.random() * 0.12 - 0.06)
      : selectedVoice.rate
    audio.preservesPitch = false
    audio.webkitPreservesPitch = false

    audio.onplay = () => {
      setIsPlaying(true)
      setMood('speaking')
      setReaction(voiceStyle)
      setStatus(replaying
        ? `${selectedVoice.icon} ${selectedVoice.label} Mochi says it again!`
        : `${selectedVoice.icon} ${selectedVoice.label} Mochi is copying you!`)
    }
    audio.onended = () => {
      audioRef.current = null
      releaseAudioUrl()
      setIsPlaying(false)
      setMood('happy')
      setReaction('none')
      setStatus('Again! Again!')
      clearTimeout(happyTimerRef.current)
      happyTimerRef.current = setTimeout(() => setMood('idle'), 1100)
    }
    audio.onerror = () => {
      audioRef.current = null
      releaseAudioUrl()
      setIsPlaying(false)
      setMood('idle')
      setReaction('none')
      setStatus('I recorded you, but my voice got stuck. Try once more!')
    }

    try {
      await audio.play()
    } catch {
      audioRef.current = null
      releaseAudioUrl()
      setIsPlaying(false)
      setMood('idle')
      setStatus('Tap the screen once, then try again.')
    }
  }

  function clearReplay() {
    lastRecordingRef.current = null
    setHasReplay(false)
  }

  function acceptRecording(blob) {
    lastRecordingRef.current = blob
    setHasReplay(true)
    playCopy(blob)
  }

  function replayLastRecording() {
    if (lastRecordingRef.current) playCopy(lastRecordingRef.current, true)
  }

  return {
    isPlaying,
    hasReplay,
    stopPlayback,
    clearReplay,
    acceptRecording,
    replayLastRecording,
  }
}
