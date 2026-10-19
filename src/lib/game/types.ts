// Tipi centrali del gioco Tombola Colorata

export type ColorKey =
  | "rosso"
  | "blu"
  | "giallo"
  | "verde"
  | "azzurro"
  | "grafite"
  | "viola"
  | "magenta"
  | "verdeAcqua";

export interface GameColor {
  key: ColorKey;
  name: string; // nome classico (Rosso, Blu, ...)
  hex: string; // colore puro
  textOnColor: string; // colore testo leggibile sopra il colore
}

export type SymbolKind = "cambioGiro" | "copri2" | null;

export interface Card {
  id: string; // id univoco
  number: number; // numero visibile (1..N)
  color: GameColor; // colore nascosto
  symbol: SymbolKind; // eventuale simbolo bonus nascosto
  revealed: boolean; // scoperta?
  covered: boolean; // coperta dal bonus "copri 2"?
  flippedAt: number | null; // timestamp reveal (per animazioni)
}

export type ThemeId = "arcadeScuro" | "raveNeon"; // temi disponibili

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  isDark: boolean;
  // accenti neon
  accent: string;
  accent2: string;
  accent3: string;
  // font
  displayFont: string; // google font family per titoli
  bodyFont: string; // google font family per testo
  // sfondo
  bgGradient: string; // CSS gradient
}

export type WinLevel = "ambo" | "terna" | "quaterna" | "cinquina" | "tombola";

export interface WinEvent {
  id: string;
  level: WinLevel;
  color: GameColor;
  playerName?: string;
  timestamp: number;
}

export type GamePhase = "setup" | "playing" | "finished";

export interface PlayerSetup {
  color: GameColor;
  name?: string; // opzionale
}

export interface GameConfig {
  themeId: ThemeId;
  playerCount: number;
  useNames: boolean;
  players: PlayerSetup[];
  cardsPerColor: number;
  totalCards: number;
}

export interface GameSoundState {
  sfxEnabled: boolean;
  musicEnabled: boolean;
  voiceEnabled: boolean;
}

export interface GameState {
  phase: GamePhase;
  config: GameConfig | null;
  cards: Card[];
  calledNumbers: number[]; // numeri già detti (in ordine)
  wins: WinEvent[];
  lastWin: WinEvent | null;
  error: string | null; // messaggio di presa in giro
  // bonus di sessione
  copri2Available: number; // quante volte si può usare copri 2
  cambioGiroAvailable: number; // carte cambio giro accumulate
  // flag animazione
  isSpinning: boolean;
  spinTargetId: string | null;
  // controls
  sound: GameSoundState;
}
