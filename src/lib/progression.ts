import VINYL_DESIGNS, { type VinylDesign } from "./vinylDesigns";

const STORAGE_KEY = "dj-spinner-save";

export interface SaveData {
  xp: number;
  totalScratchs: number;
  totalPadHits: number;
  totalBeatsPlayed: number;
  unlockedVinylIds: string[];
  selectedVinylId: string;
}

const DEFAULT_SAVE: SaveData = {
  xp: 0,
  totalScratchs: 0,
  totalPadHits: 0,
  totalBeatsPlayed: 0,
  unlockedVinylIds: ["classic", "fire", "ocean", "toxic"],
  selectedVinylId: "classic",
};

let save: SaveData = { ...DEFAULT_SAVE };
let listeners: Array<(s: SaveData) => void> = [];
let unlockListeners: Array<(v: VinylDesign) => void> = [];

export function loadSave(): SaveData {
  if (typeof window === "undefined") return save;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      save = { ...DEFAULT_SAVE, ...parsed };
    }
  } catch {
    save = { ...DEFAULT_SAVE };
  }
  return save;
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch { /* quota exceeded, ignore */ }
}

function notify() {
  listeners.forEach((l) => l({ ...save }));
}

export function onSaveChange(cb: (s: SaveData) => void) {
  listeners.push(cb);
  return () => { listeners = listeners.filter((l) => l !== cb); };
}

export function onVinylUnlock(cb: (v: VinylDesign) => void) {
  unlockListeners.push(cb);
  return () => { unlockListeners = unlockListeners.filter((l) => l !== cb); };
}

function checkUnlocks() {
  for (const design of VINYL_DESIGNS) {
    if (
      !save.unlockedVinylIds.includes(design.id) &&
      save.xp >= design.unlockScore
    ) {
      save.unlockedVinylIds.push(design.id);
      unlockListeners.forEach((cb) => cb(design));
    }
  }
}

export function addXP(amount: number) {
  save.xp += amount;
  checkUnlocks();
  persist();
  notify();
}

export function recordScratch() {
  save.totalScratchs++;
  addXP(1);
}

export function recordPadHit() {
  save.totalPadHits++;
  addXP(2);
}

export function recordBeatStep() {
  save.totalBeatsPlayed++;
  if (save.totalBeatsPlayed % 16 === 0) {
    addXP(1);
  } else {
    persist();
    notify();
  }
}

export function selectVinyl(id: string) {
  if (save.unlockedVinylIds.includes(id)) {
    save.selectedVinylId = id;
    persist();
    notify();
  }
}

export function getSave(): SaveData {
  return { ...save };
}

export function getSelectedVinyl(): VinylDesign {
  return VINYL_DESIGNS.find((v) => v.id === save.selectedVinylId) || VINYL_DESIGNS[0];
}

export function getNextUnlock(): VinylDesign | null {
  const locked = VINYL_DESIGNS
    .filter((v) => !save.unlockedVinylIds.includes(v.id))
    .sort((a, b) => a.unlockScore - b.unlockScore);
  return locked[0] || null;
}
