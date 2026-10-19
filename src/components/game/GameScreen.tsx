"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/hooks/game/useGameStore";
import { getGridColumns, WIN_LABELS } from "@/lib/game/constants";
import {
  playSpinTick,
  playLand,
  playFlip,
  playError,
  playWin,
  playSymbol,
  playClick,
  unlockAudio,
} from "@/lib/sound/audio";
import { isVoiceSupported, speak } from "@/lib/sound/voice";
import { Card } from "./Card";
import { GameHeader } from "./GameHeader";
import { BonusBar } from "./BonusBar";
import { WinModal } from "./WinModal";
import { ErrorModal } from "./ErrorModal";
import { RecapModal } from "./RecapModal";
import type { Card as CardType, WinLevel } from "@/lib/game/types";
import { Sparkles, Repeat, ShieldX, X } from "lucide-react";

export function GameScreen() {
  const cards = useGameStore((s) => s.cards);
  const config = useGameStore((s) => s.config);
  const isSpinning = useGameStore((s) => s.isSpinning);
  const spinTargetId = useGameStore((s) => s.spinTargetId);
  const calledNumbers = useGameStore((s) => s.calledNumbers);
  const error = useGameStore((s) => s.error);
  const lastWin = useGameStore((s) => s.lastWin);
  const sound = useGameStore((s) => s.sound);
  const applyCopri2 = useGameStore((s) => s.applyCopri2);

  const [spotlightIndex, setSpotlightIndex] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);
  const [recapOpen, setRecapOpen] = useState(false);

  // modalità bonus
  const [changeColorMode, setChangeColorMode] = useState(false);
  const [copri2Mode, setCopri2Mode] = useState(false);
  const [pendingChangeColorCardId, setPendingChangeColorCardId] = useState<
    string | null
  >(null);

  // modale simbolo trovato
  const [symbolPopup, setSymbolPopup] = useState<{
    kind: "cambioGiro" | "copri2";
    cardNumber: number;
    colorName: string;
  } | null>(null);

  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const callNumber = useGameStore((s) => s.callNumber);

  // unlock audio al primo gesto
  useEffect(() => {
    const handler = () => {
      unlockAudio();
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("keydown", handler);
    };
    window.addEventListener("pointerdown", handler);
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("keydown", handler);
    };
  }, []);

  // riproduce suono errore quando cambia error
  useEffect(() => {
    if (error && sound.sfxEnabled) playError();
  }, [error, sound.sfxEnabled]);

  // riproduce suono vittoria quando cambia lastWin
  useEffect(() => {
    if (lastWin && sound.sfxEnabled) playWin(lastWin.level as WinLevel);
  }, [lastWin, sound.sfxEnabled]);

  // ANIMAZIONE DI SCORRIMENTO quando isSpinning diventa true
  useEffect(() => {
    if (!isSpinning || !spinTargetId) return;
    // leggiamo lo stato corrente dallo store (non dalle props di closure)
    // per evitare riavvii non necessari dell'effetto.
    const currentCards = useGameStore.getState().cards;
    const targetIdx = currentCards.findIndex((c) => c.id === spinTargetId);
    if (targetIdx < 0) return;

    // genera sequenza di indici (max ~18 tick), ultima = target
    const maxTicks = 18;
    const tickIndices: number[] = [];
    if (targetIdx <= maxTicks) {
      for (let i = 0; i <= targetIdx; i++) tickIndices.push(i);
    } else {
      const step = Math.floor(targetIdx / (maxTicks - 1));
      for (let i = 0; i < targetIdx; i += step) {
        if (i < targetIdx) tickIndices.push(i);
      }
      tickIndices.push(targetIdx);
    }
    // dedupe
    const unique = Array.from(new Set(tickIndices));

    // intervalli ease-out: veloce all'inizio, lento alla fine
    const n = unique.length;
    const intervals = unique.map((_, i) => {
      const progress = n > 1 ? i / (n - 1) : 0;
      const eased = Math.pow(progress, 1.8);
      return 35 + eased * 170; // 35ms -> 205ms
    });

    // pulisci timer precedenti
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];

    let elapsed = 0;
    unique.forEach((idx, i) => {
      elapsed += intervals[i];
      const t = setTimeout(() => {
        setSpotlightIndex(idx);
        if (useGameStore.getState().sound.sfxEnabled) playSpinTick();
      }, elapsed);
      timersRef.current.push(t);
    });

    // atterraggio sul target + CHARGE UP (animazione epica pre-flip)
    const landDelay = elapsed + 60;
    const landT = setTimeout(() => {
      if (useGameStore.getState().sound.sfxEnabled) playLand();
      // attiva la fase di "charge up" sulla card bersaglio
      setIsCharging(true);
    }, landDelay);
    timersRef.current.push(landT);

    // flip: dopo che il charge up è completato (0.6s)
    const flipDelay = landDelay + 600;
    const flipT = setTimeout(() => {
      // fine charge up, ora parte il flip
      setIsCharging(false);
      if (useGameStore.getState().sound.sfxEnabled) playFlip();
    }, flipDelay);
    timersRef.current.push(flipT);

    // finalize: dopo che il flip è "visualmente partito" ma la card è ancora
    // in animazione, chiamiamo finalizeReveal per aggiornare lo stato.
    const finalizeDelay = flipDelay + 350;
    const finalT = setTimeout(() => {
      const st = useGameStore.getState();
      const targetCard = st.cards.find((c) => c.id === spinTargetId);
      if (targetCard) {
        st.finalizeReveal(targetCard.id);
        const stAfter = useGameStore.getState();
        const newWin = stAfter.lastWin; // null se nessuna vincita questo turno

        // POPUP SIMBOLO (se la card aveva un simbolo)
        if (targetCard.symbol && st.sound.sfxEnabled) {
          setTimeout(() => playSymbol(), 400);
          setTimeout(() => {
            setSymbolPopup({
              kind: targetCard.symbol!,
              cardNumber: targetCard.number,
              colorName: targetCard.color.name,
            });
          }, 500);
        }

        // SEQUENZA VOCE:
        // 1) numero + colore (sempre, per primo)
        // 2) tipo di vincita (se ambo/terna/..., dopo il numero)
        // 3) simbolo bonus (se presente, dopo la vincita)
        if (st.sound.voiceEnabled && isVoiceSupported()) {
          // (1) numero + colore
          setTimeout(() => {
            speak(`Numero ${targetCard.number}: ${targetCard.color.name}!`, {
              interrupt: true,
            });
          }, 400);

          // (2) vincita — dopo che il numero+colore è stato detto
          if (newWin) {
            const player = stAfter.config?.players.find(
              (p) => p.color.key === newWin.color.key,
            );
            const subject = player?.name
              ? `${player.name}`
              : `Il ${newWin.color.name}`;
            const winPhrase =
              newWin.level === "tombola"
                ? `${subject} ha fatto TOMBOLA! Che leggenda!`
                : `${subject} ha fatto ${WIN_LABELS[newWin.level]}!`;
            setTimeout(() => {
              speak(winPhrase, { interrupt: false });
            }, 2200);

            // (3) simbolo — dopo la vincita
            if (targetCard.symbol) {
              const symPhrase =
                targetCard.symbol === "cambioGiro"
                  ? `Evviva! ${targetCard.color.name} ha trovato Cambio giro!`
                  : `Complimenti! ${targetCard.color.name} ha trovato Copri 2!`;
              setTimeout(() => {
                speak(symPhrase, { interrupt: false });
              }, 4400);
            }
          } else if (targetCard.symbol) {
            // nessuna vincita ma c'è il simbolo → dopo il numero+colore
            const symPhrase =
              targetCard.symbol === "cambioGiro"
                ? `Evviva! ${targetCard.color.name} ha trovato Cambio giro!`
                : `Complimenti! ${targetCard.color.name} ha trovato Copri 2!`;
            setTimeout(() => {
              speak(symPhrase, { interrupt: false });
            }, 2200);
          }
        }
      }
      setSpotlightIndex(null);
    }, finalizeDelay);
    timersRef.current.push(finalT);

    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];
    };
  }, [isSpinning, spinTargetId]);

  // handler submit numero
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const n = parseInt(inputValue, 10);
      if (Number.isNaN(n)) return;
      callNumber(n);
      setInputValue("");
      if (sound.sfxEnabled) playClick();
    },
    [inputValue, callNumber, sound.sfxEnabled],
  );

  // handler click su card (per modalità bonus)
  const handleCardClick = useCallback(
    (card: CardType) => {
      if (changeColorMode) {
        setPendingChangeColorCardId(card.id);
        if (sound.sfxEnabled) playClick();
      } else if (copri2Mode) {
        const prevAvailable = useGameStore.getState().copri2Available;
        applyCopri2(card.id);
        if (sound.sfxEnabled) playSymbol();
        // resta in modalità copri2 finché ci sono coperture disponibili;
        // altrimenti esci dalla modalità
        if (prevAvailable - 1 <= 0) {
          setCopri2Mode(false);
        }
      }
    },
    [changeColorMode, copri2Mode, applyCopri2, sound.sfxEnabled],
  );

  if (!config) return null;

  const cols = getGridColumns(cards.length);

  // ultimo numero chiamato
  const lastCalled =
    calledNumbers.length > 0 ? calledNumbers[calledNumbers.length - 1] : null;

  return (
    <div className="min-h-screen flex flex-col">
      <GameHeader onOpenRecap={() => setRecapOpen(true)} />

      <main className="flex-1 flex flex-col px-3 sm:px-4 py-2 gap-2 min-h-0">
        {/* PRIMO DIV: stato + input numerico + bonus (ex-footer inglobato qui) */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              {lastCalled !== null ? (
                <div className="arcade-panel rounded-lg px-3 py-1.5 flex items-center gap-2">
                  <span className="font-arcade text-base text-muted-foreground">
                    Ultimo:
                  </span>
                  <span className="font-display text-xl neon-gold">
                    {lastCalled}
                  </span>
                </div>
              ) : (
                <div className="arcade-panel rounded-lg px-3 py-1.5">
                  <span className="font-arcade text-lg text-muted-foreground">
                    Inserisci il primo numero!
                  </span>
                </div>
              )}
              {isSpinning && (
                <span className="font-display text-sm neon-cyan blink">
                  ESTRAZIONE...
                </span>
              )}
            </div>

            {/* INPUT NUMERICO (spostato dal footer) */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="number"
                min={1}
                max={config.totalCards}
                inputMode="numeric"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="N°"
                disabled={isSpinning}
                autoFocus
                className="input-arcade w-28 sm:w-36 py-2.5 px-3 rounded-lg text-xl"
              />
              <button
                type="submit"
                disabled={isSpinning || !inputValue}
                className="btn-arcade-lime px-5 py-2.5 rounded-lg text-xs sm:text-sm"
              >
                GIRA!
              </button>
            </form>
          </div>

          <BonusBar
            changeColorMode={changeColorMode}
            setChangeColorMode={setChangeColorMode}
            copri2Mode={copri2Mode}
            setCopri2Mode={setCopri2Mode}
            pendingChangeColorCardId={pendingChangeColorCardId}
            setPendingChangeColorCardId={setPendingChangeColorCardId}
          />
        </div>

        {/* GRIGLIA CARTE */}
        <div className="flex-1 flex items-center justify-center min-h-0">
          <div
            className="grid gap-1.5 sm:gap-2 w-full h-full max-w-[1500px] mx-auto"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            }}
          >
            {cards.map((card, idx) => (
              <Card
                key={card.id}
                card={card}
                myIndex={idx}
                isTarget={spinTargetId === card.id}
                isCharging={isCharging && spinTargetId === card.id}
                isSpinning={isSpinning}
                spotlightIndex={spotlightIndex}
                changeColorMode={changeColorMode}
                copri2Mode={copri2Mode}
                onCardClick={handleCardClick}
              />
            ))}
          </div>
        </div>
      </main>

      {/* MODALI */}
      <WinModal />
      <ErrorModal />
      <RecapModal open={recapOpen} onOpenChange={setRecapOpen} />

      {/* POPUP SIMBOLO */}
      <AnimatePresence>
        {symbolPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
            onClick={() => setSymbolPopup(null)}
          >
            <motion.div
              initial={{ y: -40, scale: 0.8, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: -40, scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="arcade-panel rounded-xl px-5 py-4 flex items-center gap-3 max-w-sm"
              style={{
                borderColor:
                  symbolPopup.kind === "cambioGiro"
                    ? "var(--arcade-cyan)"
                    : "var(--arcade-gold)",
                boxShadow: `0 0 32px ${
                  symbolPopup.kind === "cambioGiro"
                    ? "rgba(0,240,255,0.5)"
                    : "rgba(255,214,10,0.5)"
                }`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="shrink-0">
                {symbolPopup.kind === "cambioGiro" ? (
                  <Repeat className="w-8 h-8 neon-cyan" />
                ) : (
                  <ShieldX className="w-8 h-8 neon-gold" />
                )}
              </div>
              <div className="min-w-0">
                <div
                  className={`font-display text-xs ${
                    symbolPopup.kind === "cambioGiro"
                      ? "neon-cyan"
                      : "neon-gold"
                  }`}
                >
                  {symbolPopup.kind === "cambioGiro"
                    ? "CAMBIO GIRO!"
                    : "COPRI 2!"}
                </div>
                <div className="font-arcade text-sm text-foreground mt-0.5">
                  Carta {symbolPopup.cardNumber} ({symbolPopup.colorName})
                </div>
                <div className="font-arcade text-xs text-muted-foreground mt-1">
                  {symbolPopup.kind === "cambioGiro"
                    ? "Ricevi una carta fisica da usare quando vuoi!"
                    : "Ora puoi coprire 2 card: tornano allo stato iniziale (numero visibile e riselezionabile)."}
                </div>
              </div>
              <button
                onClick={() => setSymbolPopup(null)}
                className="shrink-0 p-1.5 rounded-full bg-black/40 hover:bg-black/70"
                aria-label="Chiudi"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Re-export per evitare warning unused
export { Sparkles };
