"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Card,
  GameColor,
  GameConfig,
  GameState,
  ThemeId,
  WinEvent,
} from "@/lib/game/types";
import {
  GAME_COLORS,
  THEMES,
  getDistribution,
} from "@/lib/game/constants";
import {
  createDeck,
  detectWin,
  findCoveredCardOfColor,
  getCardByNumber,
  pickRandomAvailableNumber,
  wonLevelsForColor,
} from "@/lib/game/distribution";
import { randomMockeryMessage } from "@/lib/game/mockery";

interface GameActions {
  _hydrated: boolean;
  setHydrated: (v: boolean) => void;
  startGame: (config: Omit<GameConfig, "cardsPerColor" | "totalCards">) => void;
  callNumber: (n: number) => void;
  pickRandom: () => void;
  applyChangeColor: (revealedCardId: string, targetColorKey: string) => void;
  applyCopri2: (cardId: string) => void;
  useCambioGiro: () => void;
  consumeCopri2: () => void;
  dismissError: () => void;
  dismissLastWin: () => void;
  setSpinning: (spinning: boolean, targetId?: string | null) => void;
  finalizeReveal: (cardId: string) => void;
  newGame: () => void;
  resetAll: () => void;
  setTheme: (themeId: ThemeId) => void;
  toggleSfx: () => void;
  toggleMusic: () => void;
  toggleVoice: () => void;
}

type Store = GameState & GameActions;

const initialSound = { sfxEnabled: true, musicEnabled: false, voiceEnabled: true };

const initialState: GameState & { _hydrated: boolean } = {
  ...{ phase: "setup", config: null, cards: [], calledNumbers: [], wins: [], lastWin: null, error: null, copri2Available: 0, cambioGiroAvailable: 0, isSpinning: false, spinTargetId: null, sound: initialSound } as GameState,
  _hydrated: false,
};

