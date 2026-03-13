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
  setBpm,
  getBpm,
  onBeatStep,
  getAudioContext,
} from "@/lib/audioEngine";

// ─── Turntable Component ────────────────────────────────────────────────────

function Turntable({
  spinning,
  onToggleSpin,
}: {
  spinning: boolean;
  onToggleSpin: () => void;
}) {
  const [rotation, setRotation] = useState(0);
  const [scratching, setScratching] = useState(false);
  const [scratchFlash, setScratchFlash] = useState(false);
  const lastAngleRef = useRef<number | null>(null);
  const scratchThrottleRef = useRef(0);
  const animRef = useRef<number>(0);
  const spinSpeedRef = useRef(0);
  const rotationRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let prev = performance.now();
    const animate = (now: number) => {
      const dt = (now - prev) / 1000;
      prev = now;
      if (spinning && !scratching) {
        spinSpeedRef.current = 200;
      } else if (!scratching) {
        spinSpeedRef.current *= 0.94;
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
      setScratching(true);
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
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      rotationRef.current += delta;
      spinSpeedRef.current = delta * 10;
      lastAngleRef.current = angle;
      const now = Date.now();
      if (now - scratchThrottleRef.current > 50 && Math.abs(delta) > 0.8) {
        scratchThrottleRef.current = now;
        playScratch(delta > 0 ? 1 : -1, Math.min(Math.abs(delta) / 8, 1));
        setScratchFlash(true);
        setTimeout(() => setScratchFlash(false), 80);
      }
    },
    [scratching, getAngleFromEvent]
  );

  const handlePointerUp = useCallback(() => {
    setScratching(false);
    lastAngleRef.current = null;
  }, []);

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Turntable deck */}
      <div className="deck-base">
        {/* Platter */}
        <div className="platter">
          {/* Vinyl */}
          <div
            ref={containerRef}
            className="vinyl-container"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ touchAction: "none" }}
          >
            <div
              className={`vinyl-record ${spinning ? "vinyl-glow" : ""} ${scratchFlash ? "vinyl-scratch-flash" : ""}`}
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <div className="vinyl-grooves" />
              <div className="vinyl-label">
                <span className="vinyl-label-text">DJ</span>
                <span className="vinyl-label-sub">SPINNER</span>
              </div>
              <div className="vinyl-shine" />
            </div>
            {!spinning && !scratching && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <span className="text-white/25 text-xs font-bold tracking-[0.2em] uppercase bg-black/30 px-3 py-1 rounded-full">
                  Drag to scratch
                </span>
              </div>
            )}
          </div>
        </div>
        {/* Tonearm */}
        <div
          className="tonearm-wrapper"
          style={{
            transform: spinning ? "rotate(25deg)" : "rotate(0deg)",
          }}
        >
          <div className="tonearm-pivot" />
          <div className="tonearm-arm" />
          <div className="tonearm-head" />
        </div>
      </div>

      {/* Play / Stop */}
      <button
        onClick={onToggleSpin}
        className={`play-btn ${spinning ? "play-btn-active" : ""}`}
      >
        {spinning ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <rect x="5" y="4" width="5" height="16" rx="1.5" />
            <rect x="14" y="4" width="5" height="16" rx="1.5" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="6,4 20,12 6,20" />
          </svg>
        )}
        <span className="text-xs font-black uppercase tracking-[0.15em]">
          {spinning ? "Stop" : "Drop the beat"}
        </span>
      </button>
    </div>
  );
}

// ─── Beat Pad ───────────────────────────────────────────────────────────────

const PAD_CONFIG = [
  { label: "KICK", emoji: "💥", fn: playKick, color: "from-red-500 to-orange-600", key: "Q" },
  { label: "SNARE", emoji: "🥁", fn: playSnare, color: "from-sky-500 to-blue-600", key: "W" },
  { label: "HI-HAT", emoji: "🔔", fn: () => playHiHat(false), color: "from-yellow-400 to-amber-500", key: "E" },
  { label: "CLAP", emoji: "👏", fn: playClap, color: "from-fuchsia-500 to-pink-600", key: "R" },
  { label: "OPEN HH", emoji: "✨", fn: () => playHiHat(true), color: "from-amber-400 to-orange-500", key: "A" },
  { label: "TOM", emoji: "🪘", fn: () => playTom("high"), color: "from-emerald-400 to-green-600", key: "S" },
  { label: "CYMBAL", emoji: "💫", fn: playCymbal, color: "from-indigo-400 to-violet-600", key: "D" },
  { label: "RIM", emoji: "🪵", fn: playRim, color: "from-rose-400 to-red-600", key: "F" },
  { label: "STAB", emoji: "⚡", fn: () => playSynthStab(0), color: "from-purple-500 to-fuchsia-600", key: "Z" },
  { label: "STAB +", emoji: "🔥", fn: () => playSynthStab(4), color: "from-violet-500 to-purple-700", key: "X" },
  { label: "BASS", emoji: "🎵", fn: () => playSynthStab(-5), color: "from-teal-500 to-cyan-600", key: "C" },
  { label: "HORN", emoji: "📯", fn: () => playSynthStab(12), color: "from-pink-400 to-rose-600", key: "V" },
];

