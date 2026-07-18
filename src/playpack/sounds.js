export function playTinyReaction(kind, volume) {
  if (volume <= 0) return
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    const context = new AudioContext()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const settings = {
      purr: { type: 'triangle', from: 240, peak: 320, end: 220, length: 0.48 },
      giggle: { type: 'sine', from: 610, peak: 850, end: 560, length: 0.34 },
      paw: { type: 'triangle', from: 480, peak: 720, end: 620, length: 0.3 },
      surprise: { type: 'sine', from: 760, peak: 1040, end: 500, length: 0.38 },
    }[kind] || { type: 'triangle', from: 420, peak: 650, end: 380, length: 0.35 }

    oscillator.type = settings.type
    oscillator.frequency.setValueAtTime(settings.from, context.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(settings.peak, context.currentTime + settings.length * 0.35)
    oscillator.frequency.exponentialRampToValueAtTime(settings.end, context.currentTime + settings.length)
    gain.gain.setValueAtTime(0.0001, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(volume * 0.11, context.currentTime + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + settings.length)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + settings.length + 0.02)
    oscillator.onended = () => context.close()
  } catch {
    // The visual reaction still works when synthesized audio is unavailable.
  }
}
