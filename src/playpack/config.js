export const COPY_LIMIT_MS = 8000

export const VOICE_STYLES = {
  kitten: { label: 'Kitten', icon: '🐱', rate: 1.42 },
  silly: { label: 'Silly', icon: '😹', rate: 1.2 },
  robot: { label: 'Robot', icon: '🤖', rate: 0.84 },
}

export function bestRecorderOptions() {
  if (!window.MediaRecorder?.isTypeSupported) return undefined
  const types = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm']
  const mimeType = types.find((type) => MediaRecorder.isTypeSupported(type))
  return mimeType ? { mimeType } : undefined
}

export function readStoredChoice(key, allowed, fallback) {
  const stored = localStorage.getItem(key)
  return allowed.includes(stored) ? stored : fallback
}
