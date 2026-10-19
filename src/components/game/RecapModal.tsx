"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/hooks/game/useGameStore";
import { GAME_COLORS, WIN_LABELS, WIN_THRESHOLDS } from "@/lib/game/constants";
import { countRevealedForColor, totalForColor } from "@/lib/game/distribution";
import { BarChart3, Trophy, X } from "lucide-react";
import type { WinLevel } from "@/lib/game/types";

export function RecapModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const cards = useGameStore((s) => s.cards);
  const config = useGameStore((s) => s.config);
  const wins = useGameStore((s) => s.wins);
  const calledNumbers = useGameStore((s) => s.calledNumbers);

  // chiudi con ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    // blocca scroll body quando aperto
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  if (!config) return null;
  const colors = GAME_COLORS.slice(0, config.playerCount);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-overlay"
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            className="modal-content arcade-panel rounded-2xl p-4 sm:p-6 flex flex-col"
            style={{ width: "96vw", maxWidth: "96vw", height: "92vh", maxHeight: "92vh", overflow: "hidden" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE */}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/40 hover:bg-black/70 transition-colors z-10"
              aria-label="Chiudi"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>

            {/* HEADER */}
            <div className="mb-4 pr-10 shrink-0">
              <h2 className="font-display text-lg sm:text-2xl neon-pink flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                RECAP PARTITA
              </h2>
              <p className="font-arcade text-xl text-muted-foreground mt-1">
                Stato scoperta di ogni colore e vincite ottenute.
              </p>
            </div>

            {/* ISTOGRAMMA ORIZZONTALE */}
            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              {colors.map((c) => {
                const revealed = countRevealedForColor(cards, c);
                const total = totalForColor(cards, c);
                const pct = total > 0 ? Math.round((revealed / total) * 100) : 0;
                const isTombola = revealed === total && total > 0;
                return (
                  <div key={c.key} className="space-y-2">
                    <div className="flex items-center justify-between font-arcade text-xl">
                      <span className="flex items-center gap-2 text-foreground">
                        <span
                          className="w-5 h-5 rounded-full inline-block shrink-0"
                          style={{
                            background: c.hex,
                            boxShadow: `0 0 8px ${c.hex}`,
                          }}
                        />
                        <span className="font-bold">{c.name}</span>
                        {isTombola && (
                          <Trophy className="w-5 h-5 neon-gold inline" />
                        )}
                      </span>
                      <span className="text-muted-foreground font-bold">
                        {revealed}/{total}{" "}
                        <span className="text-base opacity-70">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-8 rounded-full bg-black/60 border border-border overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{
                          background: c.hex,
                          boxShadow: `0 0 12px ${c.hex}`,
                        }}
                      />
                    </div>
                    {/* badge vincite raggiunte per questo colore */}
                    <div className="flex flex-wrap gap-1">
                      {WIN_THRESHOLDS.map((t) => {
                        const reached = wins.some(
                          (w) =>
                            w.color.key === c.key &&
                            w.level === (t.level as WinLevel),
                        );
                        return (
                          <span
                            key={t.level}
                            className={`px-2.5 py-1 rounded-full text-base font-arcade border ${
                              reached
                                ? "border-[var(--arcade-lime)] text-[var(--arcade-lime)] bg-[color-mix(in_srgb,var(--arcade-lime)_10%,transparent)]"
                                : "border-border text-muted-foreground opacity-50"
                            }`}
                          >
                            {WIN_LABELS[t.level]}
                          </span>
                        );
                      })}
                      <span
                        className={`px-2.5 py-1 rounded-full text-base font-arcade border ${
                          isTombola
                            ? "border-[var(--arcade-gold)] text-[var(--arcade-gold)] bg-[color-mix(in_srgb,var(--arcade-gold)_10%,transparent)]"
                            : "border-border text-muted-foreground opacity-50"
                        }`}
                      >
                        {WIN_LABELS.tombola}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* NUMERI DETTI */}
            <div className="mt-4 pt-3 border-t border-border shrink-0">
              <div className="font-display text-sm neon-cyan mb-2">
                NUMERI DETTI ({calledNumbers.length})
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {calledNumbers.length === 0 ? (
                  <span className="font-arcade text-lg text-muted-foreground">
                    Ancora nessun numero chiamato.
                  </span>
                ) : (
                  calledNumbers.map((n) => (
                    <span
                      key={n}
                      className="px-2.5 py-1 rounded bg-black/40 border border-border font-arcade text-lg text-foreground"
                    >
                      {n}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* CLOSE BUTTON */}
            <button
              onClick={() => onOpenChange(false)}
              className="btn-arcade-lime w-full mt-4 py-3 rounded-lg text-sm shrink-0"
            >
              CHIUDI
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
