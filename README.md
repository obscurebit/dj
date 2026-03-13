# DJ Spinner

An interactive cartoon turntable toy. Scratch the vinyl, smash the beat pads, drop some beats — no music degree required.

## Features

- **Spinning vinyl turntable** — click Play to start the beat, drag the record to scratch
- **12 sample pads** — drums, percussion, synth stabs with keyboard shortcuts
- **BPM control** — adjust tempo from 60–200 BPM
- **Step sequencer display** — visual beat indicator
- **100% procedural audio** — all sounds generated via the Web Audio API, zero licensed audio

## Controls

| Action | Input |
|--------|-------|
| Play / Stop | Click button or press **Space** |
| Scratch | Click & drag the vinyl record |
| Drum pads | Click pads or press **Q W E R / A S D F / Z X C V** |
| Tempo | Drag the BPM slider |

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
