"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import mixpanel from "mixpanel-browser";
import {
  getAudioContext,
  playKick,
  playSnare,
  playHiHat,
  playClap,
  playTom,
  playCymbal,
  playRim,
  playRide,
  playScratch,
  playSynthStab,
  playBass,
  playHorn,
  playMelodyNote,
  startBeat,
  stopBeat,
  setBpm,
  getBpm,
  onBeatStep,
  setPattern,
  getPatternId,
  recordHit,
  isRecording,
  startRecording,
  stopRecording,
  onRecordingChange,
  getLoops,
  toggleLoop,
  deleteLoop,
  clearAllLoops,
  onLoopChange,
  type UserLoop,
} from "@/lib/audioEngine";
import VINYL_DESIGNS, { type VinylDesign } from "@/lib/vinylDesigns";
import TRACKS, { type Track } from "@/lib/tracks";
import {
  loadSave,
  onSaveChange,
  onVinylUnlock,
  recordScratch,
  recordPadHit,
  recordBeatStep,
  selectVinyl,
  selectArt,
  getSave,
  getSelectedVinyl,
  getSelectedArt,
  unlockAll,
  type SaveData,
} from "@/lib/progression";
import { VinylArtSVG, VINYL_ART } from "@/lib/vinylArt";
import {
  initParticles,
  destroyParticles,
  emitScratchParticles,
  emitPadBurst,
  emitUnlockCelebration,
  emitFloatingNote,
} from "@/lib/particles";

// ─── Mixpanel Initialization ───────────────────────────────────────────────

mixpanel.init("3463d9169d176f3de1af6a2384b48bc5", {
  debug: true,
  track_pageview: true,
  persistence: "localStorage",
  autocapture: true,
  record_sessions_percent: 100,
});

// ─── Particle Canvas Overlay ────────────────────────────────────────────────

function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) initParticles(ref.current);
    return destroyParticles;
  }, []);
  return (
    <canvas
      ref={ref}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 50 }}
    />
  );
}

// ─── Unlock Notification (subtle ambient glow) ─────────────────────────────

