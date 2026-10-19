"use client";

import { useState } from "react";
import { useGameStore } from "@/hooks/game/useGameStore";
import { GAME_COLORS } from "@/lib/game/constants";
import { cn } from "@/lib/utils";
import { Dices, Shuffle, ShieldX, Repeat, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface BonusBarProps {
  changeColorMode: boolean;
  setChangeColorMode: (v: boolean) => void;
  copri2Mode: boolean;
  setCopri2Mode: (v: boolean) => void;
  pendingChangeColorCardId: string | null;
  setPendingChangeColorCardId: (id: string | null) => void;
}

export function BonusBar({
  changeColorMode,
  setChangeColorMode,
  copri2Mode,
  setCopri2Mode,
  pendingChangeColorCardId,
  setPendingChangeColorCardId,
}: BonusBarProps) {
  const pickRandom = useGameStore((s) => s.pickRandom);
  const applyChangeColor = useGameStore((s) => s.applyChangeColor);
  const applyCopri2 = useGameStore((s) => s.applyCopri2);
  const copri2Available = useGameStore((s) => s.copri2Available);
  const cambioGiroAvailable = useGameStore((s) => s.cambioGiroAvailable);
  const config = useGameStore((s) => s.config);
  const isSpinning = useGameStore((s) => s.isSpinning);
  const cards = useGameStore((s) => s.cards);

  const [selectedCardForChange, setSelectedCardForChange] = useState<
    string | null
  >(null);

  const availableColorsForChange = config
    ? GAME_COLORS.slice(0, config.playerCount).filter((c) => {
        // un colore è disponibile se ha ancora card coperte (scambiabili)
        return cards.some(
          (card) =>
            !card.revealed &&
            card.color.key === c.key &&
            // la card scoperta selezionata non è di questo colore (sennari swap inutile)
            card.id !== pendingChangeColorCardId,
        );
      })
    : [];

  const handleRandom = () => {
    if (isSpinning) return;
    pickRandom();
  };

  const toggleChangeColorMode = () => {
    if (isSpinning) return;
    setCopri2Mode(false);
    setChangeColorMode(!changeColorMode);
    setPendingChangeColorCardId(null);
    setSelectedCardForChange(null);
  };

  const toggleCopri2Mode = () => {
    if (isSpinning || copri2Available <= 0) return;
    setChangeColorMode(false);
    setCopri2Mode(!copri2Mode);
    setPendingChangeColorCardId(null);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* RANDOM */}
      <button
        onClick={handleRandom}
        disabled={isSpinning}
        className="btn-arcade px-3 py-2 rounded-lg text-xs sm:text-sm flex items-center gap-1.5"
        title="Sceglie un numero libero a caso"
      >
        <Dices className="w-4 h-4" />
        RANDOM
      </button>

      {/* CAMBIA COLORE */}
      <button
        onClick={toggleChangeColorMode}
        disabled={isSpinning}
        className={cn(
          "px-3 py-2 rounded-lg text-xs sm:text-sm flex items-center gap-1.5 transition-all",
          changeColorMode
            ? "btn-arcade-lime"
            : "btn-arcade",
        )}
        title="Clicca una card scoperta per scambiare il colore con una coperta"
      >
        <Shuffle className="w-4 h-4" />
        {changeColorMode ? "ANNULLA" : "CAMBIA COLORE"}
      </button>

      {/* COPRI 2 */}
      <button
        onClick={toggleCopri2Mode}
        disabled={isSpinning || copri2Available <= 0}
        className={cn(
          "px-3 py-2 rounded-lg text-xs sm:text-sm flex items-center gap-1.5 transition-all",
          copri2Mode ? "btn-arcade-lime" : "btn-arcade",
        )}
        title="Clicca fino a 2 card scoperte per coprirle: tornano allo stato iniziale (numero visibile e riselezionabile)"
      >
        <ShieldX className="w-4 h-4" />
        COPRI 2
        <span className="ml-1 px-1.5 py-0.5 rounded bg-black/40 text-xs">
          {copri2Available}
        </span>
      </button>

      {/* CAMBIO GIRO (solo display, la logica fisica è gestita offline) */}
      <div
        className="px-3 py-2 rounded-lg border border-border bg-black/30 text-xs sm:text-sm flex items-center gap-1.5"
        title="Carta fisica: il giocatore che trova il simbolo 'Cambio giro' riceve una carta fisica da usare quando vuole"
      >
        <Repeat className="w-4 h-4 neon-cyan" />
        <span className="font-arcade text-muted-foreground">CAMBIO GIRO</span>
        <span className="ml-1 px-1.5 py-0.5 rounded bg-black/40 text-xs neon-cyan">
          {cambioGiroAvailable}
        </span>
      </div>

      {/* MENU CAMBIA COLORE: quando una card è stata selezionata */}
      {changeColorMode && pendingChangeColorCardId && (
        <DropdownMenu open modal={false}>
          <DropdownMenuTrigger asChild>
            <button className="btn-arcade-lime px-3 py-2 rounded-lg text-xs sm:text-sm flex items-center gap-1.5">
              SCEGLI COLORE
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="arcade-panel border-[var(--arcade-pink)]/50"
          >
            <DropdownMenuLabel className="font-display text-xs neon-pink">
              Scegli il colore da assegnare
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {availableColorsForChange.length === 0 ? (
              <DropdownMenuItem disabled className="font-arcade text-sm">
                Nessuna card coperta disponibile
              </DropdownMenuItem>
            ) : (
              availableColorsForChange.map((c) => {
                const card = cards.find(
                  (x) => x.id === pendingChangeColorCardId,
                );
                if (!card) return null;
                if (c.key === card.color.key) return null;
                return (
                  <DropdownMenuItem
                    key={c.key}
                    onClick={() => {
                      applyChangeColor(pendingChangeColorCardId, c.key);
                      setPendingChangeColorCardId(null);
                      setSelectedCardForChange(null);
                      setChangeColorMode(false);
                    }}
                    className="font-arcade text-base cursor-pointer"
                  >
                    <span
                      className="w-4 h-4 rounded-full inline-block mr-2"
                      style={{ background: c.hex, boxShadow: `0 0 8px ${c.hex}` }}
                    />
                    {c.name}
                  </DropdownMenuItem>
                );
              })
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setPendingChangeColorCardId(null);
                setChangeColorMode(false);
              }}
              className="font-arcade text-sm text-muted-foreground"
            >
              <X className="w-3 h-3 mr-2" /> Annulla
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* INDICATORE MODALITA ATTIVA */}
      {changeColorMode && !pendingChangeColorCardId && (
        <span className="font-arcade text-sm neon-cyan blink">
          → Clicca una card scoperta
        </span>
      )}
      {copri2Mode && (
        <span className="font-arcade text-sm neon-cyan blink">
          → Clicca una card scoperta per coprirla
        </span>
      )}
    </div>
  );
}

// Helper esposto per consentire al GameScreen di applicare copri2
export function useCopri2Applier() {
  const applyCopri2 = useGameStore((s) => s.applyCopri2);
  return applyCopri2;
}
