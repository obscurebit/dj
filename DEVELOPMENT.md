# Development Guide

## Features

- **Spinning vinyl turntable** — click Play to start the beat, drag the record to scratch
- **15 sample pads** — drums, percussion, synth stabs, bass, and horn with keyboard shortcuts
- **BPM control** — adjust tempo from 60–200 BPM with slider or arrow keys
- **Step sequencer display** — visual beat indicator
- **Loop recorder station** — flip the turntable to access the loop station, record pad hits into 16-step loops, layer multiple patterns, toggle loops on/off
- **Vinyl collection** — unlock and switch between 8 themed vinyl skins
- **Genre presets** — 9 procedural backing tracks including Metronome (Lo-fi Hip Hop, Jazz, Boom Bap, House, Ambient, Funk, Trip Hop)
- **Crate-digging UI** — flip-through record and track pickers with indie art aesthetic
- **100% procedural audio** — all sounds generated via the Web Audio API, zero licensed audio
- **Persistent progression** — saves unlocks and preferences locally

## Controls

| Action | Input |
|--------|-------|
| Play / Stop | Click button or press **Space** |
| Scratch | Click & drag the vinyl record |
| Drum pads | Click pads or press **Q W E R T / A S D F G / Z X C V B** |
| Tempo | Drag slider or press **← →** |
| Loop station | Click **LOOPS** button on turntable to flip it |
| Record loop | On the back panel, click **REC** to start/stop recording pad hits |
| Toggle loop | Click the green dot next to each loop to mute/unmute |
| Vinyl picker | Click swatch or press **Tab** |
| Track picker | Click music note or press **` (backtick)** |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- Next.js + React + TypeScript
- Tailwind CSS
- Web Audio API (all sounds procedurally generated)
- GitHub Pages for static hosting

## Deployment

This app is configured for GitHub Pages deployment at `dj.obscurebit.com`:

1. Push to the `main` branch
2. GitHub Actions will automatically build and deploy
3. Visit `https://[username].github.io/dj/` or your custom domain

The static build outputs to `/out` and uses the `/dj` base path.
