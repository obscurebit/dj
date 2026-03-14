// Web Audio API sound engine — all sounds are procedurally generated, no samples needed

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let compressor: DynamicsCompressorNode | null = null;

export function getAudioContext(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 4;
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.7;
    masterGain.connect(compressor);
    compressor.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function getMaster(): GainNode {
  getAudioContext();
  return masterGain!;
}

// --- Synthesized drum sounds ---

export function playKick() {
  const c = getAudioContext();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(150, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(30, c.currentTime + 0.15);
  gain.gain.setValueAtTime(1, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4);
  osc.connect(gain);
  gain.connect(getMaster());
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.4);
}

export function playSnare() {
  const c = getAudioContext();
  const bufferSize = c.sampleRate * 0.15;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = c.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = c.createGain();
  noiseGain.gain.setValueAtTime(0.8, c.currentTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
  const filter = c.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 1000;
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(getMaster());
  noise.start(c.currentTime);

  const osc = c.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(180, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(60, c.currentTime + 0.08);
  const oscGain = c.createGain();
  oscGain.gain.setValueAtTime(0.6, c.currentTime);
  oscGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
  osc.connect(oscGain);
  oscGain.connect(getMaster());
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.08);
}

export function playHiHat(open = false) {
  const c = getAudioContext();
  const duration = open ? 0.3 : 0.08;
  const bufferSize = c.sampleRate * duration;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = c.createBufferSource();
  noise.buffer = buffer;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.3, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 8000;
  filter.Q.value = 1;
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(getMaster());
  noise.start(c.currentTime);
}

export function playClap() {
  const c = getAudioContext();
  const bufferSize = c.sampleRate * 0.15;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    const env = i < bufferSize * 0.05 ? 1 : Math.exp(-((i - bufferSize * 0.05) / (bufferSize * 0.3)));
    data[i] = (Math.random() * 2 - 1) * env;
  }
  const noise = c.createBufferSource();
  noise.buffer = buffer;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.6, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1200;
  filter.Q.value = 0.7;
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(getMaster());
  noise.start(c.currentTime);
}

export function playTom(pitch: "high" | "mid" | "low" = "mid") {
  const c = getAudioContext();
  const freqMap = { high: 300, mid: 200, low: 120 };
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freqMap[pitch], c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(freqMap[pitch] * 0.5, c.currentTime + 0.2);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.6, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25);
  osc.connect(gain);
  gain.connect(getMaster());
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.25);
}

export function playCymbal() {
  const c = getAudioContext();
  const bufferSize = c.sampleRate * 0.6;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = c.createBufferSource();
  noise.buffer = buffer;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.25, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.6);
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 6000;
  noise.connect(hp);
  hp.connect(gain);
  gain.connect(getMaster());
  noise.start(c.currentTime);
}

export function playRim() {
  const c = getAudioContext();
  const osc = c.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(800, c.currentTime);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.3, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.05);
  osc.connect(gain);
  gain.connect(getMaster());
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.05);
}

// --- Scratch sound ---
export function playScratch(direction: number, intensity: number) {
  const c = getAudioContext();
  const duration = 0.08 + Math.abs(intensity) * 0.12;
  const baseFreq = 200 + Math.abs(intensity) * 600;
  const osc = c.createOscillator();
  osc.type = "sawtooth";
  if (direction > 0) {
    osc.frequency.setValueAtTime(baseFreq * 0.5, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 2, c.currentTime + duration);
  } else {
    osc.frequency.setValueAtTime(baseFreq * 2, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, c.currentTime + duration);
  }
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.15 * Math.min(intensity, 1), c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1500;
  filter.Q.value = 2;
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(getMaster());
  osc.start(c.currentTime);
  osc.stop(c.currentTime + duration);
}

// --- Pitched bass note ---
export function playBassNote(note: number = 0) {
  const c = getAudioContext();
  const t = c.currentTime;
  const freq = 55 * Math.pow(2, note / 12); // A1 base
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, t);
  const sub = c.createOscillator();
  sub.type = "triangle";
  sub.frequency.setValueAtTime(freq, t);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.35, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 400;
  osc.connect(lp);
  sub.connect(lp);
  lp.connect(gain);
  gain.connect(getMaster());
  osc.start(t);
  osc.stop(t + 0.35);
  sub.start(t);
  sub.stop(t + 0.35);
}

