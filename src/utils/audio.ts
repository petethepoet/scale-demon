// ─── Web Audio API helpers ────────────────────────────────────────────────────

let audioCtx: AudioContext | null = null
let metronomeInterval: ReturnType<typeof setInterval> | null = null
let droneOscillator: OscillatorNode | null = null
let droneGain: GainNode | null = null

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

// ─── Metronome ────────────────────────────────────────────────────────────────

function clickTick(ctx: AudioContext, isDownbeat = false) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.frequency.value = isDownbeat ? 1000 : 800
  gain.gain.setValueAtTime(0.4, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)

  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.06)
}

let beatCount = 0

export function startMetronome(bpm: number, beatsPerBar = 4): void {
  stopMetronome()
  beatCount = 0
  const ctx = getCtx()
  const intervalMs = (60 / bpm) * 1000

  clickTick(ctx, true)
  beatCount = 1

  metronomeInterval = setInterval(() => {
    clickTick(ctx, beatCount % beatsPerBar === 0)
    beatCount++
  }, intervalMs)
}

export function stopMetronome(): void {
  if (metronomeInterval !== null) {
    clearInterval(metronomeInterval)
    metronomeInterval = null
  }
  beatCount = 0
}

export function isMetronomeRunning(): boolean {
  return metronomeInterval !== null
}

// ─── Drone ────────────────────────────────────────────────────────────────────

function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

// Root MIDI note: C4 = 60, add rootIndex offset
export function startDrone(rootIndex: number, octave = 3): void {
  stopDrone()
  const ctx = getCtx()

  const midi = 48 + rootIndex + (octave - 3) * 12  // C3 = 48

  droneOscillator = ctx.createOscillator()
  droneGain = ctx.createGain()

  // Add a second harmonic oscillator for richness
  const osc2 = ctx.createOscillator()
  const gain2 = ctx.createGain()
  osc2.type = 'sine'
  osc2.frequency.value = midiToHz(midi + 12) // octave up
  gain2.gain.value = 0.15
  osc2.connect(gain2)
  gain2.connect(ctx.destination)
  osc2.start()

  droneOscillator.type = 'sawtooth'
  droneOscillator.frequency.value = midiToHz(midi)

  // Lowpass filter for warmth
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 1200

  droneGain.gain.value = 0
  droneOscillator.connect(filter)
  filter.connect(droneGain)
  droneGain.connect(ctx.destination)

  droneOscillator.start()

  // Fade in
  droneGain.gain.setValueAtTime(0, ctx.currentTime)
  droneGain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.3)

  // Store osc2 ref for cleanup
  ;(droneOscillator as any).__osc2 = osc2
  ;(droneOscillator as any).__gain2 = gain2
}

export function stopDrone(): void {
  if (!droneOscillator || !droneGain || !audioCtx) return

  const ctx = audioCtx
  const osc = droneOscillator
  const gain = droneGain
  const osc2 = (osc as any).__osc2 as OscillatorNode | undefined
  const gain2 = (osc as any).__gain2 as GainNode | undefined

  // Fade out
  gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3)
  osc.stop(ctx.currentTime + 0.35)

  if (osc2 && gain2) {
    gain2.gain.setValueAtTime(gain2.gain.value, ctx.currentTime)
    gain2.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3)
    osc2.stop(ctx.currentTime + 0.35)
  }

  droneOscillator = null
  droneGain = null
}

export function isDroneRunning(): boolean {
  return droneOscillator !== null
}

// ─── Grade sound cue ─────────────────────────────────────────────────────────

export function playGradeCue(grade: 'again' | 'hard' | 'good' | 'easy'): void {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    if (grade === 'easy') {
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    } else if (grade === 'good') {
      osc.frequency.value = 740
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
    } else if (grade === 'hard') {
      osc.frequency.value = 550
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09)
    } else {
      // again
      osc.frequency.value = 220
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    }

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.2)
  } catch {
    // Audio not available
  }
}
