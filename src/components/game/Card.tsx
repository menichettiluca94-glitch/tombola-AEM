"use client";

import { motion } from "framer-motion";
import { ShieldX, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Card as CardType } from "@/lib/game/types";

interface CardProps {
  card: CardType;
  isTarget: boolean; // è il bersaglio dello spin?
  isCharging: boolean; // fase di "charge up" pre-flip?
  isSpinning: boolean; // animazione in corso globalmente?
  spotlightIndex: number | null; // indice corrente dello scorrimento
  myIndex: number; // indice di questa card
  changeColorMode: boolean; // modalità "cambia colore" attiva?
  copri2Mode: boolean; // modalità "copri 2" attiva?
  onCardClick: (card: CardType) => void;
}

export function Card({
  card,
  isTarget,
  isCharging,
  isSpinning,
  spotlightIndex,
  myIndex,
  changeColorMode,
  copri2Mode,
  onCardClick,
}: CardProps) {
  const isSpotlight = spotlightIndex === myIndex;
  const clickable =
    !isSpinning &&
    ((changeColorMode && card.revealed) ||
      (copri2Mode && card.revealed));

  return (
    <motion.button
      type="button"
      layout
      onClick={() => clickable && onCardClick(card)}
      disabled={!clickable}
      className={cn(
        "card-3d relative aspect-square w-full select-none rounded-lg",
        "transition-transform duration-150",
        clickable && "cursor-pointer hover:scale-105",
        isCharging && "card-charging",
      )}
      style={
        {
          // variabile CSS per il glow persistente del colore
          "--card-glow": card.color.hex,
        } as React.CSSProperties
      }
      whileTap={clickable ? { scale: 0.94 } : undefined}
    >
      <div
        className={cn(
          "card-inner rounded-lg",
          card.revealed && "card-flipped",
        )}
      >
        {/* FRONTE: numero visibile */}
        <div
          className={cn(
            "card-face flex-col rounded-lg border-2",
            "bg-gradient-to-br from-[#1a1a2e] to-[#0d0d18]",
            card.revealed
              ? "border-transparent"
              : "border-[rgba(255,45,149,0.35)]",
            isSpotlight && !isCharging && "card-spotlight",
            // NB: il target-glow durante lo spin era uno spoiler (rivelava la
            // card bersaglio prima che l'animazione la raggiungesse). Rimosso:
            // ora solo lo spotlight scorre, e il charge-up fa la rivelazione.
            changeColorMode &&
              card.revealed &&
              "ring-2 ring-[var(--arcade-cyan)] ring-offset-2 ring-offset-black",
            copri2Mode &&
              card.revealed &&
              "ring-2 ring-[var(--arcade-gold)] ring-offset-2 ring-offset-black",
          )}
        >
          {/* pattern pixel sul fronte (theme-aware) */}
          <div
            className="absolute inset-0 rounded-lg opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, color-mix(in srgb, var(--arcade-pink) 30%, transparent) 0, color-mix(in srgb, var(--arcade-pink) 30%, transparent) 2px, transparent 2px, transparent 8px)",
            }}
          />
          <span
            className="font-display relative z-10 neon-pink whitespace-nowrap"
            style={{
              fontSize: "clamp(0.5rem, 1.8vw, 1.2rem)",
              lineHeight: 1,
            }}
          >
            {card.number}
          </span>
          {/* mini badge "?" in angolo */}
          <span className="absolute bottom-0.5 right-1 font-arcade text-[0.6rem] text-muted-foreground opacity-60">
            ?
          </span>
        </div>

        {/* RETRO: COLORE GRANDE E CHIARO */}
        <div
          className="card-back-face card-face rounded-lg border-2 border-black/40 overflow-hidden"
          style={{ background: card.color.hex }}
        >
          {/* glow colore persistente */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: `inset 0 0 24px rgba(0,0,0,0.3), 0 0 20px ${card.color.hex}`,
            }}
          />
          {/* riflesso lucido */}
          <div
            className="absolute inset-0 opacity-25 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 45%, transparent 55%, rgba(0,0,0,0.2) 100%)",
            }}
          />
          {card.revealed && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.35, type: "spring", stiffness: 200, damping: 14 }}
              className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-0.5"
            >
              {/* NOME COLORE — font-arcade (VT323, ~2x piu' stretto di Press
                  Start 2P) cosi' 'Arancione' entra in una card da ~70px senza
                  essere tagliato. whitespace-nowrap: niente capo. */}
              <span
                className="font-arcade uppercase font-bold leading-none whitespace-nowrap"
                style={{
                  color: card.color.textOnColor,
                  fontSize: "clamp(0.55rem, 1.4vw, 0.95rem)",
                  letterSpacing: 0,
                  textShadow:
                    "0 0 4px rgba(0,0,0,0.5), 1px 1px 0 rgba(0,0,0,0.4), -1px -1px 0 rgba(255,255,255,0.15)",
                }}
              >
                {card.color.name}
              </span>
              {/* SIMBOLO BONUS prominente */}
              {card.symbol && (
                <motion.div
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 220 }}
                  className="mt-1 flex flex-col items-center"
                  style={{ color: card.color.textOnColor }}
                >
                  {card.symbol === "cambioGiro" ? (
                    <Repeat className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                  ) : (
                    <ShieldX className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.button>
  );
}