export const useGameStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialState,

      startGame: (configInput) => {
        const { cardsPerColor, total } = getDistribution(configInput.playerCount);
        const colors = GAME_COLORS.slice(0, configInput.playerCount);
        const players = colors.map((color, i) => ({
          color,
          name: configInput.useNames
            ? configInput.players[i]?.name?.trim() || undefined
            : undefined,
        }));
        const config: GameConfig = {
          ...configInput,
          players,
          cardsPerColor,
          totalCards: total,
        };
        const cards = createDeck(configInput.playerCount);
        set({
          phase: "playing",
          config,
          cards,
          calledNumbers: [],
          wins: [],
          lastWin: null,
          error: null,
          copri2Available: 0,
          cambioGiroAvailable: 0,
          isSpinning: false,
          spinTargetId: null,
        });
      },

      callNumber: (n) => {
        const state = get();
        if (state.isSpinning) return; // blocca durante animazione
        if (state.phase !== "playing") return;
        const card = getCardByNumber(state.cards, n);
        if (!card) {
          // numero fuori range
          set({ error: `Il numero ${n} non esiste in questa partita! Range 1-${state.config?.totalCards}.` });
          return;
        }
        if (card.revealed || card.covered) {
          set({ error: randomMockeryMessage() });
          return;
        }
        // OK: avvia l'animazione di scorrimento verso questa card.
        set({ isSpinning: true, spinTargetId: card.id, error: null });
        // L'effettivo reveal viene finalizzato dal componente CardScreen
        // quando l'animazione di scorrimento termina (finalizeReveal).
      },

      pickRandom: () => {
        const state = get();
        if (state.isSpinning || state.phase !== "playing") return;
        const n = pickRandomAvailableNumber(state.cards);
        if (n === null) {
          set({ error: "Non ci sono più numeri liberi!" });
          return;
        }
        // delega a callNumber
        get().callNumber(n);
      },

      finalizeReveal: (cardId) => {
        const state = get();
        if (!state.isSpinning) return;
        const card = state.cards.find((c) => c.id === cardId);
        if (!card) {
          set({ isSpinning: false, spinTargetId: null });
          return;
        }
        // scopri la card
        const newCards = state.cards.map((c) =>
          c.id === cardId
            ? { ...c, revealed: true, flippedAt: Date.now() }
            : c,
        );
        const calledNumbers = [...state.calledNumbers, card.number];

        // aggiorna bonus disponibili in base al simbolo
        let copri2Available = state.copri2Available;
        let cambioGiroAvailable = state.cambioGiroAvailable;
        if (card.symbol === "copri2") {
          // "Copri 2" = permette di coprire 2 card, quindi +2
          copri2Available += 2;
        } else if (card.symbol === "cambioGiro") {
          cambioGiroAvailable += 1;
        }

        // rileva vincita
        const alreadyWon = wonLevelsForColor(state.wins, card.color);
        const win = detectWin(newCards, card.color, alreadyWon);
        const wins = win ? [...state.wins, win] : state.wins;

        set({
          cards: newCards,
          calledNumbers,
          isSpinning: false,
          spinTargetId: null,
          copri2Available,
          cambioGiroAvailable,
          wins,
          lastWin: win,
        });
      },

      applyChangeColor: (revealedCardId, targetColorKey) => {
        // Inverte il colore di una card scoperta con quello di una card coperta
        // del colore desiderato.
        const state = get();
        const revealed = state.cards.find((c) => c.id === revealedCardId);
        if (!revealed || !revealed.revealed) return;
        const targetColor = GAME_COLORS.find((c) => c.key === targetColorKey);
        if (!targetColor) return;
        if (targetColor.key === revealed.color.key) return; // stesso colore
        const covered = findCoveredCardOfColor(state.cards, targetColor);
        if (!covered) {
          set({ error: `Non ci sono più card coperte di colore ${targetColor.name} da scambiare.` });
          return;
        }
        // swap dei colori
        const newCards = state.cards.map((c) => {
          if (c.id === revealed.id) return { ...c, color: targetColor };
          if (c.id === covered.id) return { ...c, color: revealed.color };
          return c;
        });
        // dopo lo swap, potrebbero esserci nuove vincite per il colore target
        // sulla card rivelata, e per il colore originale sulle altre card già rivelate.
        // Rileviamo entrambi i colori coinvolti.
        const winsBefore = state.wins;
        const newWins: WinEvent[] = [...winsBefore];
        for (const col of [targetColor, revealed.color]) {
          const already = wonLevelsForColor(newWins, col);
          const w = detectWin(newCards, col, already);
          if (w) newWins.push(w);
        }
        set({
          cards: newCards,
          wins: newWins,
          lastWin: newWins.length > winsBefore.length
            ? newWins[newWins.length - 1]
            : state.lastWin,
        });
      },

      applyCopri2: (cardId) => {
        const state = get();
        if (state.copri2Available <= 0) return;
        const card = state.cards.find((c) => c.id === cardId);
        if (!card || !card.revealed) return;
        // "Coprire" una card significa RESETTARLA allo stato iniziale:
        // torna a mostrare il numero, è di nuovo selezionabile dai giocatori.
        // La rimuoviamo anche dai numeri chiamati.
        const newCards = state.cards.map((c) =>
          c.id === cardId
            ? { ...c, revealed: false, covered: false, flippedAt: null }
            : c,
        );
        const calledNumbers = state.calledNumbers.filter(
          (n) => n !== card.number,
        );
        set({
          cards: newCards,
          calledNumbers,
          copri2Available: state.copri2Available - 1,
        });
      },

      useCambioGiro: () => {
        const state = get();
        if (state.cambioGiroAvailable <= 0) return;
        set({ cambioGiroAvailable: state.cambioGiroAvailable - 1 });
      },

      consumeCopri2: () => {
        const state = get();
        if (state.copri2Available <= 0) return;
        set({ copri2Available: state.copri2Available - 1 });
      },

      dismissError: () => set({ error: null }),
      dismissLastWin: () => set({ lastWin: null }),
      setSpinning: (spinning, targetId = null) =>
        set({ isSpinning: spinning, spinTargetId: targetId }),

      newGame: () => {
        const state = get();
        if (!state.config) return;
        const cards = createDeck(state.config.playerCount);
        set({
          phase: "playing",
          cards,
          calledNumbers: [],
          wins: [],
          lastWin: null,
          error: null,
          copri2Available: 0,
          cambioGiroAvailable: 0,
          isSpinning: false,
          spinTargetId: null,
        });
      },

      resetAll: () => {
        set({ ...initialState, sound: get().sound, _hydrated: true });
      },

      setTheme: (themeId) => {
        // per ora un solo tema; struttura pronta per futuro switch
        const theme = THEMES[themeId];
        if (theme) {
          // aggiorna solo il config se esiste
          const state = get();
          if (state.config) {
            set({ config: { ...state.config, themeId } });
          }
        }
      },

      toggleSfx: () =>
        set((s) => ({ sound: { ...s.sound, sfxEnabled: !s.sound.sfxEnabled } })),
      toggleMusic: () =>
        set((s) => ({ sound: { ...s.sound, musicEnabled: !s.sound.musicEnabled } })),
      toggleVoice: () =>
        set((s) => ({ sound: { ...s.sound, voiceEnabled: !s.sound.voiceEnabled } })),

      setHydrated: (v) => set({ _hydrated: v }),
    }),
    {
      name: "tombola-colorata-v1",
      storage: createJSONStorage(() => localStorage),
      // persistiamo solo i dati rilevanti, non gli stati transitori
      partialize: (s) => ({
        phase: s.phase,
        config: s.config,
        cards: s.cards,
        calledNumbers: s.calledNumbers,
        wins: s.wins,
        copri2Available: s.copri2Available,
        cambioGiroAvailable: s.cambioGiroAvailable,
        sound: s.sound,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHydrated(true);
      },
    },
  ),
);

// Selettore utility: colori attivi della partita corrente.
export function activeColors(state: GameState): GameColor[] {
  if (!state.config) return [];
  return GAME_COLORS.slice(0, state.config.playerCount);
}

export type { Card };
