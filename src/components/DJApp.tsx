"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  playKick,
  playSnare,
  playHiHat,
  playClap,
  playTom,
  playCymbal,
  playRim,
  playScratch,
  playSynthStab,
  startBeat,
  stopBeat,
  isBeatPlaying,
  setBpm,
  getBpm,
  onBeatStep,
  getAudioContext,
} from "@/lib/audioEngine";

// ─── Turntable Component ────────────────────────────────────────────────────

function Turntable() {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [scratching, setScratchin] = useState(false);
  const lastAngleRef = useRef<number | null>(null);
  const scratchThrottleRef = useRef(0);
  const animRef = useRef<number>(0);
  const spinSpeedRef = useRef(0);
  const rotationRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Continuous spin animation
  useEffect(() => {
    let prev = performance.now();
    const animate = (now: number) => {
      const dt = (now - prev) / 1000;
      prev = now;
      if (spinning && !scratching) {
        spinSpeedRef.current = 180; // degrees per second (33rpm feel)
      } else if (!scratching) {
        spinSpeedRef.current *= 0.95; // slow down
        if (Math.abs(spinSpeedRef.current) < 0.5) spinSpeedRef.current = 0;
      }
      rotationRef.current += spinSpeedRef.current * dt;
      setRotation(rotationRef.current);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [spinning, scratching]);

  const getAngleFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return 0;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setScratchin(true);
      lastAngleRef.current = getAngleFromEvent(e.clientX, e.clientY);
      spinSpeedRef.current = 0;
    },
    [getAngleFromEvent]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!scratching || lastAngleRef.current === null) return;
      const angle = getAngleFromEvent(e.clientX, e.clientY);
      let delta = angle - lastAngleRef.current;
      // Handle wraparound
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      rotationRef.current += delta;
      spinSpeedRef.current = delta * 10;
      lastAngleRef.current = angle;

      // Throttle scratch sound
      const now = Date.now();
      if (now - scratchThrottleRef.current > 60 && Math.abs(delta) > 1) {
        scratchThrottleRef.current = now;
        playScratch(delta > 0 ? 1 : -1, Math.min(Math.abs(delta) / 10, 1));
      }
    },
    [scratching, getAngleFromEvent]
  );

  const handlePointerUp = useCallback(() => {
    setScratchin(false);
    lastAngleRef.current = null;
  }, []);

  const toggleSpin = useCallback(() => {
    const next = !spinning;
    setSpinning(next);
    if (next) {
      startBeat();
    } else {
      stopBeat();
    }
  }, [spinning]);

  // Beat step indicator
  const [beatStep, setBeatStep] = useState(-1);
  useEffect(() => {
    return onBeatStep((step) => setBeatStep(step));
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Vinyl record */}
      <div
        ref={containerRef}
        className="vinyl-container relative select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: "none" }}
      >
        <div
          className="vinyl-record"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Outer ring */}
          <div className="vinyl-grooves" />
          {/* Label */}
          <div className="vinyl-label">
            <span className="vinyl-label-text">DJ</span>
          </div>
          {/* Shine highlight */}
          <div className="vinyl-shine" />
        </div>
        {/* Tonearm */}
        <div
          className="tonearm"
          style={{
            transform: spinning ? "rotate(22deg)" : "rotate(0deg)",
          }}
        />
        {/* Scratch hint */}
        {!spinning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-white/30 text-sm font-bold tracking-wider uppercase">
              Drag to scratch
            </span>
          </div>
        )}
      </div>

      {/* Play / Stop */}
      <button onClick={toggleSpin} className="play-btn">
        {spinning ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <rect x="5" y="4" width="5" height="16" rx="1" />
            <rect x="14" y="4" width="5" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="6,4 20,12 6,20" />
          </svg>
        )}
        <span className="ml-2 text-sm font-bold uppercase tracking-wider">
          {spinning ? "Stop" : "Play"}
        </span>
      </button>

      {/* Beat step indicator */}
      <div className="flex gap-1">
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-75 ${
              beatStep === i
                ? i % 4 === 0
                  ? "bg-fuchsia-400 shadow-[0_0_8px_rgba(232,121,249,0.8)] scale-125"
                  : "bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)] scale-110"
                : "bg-white/10"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Beat Pad ───────────────────────────────────────────────────────────────

const PAD_CONFIG = [
  { label: "KICK", fn: playKick, color: "from-red-500 to-orange-500", key: "Q" },
  { label: "SNARE", fn: playSnare, color: "from-blue-500 to-cyan-500", key: "W" },
  { label: "HI-HAT", fn: () => playHiHat(false), color: "from-yellow-400 to-amber-500", key: "E" },
  { label: "OPEN HH", fn: () => playHiHat(true), color: "from-yellow-500 to-orange-400", key: "R" },
  { label: "CLAP", fn: playClap, color: "from-fuchsia-500 to-pink-500", key: "A" },
  { label: "TOM HI", fn: () => playTom("high"), color: "from-green-400 to-emerald-500", key: "S" },
  { label: "TOM LO", fn: () => playTom("low"), color: "from-teal-500 to-green-500", key: "D" },
  { label: "CYMBAL", fn: playCymbal, color: "from-indigo-400 to-violet-500", key: "F" },
  { label: "RIM", fn: playRim, color: "from-rose-400 to-red-500", key: "Z" },
  { label: "STAB C", fn: () => playSynthStab(0), color: "from-purple-500 to-fuchsia-500", key: "X" },
  { label: "STAB E", fn: () => playSynthStab(4), color: "from-violet-500 to-purple-600", key: "C" },
  { label: "STAB G", fn: () => playSynthStab(7), color: "from-pink-500 to-rose-600", key: "V" },
];

function BeatPad({
  label,
  fn,
  color,
  hotkey,
}: {
  label: string;
  fn: () => void;
  color: string;
  hotkey: string;
}) {
  const [active, setActive] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const trigger = useCallback(() => {
    getAudioContext();
    fn();
    setActive(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setActive(false), 120);
  }, [fn]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key.toUpperCase() === hotkey) trigger();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [hotkey, trigger]);

  return (
    <button
      onPointerDown={trigger}
      className={`beat-pad bg-gradient-to-br ${color} ${
        active ? "scale-90 brightness-150 shadow-lg" : "scale-100"
      }`}
    >
      <span className="text-[10px] font-black uppercase tracking-wider drop-shadow-md">
        {label}
      </span>
      <span className="text-[9px] opacity-50 font-mono">{hotkey}</span>
    </button>
  );
}

