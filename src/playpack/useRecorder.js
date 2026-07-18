import { useEffect, useRef, useState } from 'react'
import { bestRecorderOptions, COPY_LIMIT_MS } from './config'

export default function useRecorder({
  talkControl,
  busy,
  copyPrompt,
  beforeStart,
  onRecording,
  setMood,
  setReaction,
  setStatus,
}) {
  const [recording, setRecording] = useState(false)
  const [recordingElapsed, setRecordingElapsed] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const stopTimerRef = useRef(null)
  const clockRef = useRef(null)
  const startedAtRef = useRef(0)
  const meterFrameRef = useRef(null)
  const meterContextRef = useRef(null)
  const holdActiveRef = useRef(false)

  useEffect(() => () => {
    clearTimeout(stopTimerRef.current)
    clearInterval(clockRef.current)
    cancelAnimationFrame(meterFrameRef.current)
    recorderRef.current?.state === 'recording' && recorderRef.current.stop()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    meterContextRef.current?.close().catch(() => {})
  }, [])

  function stopMonitor() {
    clearInterval(clockRef.current)
    clockRef.current = null
    cancelAnimationFrame(meterFrameRef.current)
    meterFrameRef.current = null
    const context = meterContextRef.current
    meterContextRef.current = null
    if (context && context.state !== 'closed') context.close().catch(() => {})
    setAudioLevel(0)
  }

  function startMonitor(stream) {
    stopMonitor()
    startedAtRef.current = performance.now()
    setRecordingElapsed(0)
    clockRef.current = window.setInterval(() => {
      setRecordingElapsed(Math.min(COPY_LIMIT_MS, performance.now() - startedAtRef.current))
    }, 100)

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      const context = new AudioContext()
      const analyser = context.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.72
      context.createMediaStreamSource(stream).connect(analyser)
      meterContextRef.current = context
      const samples = new Uint8Array(analyser.frequencyBinCount)
      const update = () => {
        analyser.getByteFrequencyData(samples)
        const average = samples.reduce((sum, value) => sum + value, 0) / samples.length
        setAudioLevel(Math.min(1, average / 105))
        meterFrameRef.current = requestAnimationFrame(update)
      }
      update()
    } catch {
      // Recording still works if the live sound meter is unavailable.
    }
  }

  async function startCopying(trigger = 'tap') {
    if (recording || busy) return
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        throw new Error('Voice recording is not supported in this browser.')
      }
      beforeStart()
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
      if (trigger === 'hold' && !holdActiveRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        setStatus(copyPrompt())
        return
      }

      streamRef.current = stream
      chunksRef.current = []
      const recorder = new MediaRecorder(stream, bestRecorderOptions())
      recorderRef.current = recorder
      recorder.ondataavailable = (event) => {
        if (event.data?.size) chunksRef.current.push(event.data)
      }
      recorder.onerror = () => {
        stopMonitor()
        setRecording(false)
        setMood('idle')
        setStatus('Oops! I could not hear that. Please try again.')
      }
      recorder.onstop = () => {
        stopMonitor()
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        chunksRef.current = []
        if (blob.size > 100) onRecording(blob)
        else {
          setMood('idle')
          setStatus('I did not hear anything. Try again!')
        }
      }

      recorder.start()
      startMonitor(stream)
      setRecording(true)
      setMood('listening')
      setReaction('none')
      setStatus(talkControl === 'tap'
        ? 'I am listening! Tap again when finished.'
        : 'I am listening...')
      stopTimerRef.current = setTimeout(stopCopying, COPY_LIMIT_MS)
    } catch (error) {
      stopMonitor()
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      setRecording(false)
      setMood('idle')
      setStatus(error.name === 'NotAllowedError'
        ? 'Please allow microphone access so I can copy you.'
        : error.message || 'The microphone could not start.')
    }
  }

  function stopCopying() {
    clearTimeout(stopTimerRef.current)
    stopTimerRef.current = null
    setRecording(false)
    if (recorderRef.current?.state === 'recording') {
      setRecordingElapsed(Math.min(COPY_LIMIT_MS, performance.now() - startedAtRef.current))
      setStatus('My turn!')
      recorderRef.current.stop()
    }
  }

  function beginHoldCopying() {
    holdActiveRef.current = true
    startCopying('hold')
  }

  function endHoldCopying() {
    holdActiveRef.current = false
    stopCopying()
  }

  function toggleCopying() {
    if (recording) stopCopying()
    else startCopying('tap')
  }

  return {
    recording,
    recordingElapsed,
    audioLevel,
    stopCopying,
    beginHoldCopying,
    endHoldCopying,
    toggleCopying,
  }
}