// --- Chord pad ---
export function playChordPad(notes: number[] = [0, 4, 7], duration = 0.6) {
  const c = getAudioContext();
  const t = c.currentTime;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.08, t);
  gain.gain.setValueAtTime(0.08, t + duration * 0.7);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(2000, t);
  lp.frequency.exponentialRampToValueAtTime(600, t + duration);
  lp.connect(gain);
  gain.connect(getMaster());
  notes.forEach((note) => {
    const freq = 261.63 * Math.pow(2, note / 12); // C4 base
    const osc = c.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    const osc2 = c.createOscillator();
    osc2.type = "sawtooth";
    osc2.frequency.value = freq * 1.004;
    osc.connect(lp);
    osc2.connect(lp);
    osc.start(t);
    osc.stop(t + duration);
    osc2.start(t);
    osc2.stop(t + duration);
  });
}

// --- Melody note (for number keys) — warm plucky analog synth tone ---
export function playMelodyNote(note: number) {
  const c = getAudioContext();
  const t = c.currentTime;
  // C4 (261 Hz) base — sits warmly in the mid-range
  const freq = 261.63 * Math.pow(2, note / 12);
  const master = getMaster();

  // Main square wave — classic analog synth character
  const osc1 = c.createOscillator();
  osc1.type = "square";
  osc1.frequency.value = freq;

  // Detuned saw for thickness
  const osc2 = c.createOscillator();
  osc2.type = "sawtooth";
  osc2.frequency.value = freq * 1.005;

  const oscMix = c.createGain();
  oscMix.gain.value = 0.35;

  // Filter sweep — opens on attack, closes for warmth
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(3500, t);
  filter.frequency.exponentialRampToValueAtTime(300, t + 0.6);
  filter.Q.value = 2;

  // Percussive pluck envelope — sharp attack, smooth decay
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.18, t);
  gain.gain.setValueAtTime(0.14, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

  // Pluck click — short noise burst for tactile attack
  const clickLen = Math.round(c.sampleRate * 0.008);
  const clickBuf = c.createBuffer(1, clickLen, c.sampleRate);
  const clickData = clickBuf.getChannelData(0);
  for (let i = 0; i < clickLen; i++) {
    clickData[i] = (Math.random() * 2 - 1) * (1 - i / clickLen);
  }
  const click = c.createBufferSource();
  click.buffer = clickBuf;
  const clickGain = c.createGain();
  clickGain.gain.value = 0.06;

  osc1.connect(filter);
  osc2.connect(oscMix);
  oscMix.connect(filter);
  filter.connect(gain);
  click.connect(clickGain);
  clickGain.connect(gain);
  gain.connect(master);

  osc1.start(t);
  osc1.stop(t + 0.7);
  osc2.start(t);
  osc2.stop(t + 0.7);
  click.start(t);
}