function BeatPad({
  label,
  emoji,
  fn,
  color,
  hotkey,
}: {
  label: string;
  emoji: string;
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
    timeoutRef.current = setTimeout(() => setActive(false), 150);
  }, [fn]);

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
      onPointerDown={(e) => {
        e.preventDefault();
        trigger();
      }}
      className={`beat-pad bg-gradient-to-br ${color} ${
        active ? "beat-pad-active" : ""
      }`}
    >
      <span className="text-xl leading-none">{emoji}</span>
      <span className="text-[9px] font-black uppercase tracking-wider opacity-90">
        {label}
      </span>
      <span className="beat-pad-key">{hotkey}</span>
    </button>
  );
}

function BeatPads() {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 text-center">
        Sample Pads
      </div>
      <div className="grid grid-cols-4 gap-2">
        {PAD_CONFIG.map((pad) => (
          <BeatPad
            key={pad.label}
            label={pad.label}
            emoji={pad.emoji}
            fn={pad.fn}
            color={pad.color}
            hotkey={pad.key}
          />
        ))}
      </div>
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
    <div className="flex flex-col items-center gap-1.5 w-full">
      <div className="flex items-center justify-between w-full">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
          Tempo
        </span>
        <span className="text-cyan-400 font-mono text-base font-black tabular-nums">
          {bpm} <span className="text-[9px] text-white/30">BPM</span>
        </span>
      </div>
      <input
        type="range"
        min={60}
        max={200}
        value={bpm}
        onChange={handleChange}
        className="bpm-slider w-full"
      />
      <div className="flex justify-between w-full text-[9px] text-white/20 font-mono">
        <span>60</span>
        <span>200</span>
      </div>
    </div>
  );
}

// ─── Step Sequencer Display ─────────────────────────────────────────────────

function BeatSteps() {
  const [beatStep, setBeatStepLocal] = useState(-1);
  useEffect(() => {
    return onBeatStep((step) => setBeatStepLocal(step));
  }, []);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
        Sequence
      </div>
      <div className="flex gap-[3px]">
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className={`step-dot ${
              beatStep === i
                ? i % 4 === 0
                  ? "step-dot-beat"
                  : "step-dot-sub"
                : i % 4 === 0
                  ? "step-dot-mark"
                  : ""
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────

export default function DJApp() {
  const [started, setStarted] = useState(false);
  const [spinning, setSpinning] = useState(false);

  const handleStart = () => {
    getAudioContext();
    setStarted(true);
  };

  const toggleSpin = useCallback(() => {
    setSpinning((prev) => {
      const next = !prev;
      if (next) startBeat();
      else stopBeat();
      return next;
    });
  }, []);

  // Space bar to toggle beat
  useEffect(() => {
    if (!started) return;
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        toggleSpin();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [started, toggleSpin]);

  if (!started) {
    return (
      <div className="splash-screen">
        <div className="splash-bg" />
        <div className="splash-content">
          <div className="splash-icon">🎧</div>
          <h1 className="splash-title">
            DJ SPINNER
          </h1>
          <p className="text-white/40 text-sm max-w-sm text-center leading-relaxed">
            Scratch the vinyl, smash the pads, drop some beats.
            <br />
            No music degree required.
          </p>
          <button onClick={handleStart} className="splash-btn">
            <span className="text-2xl">▶</span>
            <span>Start DJing</span>
          </button>
          <div className="flex flex-col items-center gap-1 mt-6">
            <p className="text-white/15 text-[10px]">
              All sounds generated via Web Audio API — zero licensed audio
            </p>
            <p className="text-white/10 text-[10px]">
              Keyboard: SPACE = play/stop · Q W E R / A S D F / Z X C V = pads
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="app-bg" />
      <div className="app-content">
        {/* Header */}
        <h1 className="text-xl font-black bg-gradient-to-r from-fuchsia-400 via-cyan-400 to-amber-400 bg-clip-text text-transparent tracking-widest uppercase">
          DJ Spinner
        </h1>

        {/* Main layout */}
        <div className="main-layout">
          {/* Turntable */}
          <Turntable spinning={spinning} onToggleSpin={toggleSpin} />

          {/* Right panel */}
          <div className="right-panel">
            <BeatSteps />
            <BpmSlider />
            <BeatPads />
          </div>
        </div>

        {/* Footer */}
        <p className="text-white/10 text-[10px] text-center">
          SPACE = play/stop · Q W E R / A S D F / Z X C V = pads · Drag vinyl to scratch
        </p>
      </div>
    </div>
  );
}
