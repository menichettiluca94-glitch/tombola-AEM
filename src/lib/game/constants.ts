import type { GameColor, Theme, ThemeId, WinLevel } from "./types";

// Colori in ORDINE FISSO come richiesto dall'utente.
// L'ordine qui è quello usato per assegnare i colori ai giocatori in base al numero.
export const GAME_COLORS: GameColor[] = [
  { key: "rosso", name: "Rosso", hex: "#E53935", textOnColor: "#ffffff" },
  { key: "blu", name: "Blu", hex: "#1E88E5", textOnColor: "#ffffff" },
  { key: "giallo", name: "Giallo", hex: "#FDD835", textOnColor: "#1a1a1a" },
  { key: "verde", name: "Verde", hex: "#43A047", textOnColor: "#ffffff" },
  { key: "azzurro", name: "Azzurro", hex: "#4FC3F7", textOnColor: "#0b1a2a" },
  { key: "arancione", name: "Arancione", hex: "#FB8C00", textOnColor: "#1a1a1a" },
  { key: "grafite", name: "Grigio", hex: "#424242", textOnColor: "#ffffff" },
  { key: "viola", name: "Viola", hex: "#8E24AA", textOnColor: "#ffffff" },
  { key: "magenta", name: "Magenta", hex: "#D81B60", textOnColor: "#ffffff" },
  { key: "verdeAcqua", name: "Verde", hex: "#26A69A", textOnColor: "#06231f" },
];

export function getColorsForPlayers(count: number): GameColor[] {
  return GAME_COLORS.slice(0, Math.max(2, Math.min(10, count)));
}

// Mappa di distribuzione: per ogni numero di giocatori, quante card per colore e totale.
export const DISTRIBUTION: Record<
  number,
  { cardsPerColor: number; total: number }
> = {
  2: { cardsPerColor: 20, total: 40 },
  3: { cardsPerColor: 20, total: 60 },
  4: { cardsPerColor: 20, total: 80 },
  5: { cardsPerColor: 14, total: 70 },
  6: { cardsPerColor: 10, total: 60 },
  7: { cardsPerColor: 10, total: 70 },
  8: { cardsPerColor: 10, total: 80 },
  9: { cardsPerColor: 10, total: 90 },
  10: { cardsPerColor: 8, total: 80 },
};

export function getDistribution(playerCount: number) {
  const d = DISTRIBUTION[playerCount];
  if (!d) {
    throw new Error(`Numero giocatori non supportato: ${playerCount}`);
  }
  return d;
}

// Configurazione simboli bonus nascosti.
// ~12% delle card porta un simbolo, distribuito tra "cambioGiro" e "copri2".
export const SYMBOL_RATE = 0.12;

// Temi disponibili. Iniziamo con "arcadeScuro" e lasciamo la struttura pronta per aggiungerne altri.
export const THEMES: Record<ThemeId, Theme> = {
  arcadeScuro: {
    id: "arcadeScuro",
    name: "Arcade Scuro",
    description: "Hot pink, lime e oro su nero. Vibe anni '80.",
    isDark: true,
    accent: "#ff2d95", // hot pink (slot --arcade-pink)
    accent2: "#39ff14", // neon lime (slot --arcade-lime)
    accent3: "#ffd60a", // giallo arcade (slot --arcade-gold)
    displayFont: "var(--font-press-start)",
    bodyFont: "var(--font-vt323)",
    bgGradient:
      "radial-gradient(circle at 20% 10%, rgba(255,45,149,0.15), transparent 40%), radial-gradient(circle at 80% 90%, rgba(57,255,20,0.10), transparent 45%), linear-gradient(180deg, #0a0a12 0%, #06060c 100%)",
  },
  raveNeon: {
    id: "raveNeon",
    name: "Rave Neon",
    description: "Viola elettrico, ciano e magenta su nero profondo.",
    isDark: true,
    accent: "#b026ff", // viola elettrico (slot --arcade-pink)
    accent2: "#00f0ff", // ciano (slot --arcade-lime)
    accent3: "#ff2d95", // magenta (slot --arcade-gold)
    displayFont: "var(--font-press-start)",
    bodyFont: "var(--font-vt323)",
    bgGradient:
      "radial-gradient(circle at 20% 10%, rgba(176,38,255,0.18), transparent 40%), radial-gradient(circle at 80% 90%, rgba(0,240,255,0.12), transparent 45%), linear-gradient(180deg, #0c0612 0%, #060309 100%)",
  },
};

export const THEME_LIST: Theme[] = Object.values(THEMES);

// Mappatura theme -> variabili CSS arcade.
// Lightning CSS (Tailwind 4) tende a strippare i selettori `:root[data-theme=...]`
// durante la compilazione, quindi applichiamo le variabili via JS su <html>
// (style.setProperty), che è immune al minifier. I valori qui devono restare
// allineati con il blocco `:root` di default in globals.css.
export const THEME_CSS_VARS: Record<ThemeId, Record<string, string>> = {
  arcadeScuro: {
    "--arcade-pink": "#ff2d95",
    "--arcade-lime": "#39ff14",
    "--arcade-gold": "#ffd60a",
    "--arcade-cyan": "#00f0ff",
    "--arcade-bg": "#0a0a12",
    "--arcade-panel": "#14141f",
  },
  raveNeon: {
    "--arcade-pink": "#b026ff",
    "--arcade-lime": "#00f0ff",
    "--arcade-gold": "#ff2d95",
    "--arcade-cyan": "#39ff14",
    "--arcade-bg": "#0c0612",
    "--arcade-panel": "#170a22",
  },
};

/** Applica le variabili CSS del tema su <html> (runtime, immune a minifier). */
export function applyThemeVars(themeId: ThemeId): void {
  if (typeof document === "undefined") return;
  const vars = THEME_CSS_VARS[themeId] ?? THEME_CSS_VARS.arcadeScuro;
  const root = document.documentElement;
  for (const [k, v] of Object.entries(vars)) {
    root.style.setProperty(k, v);
  }
}

// Etichette leggibili per i livelli di vincita.
export const WIN_LABELS: Record<WinLevel, string> = {
  ambo: "Ambo",
  terna: "Terna",
  quaterna: "Quaterna",
  cinquina: "Cinquina",
  tombola: "TOMBOLA!",
};

// Soglie di vincita: numero di card scoperte dello stesso colore necessarie.
export const WIN_THRESHOLDS: { level: WinLevel; count: number }[] = [
  { level: "ambo", count: 2 },
  { level: "terna", count: 3 },
  { level: "quaterna", count: 4 },
  { level: "cinquina", count: 5 },
];

// Configurazione griglia: numero di colonne consigliato in base al totale card.
// L'obiettivo è mantenere proporzioni equilibrate in fullscreen.
export function getGridColumns(total: number): number {
  // Griglie più larghe per far stare tutte le card a schermo (80 card su 16 colonne = 5 righe).
  if (total <= 40) return 10; // 10x4
  if (total <= 60) return 12; // 12x5
  if (total <= 70) return 14; // 14x5
  if (total <= 80) return 16; // 16x5
  return 15; // 90 -> 15x6
}
