/**
 * Audio context for generating sound effects
 */
let audioContext: AudioContext | null = null;

type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

/**
 * Initialize AudioContext if not already initialized
 */
function getAudioContext(): AudioContext {
  if (!audioContext) {
    const audioWindow = window as AudioWindow;
    const AudioContextConstructor = globalThis.AudioContext || audioWindow.webkitAudioContext;
    if (!AudioContextConstructor) {
      throw new Error('Web Audio API is not supported in this browser');
    }
    audioContext = new AudioContextConstructor();
  }
  if (!audioContext) {
    throw new Error('Audio context is not available');
  }
  return audioContext;
}

/**
 * Play a beep sound with specified frequency and duration
 */
function playBeep(frequency: number, duration: number = 100, volume: number = 0.3): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Create oscillator and gain nodes
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.value = frequency;
    osc.type = 'sine';
    
    // Set volume envelope
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration / 1000);
    
    // Play the sound
    osc.start(now);
    osc.stop(now + duration / 1000);
  } catch (error) {
    console.error('Error playing beep:', error);
  }
}

/**
 * Ready beep - ascending tone (positive)
 * Used when player clicks ready button
 */
export function playReadyBeep(): void {
  playBeep(800, 100, 0.3);
  setTimeout(() => playBeep(1000, 100, 0.3), 120);
}

/**
 * Got it beep - double ascending tone (success)
 * Used when player clicks "Got It!"
 */
export function playGotItBeep(): void {
  playBeep(600, 80, 0.3);
  setTimeout(() => playBeep(900, 80, 0.3), 100);
  setTimeout(() => playBeep(1200, 80, 0.3), 200);
}

/**
 * Skip beep - descending tone (neutral)
 * Used when player skips a word
 */
export function playSkipBeep(): void {
  playBeep(1000, 100, 0.3);
  setTimeout(() => playBeep(700, 100, 0.3), 120);
}

/**
 * Time ended beep - warning tone (alert)
 * Used when timer ends
 */
export function playTimeEndedBeep(): void {
  // Fast double beep pattern for urgency
  playBeep(1200, 150, 0.4);
  setTimeout(() => playBeep(1200, 150, 0.4), 200);
  setTimeout(() => playBeep(1200, 150, 0.4), 400);
}
