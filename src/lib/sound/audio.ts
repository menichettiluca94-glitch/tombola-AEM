// Audio engine per Tombola Colorata.
// Usa la Web Audio API per sintetizzare suoni in stile arcade/chiptune senza file esterni.
// Tutto client-side, niente dipendenze.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  //_resume se sospeso (autoplay policy)
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  return ctx;
}

/** Deve essere chiamato da un gesto utente per sbloccare l'audio. */
export function unlockAudio(): void {
  const c = getCtx();
  if (c && c.state === "suspended") {
    void c.resume();
  }
}

interface ToneOptions {
  freq: number;
  duration: number; // secondi
  type?: OscillatorType;
  volume?: number; // 0..1
  startTimeOffset?: number; // secondi da ora
  sweepTo?: number; // glissando verso questa freq
}

function playTone(opts: ToneOptions): void {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime + (opts.startTimeOffset ?? 0);
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = opts.type ?? "square";
  osc.frequency.setValueAtTime(opts.freq, now);
  if (opts.sweepTo) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(1, opts.sweepTo),
      now + opts.duration,
    );
  }
  const vol = opts.volume ?? 0.18;
  // envelope per evitare click
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(vol, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + opts.duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(now);
  osc.stop(now + opts.duration + 0.02);
}

/** Tic veloce per lo scorrimento sulle caselle. */
export function playSpinTick(): void {
  playTone({ freq: 660, duration: 0.05, type: "square", volume: 0.08 });
}

/** Suono quando la card atterra sul bersaglio (prima del flip). */
export function playLand(): void {
  playTone({ freq: 220, duration: 0.12, type: "triangle", volume: 0.2 });
  playTone({
    freq: 440,
    duration: 0.12,
    type: "square",
    volume: 0.1,
    startTimeOffset: 0.03,
  });
}

/** Flip epico: sweep ascendente + chord. */
export function playFlip(): void {
  playTone({
    freq: 300,
    duration: 0.18,
    type: "sawtooth",
    volume: 0.16,
    sweepTo: 900,
  });
  playTone({
    freq: 600,
    duration: 0.22,
    type: "square",
    volume: 0.12,
    startTimeOffset: 0.06,
  });
  playTone({
    freq: 900,
    duration: 0.25,
    type: "triangle",
    volume: 0.1,
    startTimeOffset: 0.12,
  });
}

/** Errore / numero già uscito: buzzer discendente. */
export function playError(): void {
  playTone({
    freq: 320,
    duration: 0.22,
    type: "sawtooth",
    volume: 0.18,
    sweepTo: 140,
  });
  playTone({
    freq: 160,
    duration: 0.18,
    type: "square",
    volume: 0.12,
    startTimeOffset: 0.18,
    sweepTo: 90,
  });
}

/** Simbolo bonus trovato: arpeggio luminoso. */
export function playSymbol(): void {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((f, i) =>
    playTone({
      freq: f,
      duration: 0.16,
      type: "square",
      volume: 0.14,
      startTimeOffset: i * 0.07,
    }),
  );
}

/** Ambo / terna / etc: fanfara crescente. */
export function playWin(level: "ambo" | "terna" | "quaterna" | "cinquina" | "tombola"): void {
  // più alto il livello, più note
  const counts: Record<typeof level, number> = {
    ambo: 3,
    terna: 4,
    quaterna: 5,
    cinquina: 6,
    tombola: 8,
  };
  const n = counts[level];
  const base = 440;
  for (let i = 0; i < n; i++) {
    const freq = base * Math.pow(1.122, i * 1.5); // salita esponenziale
    playTone({
      freq,
      duration: 0.22,
      type: "square",
      volume: 0.16,
      startTimeOffset: i * 0.1,
    });
  }
  // accordo finale
  if (level === "tombola") {
    [523.25, 659.25, 783.99, 1046.5].forEach((f) =>
      playTone({
        freq: f,
        duration: 0.9,
        type: "triangle",
        volume: 0.14,
        startTimeOffset: n * 0.1 + 0.05,
      }),
    );
  }
}

/** Click generico UI. */
export function playClick(): void {
  playTone({ freq: 880, duration: 0.04, type: "square", volume: 0.07 });
}

// --- Musica di sottofondo chiptune (loop) ---
// Una piccola sequenza arpeggiata in C maggiore, allegra e non invadente.

let musicTimer: ReturnType<typeof setInterval> | null = null;
let musicStep = 0;
let musicGain: GainNode | null = null;

const MUSIC_SEQUENCE: { freq: number; dur: number; type: OscillatorType }[] = [
  { freq: 261.63, dur: 0.16, type: "square" }, // C4
  { freq: 329.63, dur: 0.16, type: "square" }, // E4
  { freq: 392.0, dur: 0.16, type: "square" }, // G4
  { freq: 523.25, dur: 0.16, type: "square" }, // C5
  { freq: 392.0, dur: 0.16, type: "square" }, // G4
  { freq: 329.63, dur: 0.16, type: "square" }, // E4
  { freq: 440.0, dur: 0.16, type: "triangle" }, // A4
  { freq: 523.25, dur: 0.16, type: "triangle" }, // C5
];

export function startMusic(): void {
  const c = getCtx();
  if (!c) return;
  if (musicTimer) return; // già attiva
  if (!musicGain) {
    musicGain = c.createGain();
    musicGain.gain.value = 0.05;
    musicGain.connect(c.destination);
  }
  musicStep = 0;
  const stepMs = 200; // ~120 bpm con semicrome
  musicTimer = setInterval(() => {
    const note = MUSIC_SEQUENCE[musicStep % MUSIC_SEQUENCE.length];
    const now = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = note.type;
    osc.frequency.value = note.freq;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + note.dur);
    osc.connect(g);
    g.connect(musicGain!);
    osc.start(now);
    osc.stop(now + note.dur + 0.02);
    musicStep++;
  }, stepMs);
}

export function stopMusic(): void {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
  if (musicGain && ctx) {
    // fade out rapido
    try {
      musicGain.gain.exponentialRampToValueAtTime(
        0.0001,
        ctx.currentTime + 0.1,
      );
    } catch {
      /* noop */
    }
  }
}

export function isMusicPlaying(): boolean {
  return musicTimer !== null;
}
