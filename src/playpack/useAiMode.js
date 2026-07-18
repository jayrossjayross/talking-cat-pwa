import { useEffect, useRef, useState } from 'react'

export default function useAiMode({ volume, setMood, setStatus }) {
  const [aiConnected, setAiConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [aiTalking, setAiTalking] = useState(false)
  const peerRef = useRef(null)
  const channelRef = useRef(null)
  const streamRef = useRef(null)
  const remoteAudioRef = useRef(null)

  useEffect(() => {
    if (remoteAudioRef.current) remoteAudioRef.current.volume = volume
  }, [volume])

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    channelRef.current?.close()
    peerRef.current?.close()
    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause()
      remoteAudioRef.current.srcObject = null
    }
  }, [])

  function stopAiSession() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
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

  async function connectAiSession() {
    if (aiConnected || connecting) return
    setConnecting(true)
    setStatus('Waking up my conversation brain...')
    setMood('listening')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
      streamRef.current = stream
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
          if (message.type === 'response.done') setAiTalking(false)
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
      setMood('idle')
      setStatus(error.name === 'NotAllowedError'
        ? 'Please allow microphone access so we can talk.'
        : error.message || 'Conversation mode could not connect.')
    }
  }

  function startAiTalking() {
    if (!aiConnected || aiTalking) return
    const track = streamRef.current?.getAudioTracks()[0]
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
    const track = streamRef.current?.getAudioTracks()[0]
    if (track) track.enabled = false
    if (aiTalking) {
      setAiTalking(false)
      setMood('listening')
      setStatus('Thinking of a tiny cat answer...')
    }
  }

  return {
    aiConnected,
    connecting,
    aiTalking,
    connectAiSession,
    startAiTalking,
    stopAiTalking,
    stopAiSession,
  }
}
