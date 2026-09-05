/**
 * Tiny Web Audio helpers - no asset files, everything is synthesised so the app
 * stays installable and works offline.
 */
let audioContext: AudioContext | null = null;
let muted = readMuted();

const STORAGE_KEY = 'dowr.muted';

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

function readMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(next: boolean): void {
  muted = next;
  try {
    localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
  } catch {
    // ignore storage failures
  }
}

function getAudioContext(): AudioContext | null {
  if (audioContext) return audioContext;
  const audioWindow = window as AudioWindow;
  const Ctor = globalThis.AudioContext || audioWindow.webkitAudioContext;
  if (!Ctor) return null;
  audioContext = new Ctor();
  return audioContext;
}

type ToneOptions = {
  frequency: number;
  duration?: number;
  volume?: number;
  type?: OscillatorType;
  delay?: number;
};

function tone({ frequency, duration = 0.1, volume = 0.25, type = 'sine', delay = 0 }: ToneOptions): void {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === 'suspended') void ctx.resume();
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  } catch (error) {
    console.error('Audio error:', error);
  }
}

/** Called from a user gesture so iOS unlocks audio playback. */
export function primeAudio(): void {
  const ctx = getAudioContext();
  if (ctx?.state === 'suspended') void ctx.resume();
}

export function playReady(): void {
  tone({ frequency: 660, duration: 0.09 });
  tone({ frequency: 880, duration: 0.12, delay: 0.09 });
}

export function playCorrect(): void {
  tone({ frequency: 620, duration: 0.08, type: 'triangle' });
  tone({ frequency: 880, duration: 0.08, type: 'triangle', delay: 0.07 });
  tone({ frequency: 1180, duration: 0.14, type: 'triangle', delay: 0.14 });
}

export function playSkip(): void {
  tone({ frequency: 520, duration: 0.09, type: 'square', volume: 0.16 });
  tone({ frequency: 380, duration: 0.12, type: 'square', volume: 0.16, delay: 0.08 });
}

export function playFoul(): void {
  tone({ frequency: 200, duration: 0.22, type: 'sawtooth', volume: 0.2 });
  tone({ frequency: 150, duration: 0.28, type: 'sawtooth', volume: 0.2, delay: 0.16 });
}

export function playTimeUp(): void {
  [0, 0.22, 0.44].forEach((delay) => {
    tone({ frequency: 1046, duration: 0.16, volume: 0.3, delay });
  });
}

export function playTick(): void {
  tone({ frequency: 1400, duration: 0.035, volume: 0.12, type: 'square' });
}

export function playFanfare(): void {
  [523, 659, 784, 1046].forEach((frequency, index) => {
    tone({ frequency, duration: 0.28, volume: 0.24, type: 'triangle', delay: index * 0.13 });
  });
}

/** Haptics are independent of the mute switch - muting silences audio only. */
export function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}
