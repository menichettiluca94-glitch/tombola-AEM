import { GAME_COLORS, getDistribution, SYMBOL_RATE } from "./constants";
import type { Card, GameColor, WinEvent, WinLevel } from "./types";

// Deterministic-ish id generator (crypto when available).
function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Crea il mazzo di carte per la partita.
 * - I numeri sono assegnati in ordine progressivo (1..total).
 * - I colori vengono distribuiti in modo bilanciato e MESCOLATO tra le posizioni,
 *   così il colore nascosto di una card non segue un pattern prevedibile.
 * - Una percentuale di carte riceve un simbolo bonus nascosto.
 */
export function createDeck(playerCount: number): Card[] {
  const { cardsPerColor, total } = getDistribution(playerCount);
  const colors = GAME_COLORS.slice(0, playerCount);

  // Costruisce la lista "colori espansa": per ogni colore, cardsPerColor entry.
  const colorPool: GameColor[] = [];
  for (const c of colors) {
    for (let i = 0; i < cardsPerColor; i++) colorPool.push(c);
  }
  // shuffle (Fisher-Yates)
  for (let i = colorPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [colorPool[i], colorPool[j]] = [colorPool[j], colorPool[i]];
  }

  // Decide quali posizioni avranno un simbolo.
  const symbolSlots = new Set<number>();
  const target = Math.max(2, Math.round(total * SYMBOL_RATE));
  while (symbolSlots.size < target) {
    symbolSlots.add(Math.floor(Math.random() * total));
  }

  const cards: Card[] = [];
  for (let i = 0; i < total; i++) {
    const number = i + 1;
    const color = colorPool[i];
    let symbol: Card["symbol"] = null;
    if (symbolSlots.has(i)) {
      // 50/50 tra cambioGiro e copri2
      symbol = Math.random() < 0.5 ? "cambioGiro" : "copri2";
    }
    cards.push({
      id: uid(),
      number,
      color,
      symbol,
      revealed: false,
      covered: false,
      flippedAt: null,
    });
  }
  return cards;
}

export function getCardByNumber(cards: Card[], number: number): Card | undefined {
  return cards.find((c) => c.number === number);
}

export function getCardById(cards: Card[], id: string): Card | undefined {
  return cards.find((c) => c.id === id);
}

/** Conta quante card di un dato colore sono state scoperte (non coperte dal bonus). */
export function countRevealedForColor(cards: Card[], color: GameColor): number {
  return cards.filter((c) => c.color.key === color.key && c.revealed && !c.covered)
    .length;
}

/** Totale card di un colore nel mazzo. */
export function totalForColor(cards: Card[], color: GameColor): number {
  return cards.filter((c) => c.color.key === color.key).length;
}

/**
 * Dato il nuovo stato delle carte, restituisce eventuali nuove vincite
 * per il colore appena scoperto. Confronta con i livelli già raggiunti.
 *
 * Regole:
 * - ambo = 2
 * - terna = 3
 * - quaterna = 4
 * - cinquina = 5
 * - tombola = tutte le card del colore scoperte
 */
export function detectWin(
  cards: Card[],
  color: GameColor,
  alreadyWonLevels: WinLevel[],
): WinEvent | null {
  const revealed = countRevealedForColor(cards, color);
  const total = totalForColor(cards, color);

  // Tombola: tutte scoperte.
  if (revealed === total && revealed >= 2) {
    if (!alreadyWonLevels.includes("tombola")) {
      return makeWin("tombola", color);
    }
    return null;
  }

  // Livelli intermedi in ordine crescente.
  const thresholds: { level: WinLevel; count: number }[] = [
    { level: "ambo", count: 2 },
    { level: "terna", count: 3 },
    { level: "quaterna", count: 4 },
    { level: "cinquina", count: 5 },
  ];
  for (const t of thresholds) {
    if (revealed === t.count && !alreadyWonLevels.includes(t.level)) {
      return makeWin(t.level, color);
    }
  }
  return null;
}

function makeWin(level: WinLevel, color: GameColor): WinEvent {
  return {
    id: uid(),
    level,
    color,
    timestamp: Date.now(),
  };
}

/** Livelli già vinti per un dato colore (per evitare doppi annunci). */
export function wonLevelsForColor(
  wins: WinEvent[],
  color: GameColor,
): WinLevel[] {
  return wins.filter((w) => w.color.key === color.key).map((w) => w.level);
}

/** Genera un numero casuale tra le card ancora coperte (per il bonus "random"). */
export function pickRandomAvailableNumber(cards: Card[]): number | null {
  const available = cards.filter((c) => !c.revealed && !c.covered);
  if (available.length === 0) return null;
  const pick = available[Math.floor(Math.random() * available.length)];
  return pick.number;
}

/**
 * Trova una card coperta (non rivelata) del colore desiderato,
 * da usare come bersaglio per il bonus "cambia colore".
 */
export function findCoveredCardOfColor(
  cards: Card[],
  color: GameColor,
): Card | undefined {
  return cards.find((c) => !c.revealed && c.color.key === color.key);
}

/** Mescola un array in place (utility). */
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