// --- Ride cymbal ---
export function playRide(accent = false) {
  const c = getAudioContext();
  const t = c.currentTime;
  const bufLen = c.sampleRate * 0.3;
  const buf = c.createBuffer(1, bufLen, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 8000;
  bp.Q.value = 1.5;
  const gain = c.createGain();
  gain.gain.setValueAtTime(accent ? 0.15 : 0.08, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + (accent ? 0.25 : 0.12));
  src.connect(bp);
  bp.connect(gain);
  gain.connect(getMaster());
  src.start(t);
}

// --- Simple looping beat sequencer ---

type BeatCallback = (step: number) => void;

let beatInterval: ReturnType<typeof setInterval> | null = null;
let currentStep = 0;
let bpm = 120;

const defaultPattern: Array<() => void>[] = [
  [playKick],
  [],
  [() => playHiHat(false)],
  [],
  [playSnare, () => playHiHat(false)],
  [],
  [() => playHiHat(false)],
  [playKick],
  [playKick],
  [],
  [() => playHiHat(false)],
  [],
  [playSnare, () => playHiHat(true)],
  [],
  [() => playHiHat(false)],
  [],
];

let activePattern: Array<() => void>[] = defaultPattern;
let activePatternId: string = "default";
let beatCallbacks: BeatCallback[] = [];
let patternChangeCallbacks: Array<(id: string) => void> = [];

export function onBeatStep(cb: BeatCallback) {
  beatCallbacks.push(cb);
  return () => {
    beatCallbacks = beatCallbacks.filter((c) => c !== cb);
  };
}

export function setPattern(id: string, pattern: Array<() => void>[], newBpm?: number) {
  activePatternId = id;
  activePattern = pattern;
  if (newBpm) bpm = newBpm;
  patternChangeCallbacks.forEach((cb) => cb(id));
  if (isBeatPlaying()) startBeat();
}

export function getPatternId() {
  return activePatternId;
}

export function onPatternChange(cb: (id: string) => void) {
  patternChangeCallbacks.push(cb);
  return () => {
    patternChangeCallbacks = patternChangeCallbacks.filter((c) => c !== cb);
  };
}

export function startBeat(newBpm?: number) {
  if (newBpm) bpm = newBpm;
  stopBeat();
  currentStep = 0;
  const stepTime = (60 / bpm / 4) * 1000; // 16th notes
  beatInterval = setInterval(() => {
    const step = currentStep % activePattern.length;
    const fns = activePattern[step];
    fns.forEach((fn) => fn());
    // Play enabled user loops
    for (const loop of userLoops) {
      if (loop.enabled) {
        const loopFns = loop.steps[step % loop.steps.length];
        loopFns.forEach((fn) => fn());
      }
    }
    beatCallbacks.forEach((cb) => cb(step));
    currentStep++;
  }, stepTime);
}

export function stopBeat() {
  if (beatInterval) {
    clearInterval(beatInterval);
    beatInterval = null;
  }
  currentStep = 0;
}

export function isBeatPlaying() {
  return beatInterval !== null;
}

export function setBpm(newBpm: number) {
  bpm = newBpm;
  if (isBeatPlaying()) {
    startBeat(newBpm);
  }
}

export function getBpm() {
  return bpm;
}

// --- Metronome click (quiet tick for blank recording track) ---
export function playClick(accent = false) {
  const c = getAudioContext();
  const t = c.currentTime;
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.value = accent ? 1200 : 900;
  const gain = c.createGain();
  gain.gain.setValueAtTime(accent ? 0.12 : 0.06, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
  osc.connect(gain);
  gain.connect(getMaster());
  osc.start(t);
  osc.stop(t + 0.03);
}

// --- Loop Recorder ---

export interface UserLoop {
  id: number;
  name: string;
  steps: Array<Array<() => void>>;
  enabled: boolean;
}

let nextLoopId = 1;
let userLoops: UserLoop[] = [];
let recording = false;
let recordingLoop: Array<Array<() => void>> | null = null;
let loopChangeCallbacks: Array<() => void> = [];
let recordingChangeCallbacks: Array<(recording: boolean) => void> = [];

export function onLoopChange(cb: () => void) {
  loopChangeCallbacks.push(cb);
  return () => { loopChangeCallbacks = loopChangeCallbacks.filter((c) => c !== cb); };
}

function notifyLoopChange() {
  loopChangeCallbacks.forEach((cb) => cb());
}

export function onRecordingChange(cb: (r: boolean) => void) {
  recordingChangeCallbacks.push(cb);
  return () => { recordingChangeCallbacks = recordingChangeCallbacks.filter((c) => c !== cb); };
}

export function isRecording() {
  return recording;
}

export function startRecording() {
  recording = true;
  recordingLoop = Array.from({ length: 16 }, () => []);
  recordingChangeCallbacks.forEach((cb) => cb(true));
}

export function stopRecording() {
  if (recordingLoop) {
    // Only save if something was actually recorded
    const hasContent = recordingLoop.some((s) => s.length > 0);
    if (hasContent) {
      userLoops.push({
        id: nextLoopId++,
        name: `Loop ${userLoops.length + 1}`,
        steps: recordingLoop,
        enabled: true,
      });
      notifyLoopChange();
    }
  }
  recording = false;
  recordingLoop = null;
  recordingChangeCallbacks.forEach((cb) => cb(false));
}

export function recordHit(fn: () => void) {
  if (!recording || !recordingLoop) return;
  const step = currentStep % 16;
  recordingLoop[step].push(fn);
}

export function toggleLoop(id: number) {
  const loop = userLoops.find((l) => l.id === id);
  if (loop) {
    loop.enabled = !loop.enabled;
    notifyLoopChange();
  }
}

export function deleteLoop(id: number) {
  userLoops = userLoops.filter((l) => l.id !== id);
  notifyLoopChange();
}

export function clearAllLoops() {
  userLoops = [];
  notifyLoopChange();
}

export function getLoops(): UserLoop[] {
  return [...userLoops];
}

export function getCurrentStep() {
  return currentStep % 16;
}

// --- Synth stab for fun ---
export function playSynthStab(note: number = 0) {
  const c = getAudioContext();
  const freq = 220 * Math.pow(2, note / 12);
  const osc1 = c.createOscillator();
  osc1.type = "sawtooth";
  osc1.frequency.value = freq;
  const osc2 = c.createOscillator();
  osc2.type = "square";
  osc2.frequency.value = freq * 1.005;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.2, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(3000, c.currentTime);
  filter.frequency.exponentialRampToValueAtTime(300, c.currentTime + 0.3);
  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(getMaster());
  osc1.start(c.currentTime);
  osc1.stop(c.currentTime + 0.3);
  osc2.start(c.currentTime);
  osc2.stop(c.currentTime + 0.3);
}

// --- Deep bass hit ---
export function playBass() {
  const c = getAudioContext();
  const t = c.currentTime;
  // Sub oscillator
  const sub = c.createOscillator();
  sub.type = "sine";
  sub.frequency.setValueAtTime(55, t);
  sub.frequency.exponentialRampToValueAtTime(40, t + 0.5);
  // Harmonics layer
  const mid = c.createOscillator();
  mid.type = "triangle";
  mid.frequency.setValueAtTime(110, t);
  mid.frequency.exponentialRampToValueAtTime(80, t + 0.4);
  // Waveshaper for warmth
  const shaper = c.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const x = (i / 128) - 1;
    curve[i] = Math.tanh(x * 2);
  }
  shaper.curve = curve;
  // Gain envelope
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.5, t);
  gain.gain.setValueAtTime(0.5, t + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
  // Low pass to keep it round
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 200;
  lp.Q.value = 1;
  sub.connect(shaper);
  mid.connect(shaper);
  shaper.connect(lp);
  lp.connect(gain);
  gain.connect(getMaster());
  sub.start(t);
  sub.stop(t + 0.6);
  mid.start(t);
  mid.stop(t + 0.6);
}

// --- Brass horn stab ---
export function playHorn() {
  const c = getAudioContext();
  const t = c.currentTime;
  const freq = 349; // F4 — brassy
  // Two detuned sawtooths for thickness
  const osc1 = c.createOscillator();
  osc1.type = "sawtooth";
  osc1.frequency.value = freq;
  const osc2 = c.createOscillator();
  osc2.type = "sawtooth";
  osc2.frequency.value = freq * 1.003;
  const osc3 = c.createOscillator();
  osc3.type = "sawtooth";
  osc3.frequency.value = freq * 2; // octave up
  // Brass-like attack: filter opens fast then closes
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 3;
  filter.frequency.setValueAtTime(400, t);
  filter.frequency.exponentialRampToValueAtTime(4000, t + 0.04);
  filter.frequency.exponentialRampToValueAtTime(1200, t + 0.4);
  // Gain: punchy attack, medium sustain
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.001, t);
  gain.gain.linearRampToValueAtTime(0.25, t + 0.03);
  gain.gain.setValueAtTime(0.25, t + 0.15);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  // Octave layer quieter
  const octGain = c.createGain();
  octGain.gain.value = 0.08;
  osc1.connect(filter);
  osc2.connect(filter);
  osc3.connect(octGain);
  octGain.connect(filter);
  filter.connect(gain);
  gain.connect(getMaster());
  osc1.start(t);
  osc1.stop(t + 0.5);
  osc2.start(t);
  osc2.stop(t + 0.5);
  osc3.start(t);
  osc3.stop(t + 0.5);
}
