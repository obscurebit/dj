interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: "spark" | "ring" | "dot";
}

let particles: Particle[] = [];
let canvas: HTMLCanvasElement | null = null;
let ctx2d: CanvasRenderingContext2D | null = null;
let animId = 0;
let running = false;

export function initParticles(el: HTMLCanvasElement) {
  canvas = el;
  ctx2d = el.getContext("2d");
  resize();
  if (!running) {
    running = true;
    animId = requestAnimationFrame(loop);
  }
}

export function destroyParticles() {
  running = false;
  cancelAnimationFrame(animId);
  particles = [];
}

function resize() {
  if (!canvas) return;
  canvas.width = canvas.offsetWidth * window.devicePixelRatio;
  canvas.height = canvas.offsetHeight * window.devicePixelRatio;
}

export function emitScratchParticles(cx: number, cy: number, color: string) {
  for (let i = 0; i < 6; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 1,
      size: 2 + Math.random() * 3,
      color,
      type: "spark",
    });
  }
}

export function emitPadBurst(cx: number, cy: number, color: string) {
  for (let i = 0; i < 3; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 2;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.7,
      maxLife: 0.7,
      size: 2 + Math.random() * 2,
      color,
      type: "dot",
    });
  }
}

export function emitUnlockCelebration(cx: number, cy: number) {
  const colors = ["#a855f7", "#ec4899", "#22d3ee", "#f59e0b", "#22c55e"];
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 6;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 1,
      maxLife: 1,
      size: 3 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      type: Math.random() > 0.5 ? "spark" : "dot",
    });
  }
}

function loop() {
  if (!running) return;
  if (!canvas || !ctx2d) {
    animId = requestAnimationFrame(loop);
    return;
  }

  const dpr = window.devicePixelRatio;
  if (
    canvas.width !== canvas.offsetWidth * dpr ||
    canvas.height !== canvas.offsetHeight * dpr
  ) {
    resize();
  }

  ctx2d.clearRect(0, 0, canvas.width, canvas.height);
  ctx2d.save();
  ctx2d.scale(dpr, dpr);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.96;
    p.vy *= 0.96;
    p.life -= 0.025;

    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }

    const alpha = p.life / p.maxLife;

    if (p.type === "ring") {
      const radius = p.size + (1 - alpha) * 30;
      ctx2d.beginPath();
      ctx2d.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx2d.strokeStyle = p.color + hexAlpha(alpha * 0.5);
      ctx2d.lineWidth = 2;
      ctx2d.stroke();
    } else if (p.type === "spark") {
      const len = p.size * 2;
      const angle = Math.atan2(p.vy, p.vx);
      ctx2d.beginPath();
      ctx2d.moveTo(
        p.x - Math.cos(angle) * len * 0.5,
        p.y - Math.sin(angle) * len * 0.5
      );
      ctx2d.lineTo(
        p.x + Math.cos(angle) * len * 0.5,
        p.y + Math.sin(angle) * len * 0.5
      );
      ctx2d.strokeStyle = p.color + hexAlpha(alpha);
      ctx2d.lineWidth = p.size * alpha;
      ctx2d.lineCap = "round";
      ctx2d.stroke();
    } else {
      ctx2d.beginPath();
      ctx2d.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx2d.fillStyle = p.color + hexAlpha(alpha);
      ctx2d.fill();
    }
  }

  ctx2d.restore();
  animId = requestAnimationFrame(loop);
}

function hexAlpha(a: number): string {
  const v = Math.round(Math.max(0, Math.min(1, a)) * 255);
  return v.toString(16).padStart(2, "0");
}
