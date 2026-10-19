// Voce sintetica allegra e simpatica usando la Web Speech API (browser-native).
// Sceglie la voce italiana se disponibile e usa pitch/rate "gioiosi".

let cachedVoices: SpeechSynthesisVoice[] = [];

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  cachedVoices = window.speechSynthesis.getVoices();
  return cachedVoices;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = loadVoices();
  };
}

function pickItalianVoice(): SpeechSynthesisVoice | null {
  const voices = cachedVoices.length ? cachedVoices : loadVoices();
  if (!voices.length) return null;
  // preferenza: voce italiana
  const it = voices.find((v) => /it[-_]IT/i.test(v.lang) || /italian/i.test(v.name));
  if (it) return it;
  // fallback: qualsiasi voce italiana
  const anyIt = voices.find((v) => /^it/i.test(v.lang));
  return anyIt ?? null;
}

export function isVoiceSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Annuncia un testo ad alta voce, allegra. */
export function speak(text: string, opts?: { interrupt?: boolean }): void {
  if (!isVoiceSupported()) return;
  try {
    const synth = window.speechSynthesis;
    if (opts?.interrupt) synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = pickItalianVoice();
    if (v) u.voice = v;
    u.lang = "it-IT";
    u.rate = 1.12; // leggermente veloce = allegra
    u.pitch = 1.25; // tonalità più alta = simpatica
    u.volume = 1;
    synth.speak(u);
  } catch {
    /* noop */
  }
}

export function stopSpeaking(): void {
  if (isVoiceSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* noop */
    }
  }
}
