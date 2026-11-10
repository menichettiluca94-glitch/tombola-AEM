"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/hooks/game/useGameStore";
import { WIN_LABELS } from "@/lib/game/constants";
import { Trophy, X, BookOpen } from "lucide-react";
import { SMORFIA } from "@/lib/game/smorfia";

export function WinModal() {
  const lastWin = useGameStore((s) => s.lastWin);
  const dismiss = useGameStore((s) => s.dismissLastWin);
  const config = useGameStore((s) => s.config);
  const calledNumbers = useGameStore((s) => s.calledNumbers);

  const lastCalled =
    calledNumbers.length > 0 ? calledNumbers[calledNumbers.length - 1] : null;
  const currentSmorfia =
    lastCalled !== null ? SMORFIA[lastCalled] : null;

  return (
    <AnimatePresence>
      {lastWin && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={dismiss}
        >
          <motion.div
            initial={{ scale: 0.6, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            className="relative arcade-panel rounded-2xl p-6 sm:p-8 md:p-10 max-w-md w-full text-center win-shake flex flex-col items-center"
            style={{
              borderColor: lastWin.color.hex,
              boxShadow: `0 0 40px ${lastWin.color.hex}99, 0 0 80px ${lastWin.color.hex}55`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 hover:bg-black/70 transition-colors"
              aria-label="Chiudi"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>

            {/* Icona Trofeo */}
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
              className="mx-auto mb-4 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center"
              style={{
                background: lastWin.color.hex,
                boxShadow: `0 0 32px ${lastWin.color.hex}`,
              }}
            >
              <Trophy
                className="w-8 h-8 sm:w-10 sm:h-10"
                style={{ color: lastWin.color.textOnColor }}
              />
            </motion.div>

            {/* Titolo Livello Vincita */}
            <div className="font-display text-lg sm:text-2xl md:text-3xl mb-2 neon-gold">
              {WIN_LABELS[lastWin.level]}
            </div>

            {/* Descrizione Vincitore (usa countForLevel) */}
            <p className="font-arcade text-base sm:text-lg text-foreground mb-4">
              {(() => {
                const player = config?.players.find(
                  (p) => p.color.key === lastWin.color.key,
                );
                return player?.name
                  ? `${player.name} (colore ${lastWin.color.name})`
                  : `Il colore ${lastWin.color.name}`;
              })()}{" "}
              {lastWin.level === "tombola"
                ? "ha completato tutte le sue carte!"
                : `ha scoperto ${countForLevel(lastWin.level)} carte uguali!`}
            </p>

            {/* Box Smorfia Napoletana Ottimizzato */}
            {currentSmorfia && (
              <div className="mb-4 w-full arcade-panel rounded-xl p-3.5 flex items-center justify-between gap-4 border-cyan-500/40 bg-cyan-950/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                {/* Blocco Sinistra: Smorfia + Numero */}
                <div className="flex flex-col items-center gap-1.5 shrink-0 pr-4 border-r border-cyan-500/60">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="font-arcade text-[10px] text-cyan-400/80 uppercase tracking-wider">
                      Smorfia
                    </span>
                  </div>
                  <span className="font-display text-2xl sm:text-3xl neon-gold leading-none">
                    {lastCalled}
                  </span>
                </div>

                {/* Blocco Destra: Significato centrato verticalmente */}
                <div className="flex-1 text-left pl-2">
                  <span className="font-display text-sm sm:text-base text-cyan-300 leading-snug tracking-wide">
                    &ldquo;{currentSmorfia.significato}&rdquo;
                  </span>
                </div>
              </div>
            )}

            {lastWin.level === "tombola" ? (
              <p className="font-arcade text-sm text-muted-foreground mt-1 blink">
                Vuoi continuare a giocare per i piazzamenti?
              </p>
            ) : null}

            {/* Pulsante Continua */}
            <button
              onClick={dismiss}
              className="btn-arcade-lime mt-4 px-6 py-3 rounded-lg text-xs sm:text-sm"
            >
              CONTINUA
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function countForLevel(level: string): number {
  switch (level) {
    case "ambo":
      return 2;
    case "terna":
      return 3;
    case "quaterna":
      return 4;
    case "cinquina":
      return 5;
    default:
      return 0;
  }
}