function UnlockNotice({
  vinyl,
  onDone,
}: {
  vinyl: VinylDesign | null;
  onDone: () => void;
}) {
  useEffect(() => {
    if (!vinyl) return;
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [vinyl, onDone]);

  if (!vinyl) return null;

  return (
    <div className="unlock-notice" onClick={onDone}>
      <div
        className="unlock-notice-glow"
        style={{ background: vinyl.labelGradient }}
      />
      <div className="unlock-notice-content">
        <div
          className="unlock-notice-swatch"
          style={{ background: vinyl.labelGradient }}
        />
        <span className="unlock-notice-text">{vinyl.name}</span>
      </div>
    </div>
  );
}

// ─── Vinyl Picker (crate flip-through) ──────────────────────────────────────

function VinylPicker({
  save,
  open,
  onClose,
}: {
  save: SaveData;
  open: boolean;
  onClose: () => void;
}) {
  const unlocked = VINYL_DESIGNS.filter((v) =>
    save.unlockedVinylIds.includes(v.id)
  );
  const currentIdx = unlocked.findIndex((v) => v.id === save.selectedVinylId);
  const [idx, setIdx] = useState(Math.max(0, currentIdx));
  const [flipDir, setFlipDir] = useState(0); // -1 left, 1 right, 0 none

  useEffect(() => {
    if (open) {
      const ci = unlocked.findIndex((v) => v.id === save.selectedVinylId);
      setIdx(Math.max(0, ci));
      setFlipDir(0);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setFlipDir(-1);
        setIdx((i) => (i > 0 ? i - 1 : unlocked.length - 1));
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setFlipDir(1);
        setIdx((i) => (i < unlocked.length - 1 ? i + 1 : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        selectVinyl(unlocked[idx]?.id || unlocked[0].id);
        onClose();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, idx, unlocked, onClose]);

  if (!open) return null;

  const record = unlocked[idx] || unlocked[0];
  const isSelected = record.id === save.selectedVinylId;

  return (
    <div className="vinyl-picker-overlay" onClick={onClose}>
      <div className="crate-container" onClick={(e) => e.stopPropagation()}>
        {/* Sleeve stack with flip animation */}
        <div className="crate-stage">
          {/* Previous sleeve peek */}
          <div className="crate-peek crate-peek-left" />
          <div className="crate-peek crate-peek-right" />

          {/* Main sleeve */}
          <div
            key={record.id}
            className={`crate-sleeve-main ${
              flipDir === -1 ? "crate-flip-left" : flipDir === 1 ? "crate-flip-right" : "crate-flip-in"
            }`}
          >
            {/* Album art — abstract shapes from the gradient */}
            <div
              className="crate-art"
              style={{ background: record.labelGradient, cursor: "pointer" }}
              onClick={() => { selectVinyl(record.id); onClose(); }}
            >
              <div className="crate-art-circle crate-art-circle-1" style={{
                background: `linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.02))`,
              }} />
              <div className="crate-art-circle crate-art-circle-2" style={{
                background: `linear-gradient(135deg, rgba(0,0,0,0.15), rgba(0,0,0,0.03))`,
              }} />
              <div className="crate-art-lines">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="crate-art-line" style={{
                    opacity: 0.06 + i * 0.02,
                    top: `${20 + i * 18}%`,
                  }} />
                ))}
              </div>
              <div className="crate-art-title">{record.name}</div>
            </div>

            {/* Vinyl peeking out the top */}
            <div className="crate-disc-peek">
              <div
                className="crate-disc"
                style={{ background: record.labelGradient }}
              >
                <div className="crate-disc-inner" />
                <div className="crate-disc-groove crate-disc-groove-1" />
                <div className="crate-disc-groove crate-disc-groove-2" />
                <div className="crate-disc-groove crate-disc-groove-3" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="crate-nav">
          <button
            className="crate-nav-btn"
            onClick={() => {
              setFlipDir(-1);
              setIdx((i) => (i > 0 ? i - 1 : unlocked.length - 1));
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </button>

          <button
            className={`crate-select-btn ${isSelected ? "crate-select-active" : ""}`}
            onClick={() => {
              selectVinyl(record.id);
              onClose();
            }}
          >
            {isSelected ? "Playing" : "Select"}
          </button>

          <button
            className="crate-nav-btn"
            onClick={() => {
              setFlipDir(1);
              setIdx((i) => (i < unlocked.length - 1 ? i + 1 : 0));
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </button>
        </div>

        {/* Dots */}
        <div className="crate-dots">
          {unlocked.map((v, i) => (
            <div
              key={v.id}
              className={`crate-dot ${i === idx ? "crate-dot-active" : ""}`}
              style={i === idx ? { background: record.labelGradient } : undefined}
            />
          ))}
        </div>

        {/* Vinyl Art Selector */}
        {save.unlockedArtIds.length > 1 && (
          <div className="vinyl-art-picker">
            <span className="vinyl-art-picker-label">center art</span>
            <div className="vinyl-art-picker-grid">
              {VINYL_ART.filter((a) => save.unlockedArtIds.includes(a.id)).map((art) => (
                <button
                  key={art.id}
                  className={`vinyl-art-option ${save.selectedArtId === art.id ? "vinyl-art-option-active" : ""}`}
                  onClick={() => selectArt(art.id)}
                  title={art.name}
                >
                  {art.id === "dj" ? (
                    <span className="vinyl-art-option-text">DJ</span>
                  ) : (
                    <VinylArtSVG artId={art.id} />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Track Picker (genre crate) ─────────────────────────────────────────────

function TrackPicker({
  open,
  onClose,
  currentTrackId,
  save,
}: {
  open: boolean;
  currentTrackId: string;
  onClose: () => void;
  save: SaveData;
}) {
  const unlocked = TRACKS.filter((t) => save.unlockedTrackIds.includes(t.id));
  const currentIdx = unlocked.findIndex((t) => t.id === currentTrackId);
  const [idx, setIdx] = useState(Math.max(0, currentIdx));
  const [flipDir, setFlipDir] = useState(0);

  useEffect(() => {
    if (open) {
      const ci = unlocked.findIndex((t) => t.id === currentTrackId);
      setIdx(Math.max(0, ci));
      setFlipDir(0);
    }
  }, [open, currentTrackId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setFlipDir(-1);
        setIdx((i) => (i > 0 ? i - 1 : unlocked.length - 1));
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setFlipDir(1);
        setIdx((i) => (i < unlocked.length - 1 ? i + 1 : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const t = unlocked[idx];
        setPattern(t.id, t.pattern, t.bpm);
        setBpm(t.bpm);
        onClose();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, idx, unlocked, onClose]);

  if (!open) return null;

  const track = unlocked[idx] || unlocked[0];
  const isActive = track.id === currentTrackId;

  return (
    <div className="vinyl-picker-overlay" onClick={onClose}>
      <div className="crate-container" onClick={(e) => e.stopPropagation()}>
        <div className="crate-stage">
          <div className="crate-peek crate-peek-left" />
          <div className="crate-peek crate-peek-right" />

          <div
            key={track.id}
            className={`crate-sleeve-main ${
              flipDir === -1 ? "crate-flip-left" : flipDir === 1 ? "crate-flip-right" : "crate-flip-in"
            }`}
          >
            <div
              className="crate-art"
              style={{ background: track.color, cursor: "pointer" }}
              onClick={() => {
                setPattern(track.id, track.pattern, track.bpm);
                setBpm(track.bpm);
                onClose();
              }}
            >
              {/* Genre-specific abstract art */}
              <div className="track-art-shapes">
                <svg viewBox="0 0 168 168" className="track-art-svg">
                  {/* Waveform lines */}
                  {Array.from({ length: 8 }).map((_, i) => (
                    <line
                      key={`h${i}`}
                      x1="20"
                      y1={30 + i * 16}
                      x2={60 + Math.sin(i * 1.2 + idx) * 80}
                      y2={30 + i * 16}
                      stroke={track.artAccent}
                      strokeWidth="2"
                      strokeLinecap="round"
                      opacity={0.3 + i * 0.05}
                    />
                  ))}
                  {/* Genre icon circle */}
                  <circle
                    cx="120"
                    cy="50"
                    r="28"
                    fill="none"
                    stroke={track.artAccent}
                    strokeWidth="1.5"
                    opacity="0.25"
                  />
                  <circle
                    cx="120"
                    cy="50"
                    r="12"
                    fill={track.artAccent}
                    opacity="0.15"
                  />
                </svg>
              </div>
              <div className="track-art-genre">{track.genre}</div>
              <div className="crate-art-title">{track.name}</div>
            </div>

            {/* BPM badge peeking from corner */}
            <div className="track-bpm-badge">{track.bpm} BPM</div>
          </div>
        </div>

        <div className="crate-nav">
          <button
            className="crate-nav-btn"
            onClick={() => {
              setFlipDir(-1);
              setIdx((i) => (i > 0 ? i - 1 : TRACKS.length - 1));
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </button>

          <button
            className={`crate-select-btn ${isActive ? "crate-select-active" : ""}`}
            onClick={() => {
              setPattern(track.id, track.pattern, track.bpm);
              setBpm(track.bpm);
              onClose();
            }}
          >
            {isActive ? "Playing" : "Select"}
          </button>

          <button
            className="crate-nav-btn"
            onClick={() => {
              setFlipDir(1);
              setIdx((i) => (i < TRACKS.length - 1 ? i + 1 : 0));
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </button>
        </div>

        <div className="crate-dots">
          {TRACKS.map((t, i) => (
            <div
              key={t.id}
              className={`crate-dot ${i === idx ? "crate-dot-active" : ""}`}
              style={i === idx ? { background: track.artAccent } : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Loop Panel (back of turntable) ─────────────────────────────────────────

function LoopPanel({ onFlipBack }: { onFlipBack: () => void }) {
  const [loops, setLoops] = useState<UserLoop[]>(getLoops());
  const [rec, setRec] = useState(isRecording());

  useEffect(() => {
    const offLoop = onLoopChange(() => setLoops(getLoops()));
    const offRec = onRecordingChange((r) => setRec(r));
    return () => { offLoop(); offRec(); };
  }, []);

  return (
    <div className="loop-back-panel">
      <div className="loop-back-header">
        <div className="loop-back-title-row">
          <span className="loop-back-led" />
          <span className="loop-back-title">loop station</span>
        </div>
        <button className="loop-back-flip-btn" onClick={onFlipBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" opacity="0.5">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      <div className="loop-back-transport">
        <button
          className={`loop-back-rec-btn ${rec ? "loop-back-rec-btn-active" : ""}`}
          onClick={() => { if (rec) stopRecording(); else startRecording(); }}
        >
          <span className="loop-back-rec-dot" />
          <span>{rec ? "STOP" : "REC"}</span>
        </button>
        {loops.length > 0 && (
          <button className="loop-back-clear-btn" onClick={clearAllLoops}>
            CLEAR
          </button>
        )}
      </div>

      {rec && (
        <div className="loop-back-rec-hint">
          tap pads to record — hit stop when done
        </div>
      )}

      <div className="loop-back-list">
        {loops.length === 0 && !rec && (
          <div className="loop-back-empty">
            no loops yet — hit rec and play some pads
          </div>
        )}
        {loops.map((loop) => (
          <div key={loop.id} className={`loop-back-item ${loop.enabled ? "" : "loop-back-item-muted"}`}>
            <button
              className={`loop-back-toggle ${loop.enabled ? "loop-back-toggle-on" : ""}`}
              onClick={() => toggleLoop(loop.id)}
            />
            <span className="loop-back-name">{loop.name}</span>
            <div className="loop-back-steps">
              {loop.steps.map((s, i) => (
                <div key={i} className={`loop-back-step ${s.length > 0 ? "loop-back-step-hit" : ""}`} />
              ))}
            </div>
            <button className="loop-back-delete" onClick={() => deleteLoop(loop.id)}>✕</button>
          </div>
        ))}
      </div>

      <div className="loop-back-screw loop-back-screw-tl" />
      <div className="loop-back-screw loop-back-screw-tr" />
      <div className="loop-back-screw loop-back-screw-bl" />
      <div className="loop-back-screw loop-back-screw-br" />
    </div>
  );
}

// ─── Turntable ──────────────────────────────────────────────────────────────

function Turntable({
  spinning,
  onToggleSpin,
  vinyl,
  onOpenPicker,
  onOpenTrackPicker,
  trackName,
  artId,
}: {
  spinning: boolean;
  onToggleSpin: () => void;
  vinyl: VinylDesign;
  onOpenPicker: () => void;
  onOpenTrackPicker: () => void;
  trackName: string;
  artId: string;
}) {
  const [rotation, setRotation] = useState(0);
  const [scratching, setScratching] = useState(false);
  const [scratchFlash, setScratchFlash] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [rec, setRec] = useState(isRecording());
  const lastAngleRef = useRef<number | null>(null);
  const scratchThrottleRef = useRef(0);
  const animRef = useRef<number>(0);
  const spinSpeedRef = useRef(0);
  const rotationRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const needleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return onRecordingChange((r) => setRec(r));
  }, []);

  useEffect(() => {
    let prev = performance.now();
    const animate = (now: number) => {
      const dt = (now - prev) / 1000;
      prev = now;
      if (spinning && !scratching) {
        spinSpeedRef.current += (200 - spinSpeedRef.current) * 0.05;
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
        recordScratch();
        if (needleRef.current) {
          const nr = needleRef.current.getBoundingClientRect();
          emitScratchParticles(
            nr.left + nr.width / 2,
            nr.top + nr.height / 2,
            `rgba(${vinyl.glowColor}, 0.9)`
          );
        }
      }
    },
    [scratching, getAngleFromEvent, vinyl.glowColor]
  );

  const handlePointerUp = useCallback(() => {
    setScratching(false);
    lastAngleRef.current = null;
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="deck-flip-perspective">
        <div className={`deck-flip-inner ${flipped ? "deck-flip-inner-flipped" : ""}`}>
          {/* ─── Front: Turntable ─── */}
          <div className="deck-flip-front">
            <div className="deck-base">
              <div className="platter">
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
                    className={`vinyl-record ${scratchFlash ? "vinyl-scratch-flash" : ""}`}
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      boxShadow: spinning
                        ? `0 0 30px rgba(${vinyl.glowColor}, 0.25), 0 0 60px rgba(${vinyl.glowColor}, 0.1)`
                        : "none",
                    }}
                  >
                    <div className="vinyl-grooves" />
                    <div
                      className="vinyl-label"
                      style={{ background: vinyl.labelGradient }}
                    >
                      {artId === "dj" ? (
                        <>
                          <span className="vinyl-label-text">DJ</span>
                          <span className="vinyl-label-sub">SPINNER</span>
                        </>
                      ) : (
                        <VinylArtSVG artId={artId} />
                      )}
                    </div>
                    <div className="vinyl-shine" />
                  </div>
                  {!spinning && !scratching && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                      <span className="text-white/15 text-[10px] font-medium tracking-[0.15em] uppercase">
                        drag to scratch
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div
                className="tonearm-wrapper"
                style={{ transform: spinning ? "rotate(25deg)" : "rotate(0deg)" }}
              >
                <div className="tonearm-pivot" />
                <div className="tonearm-arm" />
                <div className="tonearm-head" ref={needleRef} />
              </div>
              {/* REC button on turntable face */}
              <button
                className={`deck-rec-btn ${rec ? "deck-rec-btn-active" : ""}`}
                onClick={() => setFlipped(true)}
                title="Loop Station"
              >
                <span className={`deck-rec-btn-dot ${rec ? "deck-rec-btn-dot-active" : ""}`} />
                <span className="deck-rec-btn-label">LOOPS</span>
              </button>
            </div>
          </div>

          {/* ─── Back: Loop Station ─── */}
          <div className="deck-flip-back">
            <LoopPanel onFlipBack={() => setFlipped(false)} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSpin}
          className={`play-btn ${spinning ? "play-btn-active" : ""}`}
        >
          {spinning ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="5" y="4" width="5" height="16" rx="1.5" />
              <rect x="14" y="4" width="5" height="16" rx="1.5" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="6,4 20,12 6,20" />
            </svg>
          )}
          <span className="text-[10px] font-bold uppercase tracking-[0.12em]">
            {spinning ? "Stop" : "Play"}
          </span>
        </button>
        <button onClick={onOpenPicker} className="picker-btn" title="Records (Tab)">
          <div
            className="picker-btn-swatch"
            style={{ background: vinyl.labelGradient }}
          />
        </button>
        <button onClick={onOpenTrackPicker} className="picker-btn" title="Tracks (`)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" opacity="0.4">
            <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/>
          </svg>
        </button>
      </div>
      <div className="track-name-indicator">{trackName}</div>
    </div>
  );
}

// ─── Beat Pads ──────────────────────────────────────────────────────────────

const PAD_CONFIG = [
  // Row 1: Main drums
  { label: "KICK", fn: playKick, color: "from-red-500 to-orange-600", key: "Q" },
  { label: "SNARE", fn: playSnare, color: "from-sky-500 to-blue-600", key: "W" },
  { label: "HI-HAT", fn: () => playHiHat(false), color: "from-yellow-400 to-amber-500", key: "E" },
  { label: "CLAP", fn: playClap, color: "from-fuchsia-500 to-pink-600", key: "R" },
  { label: "OPEN HH", fn: () => playHiHat(true), color: "from-amber-400 to-orange-500", key: "T" },
  
  // Row 2: Toms and cymbals
  { label: "TOM HIGH", fn: () => playTom("high"), color: "from-emerald-400 to-green-600", key: "A" },
  { label: "TOM MID", fn: () => playTom("mid"), color: "from-green-400 to-emerald-600", key: "S" },
  { label: "TOM LOW", fn: () => playTom("low"), color: "from-orange-400 to-red-600", key: "D" },
  { label: "CYMBAL", fn: playCymbal, color: "from-indigo-400 to-violet-600", key: "F" },
  { label: "RIDE", fn: () => playRide(false), color: "from-blue-400 to-indigo-600", key: "G" },
  
  // Row 3: Melodic/percussion
  { label: "RIM", fn: playRim, color: "from-rose-400 to-red-600", key: "Z" },
  { label: "STAB", fn: () => playSynthStab(0), color: "from-purple-500 to-fuchsia-600", key: "X" },
  { label: "STAB +", fn: () => playSynthStab(4), color: "from-violet-500 to-purple-700", key: "C" },
  { label: "BASS", fn: playBass, color: "from-teal-500 to-cyan-600", key: "V" },
  { label: "HORN", fn: playHorn, color: "from-pink-400 to-rose-600", key: "B" },
];

function BeatPad({
  label,
  fn,
  color,
  hotkey,
  onKeyPress,
}: {
  label: string;
  fn: () => void;
  color: string;
  hotkey: string;
  onKeyPress?: (key: string) => void;
}) {
  const [active, setActive] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const btnRef = useRef<HTMLButtonElement>(null);

  const trigger = useCallback(() => {
    getAudioContext();
    fn();
    recordHit(fn);
    recordPadHit();
    setActive(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setActive(false), 150);
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      emitPadBurst(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        getComputedStyle(btnRef.current).backgroundColor || "#fff"
      );
    }
  }, [fn]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key.toUpperCase() === hotkey) {
        trigger();
        onKeyPress?.(e.key.toUpperCase());
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [hotkey, trigger, onKeyPress]);

  return (
    <button
      ref={btnRef}
      onPointerDown={(e) => {
        e.preventDefault();
        trigger();
      }}
      className={`beat-pad bg-gradient-to-br ${color} ${
        active ? "beat-pad-active" : ""
      }`}
    >
      <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">
        {label}
      </span>
      <span className="beat-pad-key">{hotkey}</span>
    </button>
  );
}

function BeatPads({ onKeyPress }: { onKeyPress?: (key: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-5 gap-2">
        {PAD_CONFIG.map((pad) => (
          <BeatPad
            key={pad.label}
            label={pad.label}
            fn={pad.fn}
            color={pad.color}
            hotkey={pad.key}
            onKeyPress={onKeyPress}
          />
        ))}
      </div>
    </div>
  );
}

// ─── BPM Slider ─────────────────────────────────────────────────────────────

function BpmSlider() {
  const [bpm, setBpmLocal] = useState(getBpm());

  useEffect(() => {
    const id = setInterval(() => setBpmLocal(getBpm()), 100);
    return () => clearInterval(id);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setBpmLocal(v);
    setBpm(v);
  };

  return (
    <div className="flex flex-col items-center gap-1.5 w-full">
      <div className="flex items-center justify-between w-full">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">
          Tempo
        </span>
        <span className="text-cyan-400/70 font-mono text-sm font-bold tabular-nums">
          {bpm}
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
    </div>
  );
}

// ─── Step Sequencer Display ─────────────────────────────────────────────────

function BeatSteps() {
  const [beatStep, setBeatStepLocal] = useState(-1);
  useEffect(() => {
    return onBeatStep((step) => {
      setBeatStepLocal(step);
      recordBeatStep();
    });
  }, []);

  return (
    <div className="flex gap-[3px] justify-center">
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
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────

export default function DJApp() {
  const [started, setStarted] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("dj-started") === "1";
    }
    return false;
  });
  const [spinning, setSpinning] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("dj-spinning") === "1";
    }
    return false;
  });
  const [save, setSave] = useState<SaveData>(loadSave);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [trackPickerOpen, setTrackPickerOpen] = useState(false);
  const [trackId, setTrackId] = useState(getPatternId);
  const [unlockVinyl, setUnlockVinyl] = useState<VinylDesign | null>(null);
  const cheatSequenceRef = useRef<string[]>([]);

  const vinyl = getSelectedVinyl();

  // Cheat code detector - type "STAGE" on pads to unlock everything
  const checkCheatCode = useCallback((key: string) => {
    cheatSequenceRef.current.push(key);
    if (cheatSequenceRef.current.length > 5) {
      cheatSequenceRef.current.shift();
    }
    const sequence = cheatSequenceRef.current.join("");
    if (sequence === "STAGE") {
      unlockAll();
      setSave(getSave());
      emitUnlockCelebration(window.innerWidth / 2, window.innerHeight / 2);
      cheatSequenceRef.current = [];
    }
  }, []);

  useEffect(() => {
    loadSave();
    setSave(getSave());
    return onSaveChange((s) => setSave(s));
  }, []);

  useEffect(() => {
    return onVinylUnlock((v) => {
      setUnlockVinyl(v);
      emitUnlockCelebration(window.innerWidth / 2, window.innerHeight / 3);
    });
  }, []);

  const handleStart = () => {
    mixpanel.track("Session Started");
    getAudioContext();
    setStarted(true);
    sessionStorage.setItem("dj-started", "1");
  };

  // Re-init audio context if restoring from sessionStorage
  useEffect(() => {
    if (started) getAudioContext();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSpin = useCallback(() => {
    setSpinning((prev) => {
      const next = !prev;
      mixpanel.track("Toggle Spin", { spinning: next });
      if (next) startBeat();
      else stopBeat();
      sessionStorage.setItem("dj-spinning", next ? "1" : "0");
      return next;
    });
  }, []);

  // Auto-start beat if restoring spinning state from session
  useEffect(() => {
    if (started && spinning) startBeat();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!started) return;
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === "Space") {
        e.preventDefault();
        toggleSpin();
      } else if (e.code === "Tab") {
        e.preventDefault();
        setPickerOpen((o) => !o);
      } else if (e.code === "Backquote") {
        e.preventDefault();
        setTrackPickerOpen((o) => !o);
      } else if (!pickerOpen && !trackPickerOpen && e.key === "ArrowLeft") {
        e.preventDefault();
        setBpm(Math.max(60, getBpm() - 2));
      } else if (!pickerOpen && !trackPickerOpen && e.key === "ArrowRight") {
        e.preventDefault();
        setBpm(Math.min(200, getBpm() + 2));
      } else if (!pickerOpen && !trackPickerOpen && /^[0-9]$/.test(e.key)) {
        // Number keys 1-9, 0 = C major scale notes
        e.preventDefault();
        const noteMap: { [key: string]: { semitone: number; name: string } } = {
          "1": { semitone: 0, name: "C" },
          "2": { semitone: 2, name: "D" },
          "3": { semitone: 4, name: "E" },
          "4": { semitone: 5, name: "F" },
          "5": { semitone: 7, name: "G" },
          "6": { semitone: 9, name: "A" },
          "7": { semitone: 11, name: "B" },
          "8": { semitone: 12, name: "C" },
          "9": { semitone: 14, name: "D" },
          "0": { semitone: 16, name: "E" },
        };
        const note = noteMap[e.key];
        if (note) {
          getAudioContext();
          playMelodyNote(note.semitone);
          // Emit note particle from random position around turntable
          const centerX = window.innerWidth * 0.3;
          const centerY = window.innerHeight * 0.5;
          const radius = 80 + Math.random() * 60;
          const a = Math.random() * Math.PI * 2;
          const symbols = ["\u266A", "\u266B", "\u2669"];
          const label = Math.random() > 0.4
            ? note.name
            : symbols[Math.floor(Math.random() * symbols.length)];
          emitFloatingNote(
            centerX + Math.cos(a) * radius,
            centerY + Math.sin(a) * radius,
            label
          );
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [started, toggleSpin, pickerOpen, trackPickerOpen]);

  if (!started) {
    const commitHash = process.env.NEXT_PUBLIC_GIT_HASH || "dev";
    const commitFull = process.env.NEXT_PUBLIC_GIT_HASH_FULL || "";
    const commitUrl = commitFull
      ? `https://github.com/obscurebit/dj/commit/${commitFull}`
      : "https://github.com/obscurebit/dj";

    return (
      <div className="splash-screen">
        <div className="splash-bg" />
        <div className="splash-content">
          <div className="splash-vinyl">
            <div className="splash-vinyl-groove" />
            <div className="splash-vinyl-groove splash-vinyl-groove-2" />
            <div className="splash-vinyl-label">
              <VinylArtSVG artId="eye" />
            </div>
          </div>
          <p className="splash-sub">scratch · tap · groove</p>
          <button onClick={handleStart} className="splash-btn">
            start session
          </button>
        </div>
        <div className="splash-footer">
          <a
            href={commitUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="splash-commit"
          >
            {commitHash}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="app-bg" />
      <ParticleCanvas />
      <UnlockNotice
        vinyl={unlockVinyl}
        onDone={() => setUnlockVinyl(null)}
      />
      <VinylPicker
        save={save}
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
      />
      <TrackPicker
        open={trackPickerOpen}
        currentTrackId={trackId}
        save={save}
        onClose={() => {
          setTrackPickerOpen(false);
          setTrackId(getPatternId());
        }}
      />

      <div className="app-content">
        <div className="main-layout">
          <Turntable
            spinning={spinning}
            onToggleSpin={toggleSpin}
            vinyl={vinyl}
            onOpenPicker={() => setPickerOpen(true)}
            onOpenTrackPicker={() => setTrackPickerOpen(true)}
            trackName={TRACKS.find((t) => t.id === trackId)?.name || "Blank Canvas"}
            artId={save.selectedArtId || "dj"}
          />
          <div className="right-panel">
            <BeatSteps />
            <BpmSlider />
            <BeatPads onKeyPress={checkCheatCode} />
          </div>
        </div>
      </div>
    </div>
  );
}
