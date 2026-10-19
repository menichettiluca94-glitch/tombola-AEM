"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/hooks/game/useGameStore";
import { GAME_COLORS, THEME_LIST, THEMES, applyThemeVars } from "@/lib/game/constants";
import type { ThemeId } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import {
  Dices,
  Sparkles,
  Users,
  Play,
  Palette,
  RotateCcw,
  ListOrdered,
} from "lucide-react";

export function SetupScreen() {
  const startGame = useGameStore((s) => s.startGame);
  const hasSavedGame = useGameStore(
    (s) => s.phase === "playing" && s.config !== null && s.cards.length > 0,
  );
  const resetAll = useGameStore((s) => s.resetAll);
  const savedConfig = useGameStore((s) => s.config);
  const savedCards = useGameStore((s) => s.cards);
  const savedCalled = useGameStore((s) => s.calledNumbers);

  const [themeId, setThemeId] = useState<ThemeId>("arcadeScuro");
  const [playerCount, setPlayerCount] = useState(3);
  const [useNames, setUseNames] = useState(false);
  const [names, setNames] = useState<string[]>(Array(10).fill(""));

  const activeColors = GAME_COLORS.slice(0, playerCount);

  // anteprima live del tema: applichiamo data-theme + variabili CSS su <html>
  // (variabili via JS perché Lightning CSS strippa :root[data-theme])
  useEffect(() => {
    document.documentElement.dataset.theme = themeId;
    applyThemeVars(themeId);
  }, [themeId]);

  const handleStart = () => {
    const players = activeColors.map((color, i) => ({
      color,
      name: useNames ? names[i] : undefined,
    }));
    startGame({
      themeId,
      playerCount,
      useNames,
      players,
    });
  };

  const handleResume = () => {
    // Lo store persistente mantiene già lo stato: basta forzare il phase.
  };

  const totals: Record<number, number> = {
    2: 40, 3: 60, 4: 80, 5: 70, 6: 60, 7: 70, 8: 80, 9: 90, 10: 80,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-start px-3 sm:px-4 py-5 md:py-8">
        {/* TITOLO */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-5 md:mb-7"
        >
          <h1
            className="font-display logo-pulse text-4xl sm:text-5xl md:text-7xl leading-tight"
            style={{ color: "var(--arcade-pink)" }}
          >
            TOMBOLA
          </h1>
          <h2 className="font-display text-3xl sm:text-4xl md:text-6xl mt-2 neon-lime">
            COLORATA
          </h2>
          <p className="font-arcade text-lg sm:text-xl md:text-2xl mt-3 text-muted-foreground max-w-2xl mx-auto">
            Il banditore governa mouse e tastiera. I giocatori scelgono un numero,
            la tabella lo rivela… e sboccia il colore nascosto!
          </p>
        </motion.header>

        {/* AVVIO RAPIDO: riprendi partita */}
        {hasSavedGame && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="arcade-panel rounded-lg p-3 mb-4 w-full max-w-2xl"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-center sm:text-left">
                <div className="font-display text-sm neon-gold blink">
                  PARTITA IN CORSO
                </div>
                <div className="font-arcade text-lg text-foreground mt-1">
                  {savedConfig?.playerCount} giocatori ·{" "}
                  {savedCalled.length}/{savedCards.length} numeri detti
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleResume}
                  className="btn-arcade-lime px-4 py-2 rounded text-xs"
                >
                  <Play className="inline w-4 h-4 mr-1" />
                  Riprendi
                </button>
                <button
                  onClick={() => resetAll()}
                  className="btn-arcade px-4 py-2 rounded text-xs"
                >
                  <RotateCcw className="inline w-4 h-4 mr-1" />
                  Ricomincia
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* CARD SETUP */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="arcade-panel rounded-xl p-4 sm:p-5 md:p-6 w-full max-w-2xl"
        >
          {/* TEMA — SELECT */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <Palette className="w-5 h-5 neon-cyan" />
              <h3 className="font-display text-base sm:text-lg neon-cyan">
                TEMA
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {THEME_LIST.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setThemeId(t.id)}
                  className={cn(
                    "text-left p-3 rounded-lg border-2 transition-all flex items-center justify-between gap-3",
                    themeId === t.id
                      ? "border-[var(--arcade-pink)] bg-[color-mix(in_srgb,var(--arcade-pink)_15%,transparent)]"
                      : "border-border bg-black/30 hover:border-[var(--arcade-pink)]/50",
                  )}
                >
                  <div className="min-w-0">
                    <div className="font-display text-sm sm:text-base text-foreground">
                      {t.name}
                    </div>
                    <div className="font-arcade text-sm text-muted-foreground mt-0.5">
                      {t.description}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <span
                      className="w-5 h-5 rounded-full border border-black/40"
                      style={{ background: t.accent }}
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-black/40"
                      style={{ background: t.accent2 }}
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-black/40"
                      style={{ background: t.accent3 }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* NUMERO GIOCATORI */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 neon-pink" />
              <h3 className="font-display text-base sm:text-lg neon-pink">
                QUANTI GIOCATORI?
              </h3>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-9 gap-2">
              {Array.from({ length: 9 }, (_, i) => i + 2).map((n) => (
                <button
                  key={n}
                  onClick={() => setPlayerCount(n)}
                  className={cn(
                    "font-display text-lg sm:text-xl py-3 rounded-lg border-2 transition-all",
                    playerCount === n
                      ? "border-[var(--arcade-lime)] bg-[color-mix(in_srgb,var(--arcade-lime)_15%,transparent)] neon-lime scale-105"
                      : "border-border bg-black/30 text-muted-foreground hover:border-[var(--arcade-lime)]/50 hover:text-foreground",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>

            {/* ANTEPRIMA COLORI ASSEGNATI */}
            <div className="mt-3 p-3 rounded-lg bg-black/30 border border-border">
              <div className="font-arcade text-base text-muted-foreground mb-2">
                Colori distribuiti in quest&apos;ordine:
              </div>
              <div className="flex flex-wrap gap-2">
                {activeColors.map((c, i) => (
                  <div
                    key={c.key}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-border bg-black/40"
                  >
                    <span
                      className="w-4 h-4 rounded-full inline-block"
                      style={{
                        background: c.hex,
                        boxShadow: `0 0 6px ${c.hex}`,
                      }}
                    />
                    <span className="font-arcade text-base text-foreground">
                      {i + 1}. {c.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TOGGLE NOMI */}
          <div className="mb-5">
            <label className="flex items-center justify-between gap-3 p-3 rounded-lg bg-black/30 border border-border cursor-pointer hover:border-[var(--arcade-cyan)]/50 transition-colors">
              <div>
                <div className="font-display text-sm sm:text-base neon-cyan">
                  INSERISCI I NOMI DEI PARTECIPANTI?
                </div>
                <div className="font-arcade text-base text-muted-foreground mt-0.5">
                  Spento: si gioca solo con i colori. Acceso: nomi personalizzati.
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={useNames}
                onClick={() => setUseNames((v) => !v)}
                className={cn(
                  "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border-2 transition-colors",
                  useNames
                    ? "border-[var(--arcade-lime)] bg-[color-mix(in_srgb,var(--arcade-lime)_30%,transparent)]"
                    : "border-border bg-black/50",
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full transition-transform",
                    useNames
                      ? "translate-x-6 bg-[var(--arcade-lime)]"
                      : "translate-x-1 bg-muted-foreground",
                  )}
                />
              </button>
            </label>

            {/* INPUT NOMI */}
            {useNames && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2"
              >
                {activeColors.map((c, i) => (
                  <div
                    key={c.key}
                    className="flex items-center gap-2 p-2 rounded-lg bg-black/30 border border-border"
                  >
                    <span
                      className="w-5 h-5 rounded-full shrink-0"
                      style={{
                        background: c.hex,
                        boxShadow: `0 0 8px ${c.hex}`,
                      }}
                    />
                    <span className="font-arcade text-base text-foreground w-20 shrink-0">
                      {c.name}
                    </span>
                    <input
                      type="text"
                      maxLength={18}
                      placeholder={`Giocatore ${i + 1}`}
                      value={names[i]}
                      onChange={(e) => {
                        const next = [...names];
                        next[i] = e.target.value;
                        setNames(next);
                      }}
                      className="flex-1 bg-black/40 border border-border rounded px-2 py-1 font-arcade text-lg text-foreground focus:outline-none focus:border-[var(--arcade-cyan)]"
                    />
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* INFO PARTITA */}
          <div className="mb-5 p-3 rounded-lg bg-black/30 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 neon-gold" />
              <span className="font-display text-sm neon-gold">
                CONFIGURAZIONE
              </span>
            </div>
            <div className="font-arcade text-lg text-muted-foreground">
              {playerCount} giocatori · 1 tabellone ·{" "}
              <span className="neon-lime">{totals[playerCount]} card totali</span>
            </div>
          </div>

          {/* START */}
          <button
            onClick={handleStart}
            className="btn-arcade-lime w-full py-4 rounded-lg text-base sm:text-lg flex items-center justify-center gap-2"
          >
            <Dices className="w-5 h-5" />
            AVVIA LA TOMBOLA!
          </button>
        </motion.section>

        {/* REGOLAMENTO DETTAGLIATO A STEP */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-5 max-w-2xl w-full"
        >
          <div className="arcade-panel rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <ListOrdered className="w-5 h-5 neon-pink" />
              <h3 className="font-display text-base sm:text-lg neon-pink">
                COME SI GIOCA — REGOLAMENTO
              </h3>
            </div>

            <ol className="space-y-3">
              <Step n={1} title="Setup">
                Il <b>banditore</b> è l&apos;unico al computer. Sceglie tema e
                numero di giocatori (2–10), opzionalmente i nomi, e preme{" "}
                <span className="neon-lime">AVVIA LA TOMBOLA!</span>
              </Step>
              <Step n={2} title="Colori assegnati">
                A ogni giocatore viene assegnato un <b>colore fisso</b> (Rosso,
                Blu, Giallo…). Sul tabellone ci sono tante card quanti sono i
                numeri: ognuna nasconde un colore, mescolato a caso.
              </Step>
              <Step n={3} title="Il turno">
                A turno, ogni giocatore dice ad alta voce un <b>numero libero</b>{" "}
                visibile sul tabellone. Il banditore lo digita nell&apos;input in
                basso e preme <span className="neon-lime">GIRA!</span>
              </Step>
              <Step n={4} title="L&apos;estrazione">
                Il tabellone <b>scorre</b> illuminando le caselle come un&apos; slot
                machine, poi si ferma sul numero detto: la card si{" "}
                <b>gira in 3D</b> e rivela il colore nascosto (e l&apos;eventuale
                simbolo bonus).
              </Step>
              <Step n={5} title="Le vincite">
                Quando si scoprono più card dello <b>stesso colore</b> si vince:
                <span className="neon-lime"> Ambo</span> (2),{" "}
                <span className="neon-lime">Terna</span> (3),{" "}
                <span className="neon-lime">Quaterna</span> (4),{" "}
                <span className="neon-lime">Cinquina</span> (5),{" "}
                <span className="neon-gold">TOMBOLA!</span> (tutte le card di
                quel colore). Parte una modale di vittoria + voce sintetica.
              </Step>
              <Step n={6} title="Numeri già detti">
                Se un giocatore dice un numero già uscito o fuori range, appare
                una modale con una <b>frase di presa in giro</b>. 😈
              </Step>
              <Step n={7} title="Bonus">
                <ul className="space-y-1 mt-1">
                  <li>
                    <span className="neon-cyan">🎲 Random</span> — il software
                    sceglie un numero libero a caso.
                  </li>
                  <li>
                    <span className="neon-cyan">🔀 Cambia colore</span> — clicca
                    una card scoperta e scambiane il colore con quello di una card
                    coperta.
                  </li>
                  <li>
                    <span className="neon-cyan">🛡️ Copri 2</span> — trovando il
                    simbolo, guadagni coperture: clicca card scoperte per
                    riportarle allo stato iniziale.
                  </li>
                  <li>
                    <span className="neon-cyan">🔁 Cambio giro</span> — simbolo
                    fisico: il giocatore riceve una carta da usare a tavolo
                    quando vuole.
                  </li>
                </ul>
              </Step>
              <Step n={8} title="Fine partita">
                La partita si <b>salva da sola</b> (localStorage): puoi chiudere e
                riprendere. Dall&apos;header puoi aprire il{" "}
                <span className="neon-pink">Recap</span> (istogramma progressi),
                cambiare audio/voce, fare schermo intero, nuova partita o tornare
                al setup.
              </Step>
            </ol>
          </div>
        </motion.section>
      </main>

      <footer className="mt-auto border-t border-[rgba(255,45,149,0.2)] py-3 px-4 text-center">
        <p className="font-arcade text-base text-muted-foreground">
          Tombola Colorata · tema{" "}
          <span className="neon-pink">{THEMES[themeId].name}</span> · fatto con
          HTML, CSS, JS e tanto neon
        </p>
      </footer>
    </div>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="shrink-0 w-7 h-7 rounded-full border-2 border-[var(--arcade-pink)] flex items-center justify-center font-display text-xs neon-pink">
        {n}
      </span>
      <div className="min-w-0">
        <div className="font-display text-sm sm:text-base text-foreground">
          {title}
        </div>
        <div className="font-arcade text-lg text-muted-foreground mt-0.5 leading-snug">
          {children}
        </div>
      </div>
    </li>
  );
}