function BeatPads() {
  return (
    <div className="grid grid-cols-4 gap-2 w-full max-w-xs">
      {PAD_CONFIG.map((pad) => (
        <BeatPad
          key={pad.label}
          label={pad.label}
          fn={pad.fn}
          color={pad.color}
          hotkey={pad.key}
        />
      ))}
    </div>
  );
}

// ─── BPM Slider ─────────────────────────────────────────────────────────────

function BpmSlider() {
  const [bpm, setBpmLocal] = useState(getBpm());

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setBpmLocal(v);
    setBpm(v);
  };

  return (
    <div className="flex flex-col items-center gap-1 w-full max-w-xs">
      <div className="flex items-center justify-between w-full text-xs font-bold uppercase tracking-wider text-white/60">
        <span>BPM</span>
        <span className="text-cyan-400 font-mono text-lg">{bpm}</span>
      </div>
      <input
        type="range"
        min={60}
        max={200}
        value={bpm}
        onChange={handleChange}
        className="bpm-slider w-full"
      />
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────

export default function DJApp() {
  const [started, setStarted] = useState(false);

  const handleStart = () => {
    getAudioContext();
    setStarted(true);
  };

  if (!started) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a12] gap-6">
        <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-yellow-400 bg-clip-text text-transparent drop-shadow-lg animate-pulse">
          DJ SPINNER
        </h1>
        <p className="text-white/40 text-sm max-w-xs text-center">
          An interactive cartoon turntable toy. Tap pads, scratch the vinyl, drop beats!
        </p>
        <button
          onClick={handleStart}
          className="px-8 py-4 bg-gradient-to-r from-fuchsia-600 to-cyan-500 text-white font-black text-lg rounded-2xl 
                     hover:scale-105 active:scale-95 transition-transform shadow-[0_0_30px_rgba(168,85,247,0.4)]
                     uppercase tracking-widest"
        >
          Start DJing
        </button>
        <p className="text-white/20 text-[10px] mt-8">
          All sounds procedurally generated via Web Audio API — no samples or licensed audio
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a12] p-4 gap-6 overflow-hidden">
      {/* Title */}
      <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-yellow-400 bg-clip-text text-transparent">
        DJ SPINNER
      </h1>

      {/* Main area */}
      <div className="flex flex-col lg:flex-row items-center gap-8 w-full max-w-4xl justify-center">
        {/* Turntable */}
        <Turntable />

        {/* Right panel */}
        <div className="flex flex-col items-center gap-5">
          <BpmSlider />
          <BeatPads />
        </div>
      </div>

      {/* Footer */}
      <p className="text-white/15 text-[10px] mt-4 text-center">
        All sounds generated with the Web Audio API. No licensed audio. Built for fun!
        <br />
        Keyboard: Q W E R / A S D F / Z X C V for pads
      </p>
    </div>
  );
}
