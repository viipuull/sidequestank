import { useCallback, useSyncExternalStore } from "react";

/**
 * Adventure Mode audio. Sounds are synthesised with the Web Audio API so no
 * assets ship, and everything is gated behind a single persisted toggle.
 */
const STORAGE_KEY = "sq.adventure.sound";

let enabled = true;
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw != null) enabled = raw === "1";
  } catch {
    // storage blocked — keep the default
  }
}

function emit() {
  listeners.forEach((l) => l());
}

export function isSoundEnabled() {
  return enabled;
}

export function setSoundEnabled(next: boolean) {
  enabled = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  } catch {
    // ignore
  }
  if (!next) stopAll();
  emit();
}

function subscribe(listener: () => void) {
  hydrate();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ---- audio graph -----------------------------------------------------------

type Ctx = AudioContext & { sqMaster?: GainNode };
let ctx: Ctx | null = null;
const active = new Set<AudioScheduledSourceNode>();

function audio(): Ctx | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) {
    ctx = new Ctor() as Ctx;
    const master = ctx.createGain();
    master.gain.value = 0.25;
    master.connect(ctx.destination);
    ctx.sqMaster = master;
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function stopAll() {
  active.forEach((n) => {
    try {
      n.stop();
    } catch {
      // already stopped
    }
  });
  active.clear();
}

type Tone = {
  freq: number;
  /** Seconds from now. */
  at?: number;
  duration?: number;
  type?: OscillatorType;
  gain?: number;
  /** Optional glide target frequency. */
  to?: number;
};

function play(tones: Tone[]) {
  hydrate();
  if (!enabled) return;
  const c = audio();
  if (!c?.sqMaster) return;
  const now = c.currentTime;

  for (const t of tones) {
    const start = now + (t.at ?? 0);
    const dur = t.duration ?? 0.16;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = t.type ?? "sine";
    osc.frequency.setValueAtTime(t.freq, start);
    if (t.to) osc.frequency.exponentialRampToValueAtTime(Math.max(1, t.to), start + dur);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(t.gain ?? 0.4, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain).connect(c.sqMaster);
    osc.start(start);
    osc.stop(start + dur + 0.02);
    active.add(osc);
    osc.onended = () => active.delete(osc);
  }
}

/** Soft navigation pulse, fired as the player closes in on a checkpoint. */
export function playNavPulse(intensity = 0) {
  const base = 560 + Math.round(Math.min(1, Math.max(0, intensity)) * 240);
  play([{ freq: base, duration: 0.1, gain: 0.16, type: "triangle" }]);
}

/** Checkpoint arrival chime. */
export function playArrival() {
  play([
    { freq: 660, duration: 0.16, gain: 0.34, type: "sine" },
    { freq: 880, at: 0.1, duration: 0.2, gain: 0.34, type: "sine" },
    { freq: 1320, at: 0.22, duration: 0.3, gain: 0.26, type: "triangle" },
  ]);
}

/** Camera pan onto a freshly revealed checkpoint. */
export function playCheckpointReveal() {
  play([{ freq: 420, to: 720, duration: 0.34, gain: 0.2, type: "sine" }]);
}

/** Feedback for the toggle itself, so turning sound on is audible. */
export function playToggleBlip() {
  play([{ freq: 720, duration: 0.09, gain: 0.24, type: "square" }]);
}

/** React binding for the shared toggle. */
export function useAdventureSound() {
  const on = useSyncExternalStore(
    subscribe,
    () => {
      hydrate();
      return enabled;
    },
    () => true,
  );

  const toggle = useCallback(() => {
    const next = !isSoundEnabled();
    setSoundEnabled(next);
    if (next) playToggleBlip();
  }, []);

  return { soundOn: on, toggleSound: toggle, setSoundEnabled };
}