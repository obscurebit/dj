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

let beatCallbacks: BeatCallback[] = [];

export function onBeatStep(cb: BeatCallback) {
  beatCallbacks.push(cb);
  return () => {
    beatCallbacks = beatCallbacks.filter((c) => c !== cb);
  };
}

export function startBeat(newBpm?: number) {
  if (newBpm) bpm = newBpm;
  stopBeat();
  currentStep = 0;
  const stepTime = (60 / bpm / 4) * 1000; // 16th notes
  beatInterval = setInterval(() => {
    const fns = defaultPattern[currentStep % defaultPattern.length];
    fns.forEach((fn) => fn());
    beatCallbacks.forEach((cb) => cb(currentStep % defaultPattern.length));
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
