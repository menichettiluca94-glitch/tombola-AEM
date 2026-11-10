"use client";
import { useState, useRef } from "react";
import { useGameStore } from "@/hooks/game/useGameStore";
import { Pencil, Check, X, ArrowLeft, Search } from "lucide-react";

interface EditScreenProps {
  onBack: () => void;
}

export function EditScreen({ onBack }: EditScreenProps) {
  // Preleviamo la lista e la funzione di aggiornamento direttamente dallo store globale
  const smorfiaList = useGameStore((s: any) => s.smorfiaList);
  const updateSmorfiaItem = useGameStore((s: any) => s.updateSmorfiaItem);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [tempSignificato, setTempSignificato] = useState("");
  const [tempDescrizione, setTempDescrizione] = useState("");
  const [searchNumber, setSearchNumber] = useState("");

  const rowRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Rumorino di tick durante lo scorrimento
  const playArcadeTick = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.04);
    } catch {
      // Ignora errori se il browser blocca l'audio
    }
  };

  // "Ting" secco e cristallino all'arrivo sulla riga
  const playTingSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch {
      // Ignora errori audio
    }
  };

  const handleStartEdit = (id: number, significato: string, descrizione: string) => {
    setEditingId(id);
    setTempSignificato(significato);
    setTempDescrizione(descrizione);
  };

  const handleSave = (id: number) => {
    // Salva nello store globale (e di conseguenza nel localStorage)
    updateSmorfiaItem(id, tempSignificato, tempDescrizione);
    setEditingId(null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(searchNumber);

    if (num >= 1 && num <= 90 && rowRefs.current[num]) {
      // 1. Ticker durante lo scorrimento
      let count = 0;
      const interval = setInterval(() => {
        playArcadeTick();
        count++;
        if (count >= 7) {
          clearInterval(interval);
        }
      }, 100);

      // 2. Scorrimento fluido alla riga
      rowRefs.current[num]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      // 3. Ascoltiamo l'evento di fine scroll nativo del contenitore
      const container = containerRef.current;
      if (container) {
        const handleScrollEnd = () => {
          playTingSound();
          const item = smorfiaList[num];
          if (item) {
            handleStartEdit(num, item.significato, item.descrizione);
          }
          // Rimuoviamo il listener per evitare esecuzioni multiple
          container.removeEventListener("scrollend", handleScrollEnd);
        };

        container.addEventListener("scrollend", handleScrollEnd, { once: true });
      }
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen px-5 sm:px-20 md:px-24 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between w-full mb-6 gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-display text-sm cursor-pointer self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" /> Torna al Gioco
        </button>

        <h2 className="font-display text-lg sm:text-xl text-cyan-300">
          Editor Smorfia
        </h2>

        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex items-center w-full sm:w-48">
            <Search className="absolute left-3 w-4 h-4 text-cyan-400" />
            <input
              type="number"
              min="1"
              max="90"
              placeholder="Cerca numero..."
              value={searchNumber}
              onChange={(e) => setSearchNumber(e.target.value)}
              className="bg-gray-900 border border-cyan-500/40 rounded-lg pl-9 pr-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-400 w-full"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 font-display text-xs border border-cyan-500/30 cursor-pointer"
          >
            Vai
          </button>
        </form>
      </div>

      {/* Lista */}
      <div
        ref={containerRef}
        className="w-full space-y-3 max-h-[80vh] overflow-y-auto pr-2"
      >
        {Object.entries(smorfiaList).map(([key, item]: [string, any]) => {
          const numId = Number(key);
          const isBeingEdited = editingId === numId;

          return (
            <div
              key={numId}
              ref={(el) => { rowRefs.current[numId] = el; }}
              className="flex items-center gap-3 w-full scroll-mt-24"
            >
              {/* RIQUADRO 1: Numero */}
              <div className="arcade-panel rounded-xl p-4 flex items-center justify-center border border-cyan-500/30 bg-gray-900/50 w-16 h-full shrink-0">
                <span className="font-display text-lg text-cyan-400">
                  {numId}
                </span>
              </div>

              {/* RIQUADRO 2: Contenuto */}
              <div className="arcade-panel rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-gray-800 bg-gray-900/50 flex-1 min-w-0">
                {isBeingEdited ? (
                  <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full min-w-0">
                    <input
                      type="text"
                      value={tempSignificato}
                      onChange={(e) => setTempSignificato(e.target.value)}
                      className="bg-gray-800 border border-cyan-500/50 rounded px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-400 flex-1 min-w-0"
                      placeholder="Significato..."
                    />
                    <input
                      type="text"
                      value={tempDescrizione}
                      onChange={(e) => setTempDescrizione(e.target.value)}
                      className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-base text-gray-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 flex-1 min-w-0 font-medium"
                      placeholder="Descrizione..."
                    />
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between flex-1 gap-4 min-w-0">
                    <span className="font-display text-xs sm:text-sm text-cyan-300 leading-snug flex-1 min-w-0 break-words">
                      {item.significato}
                    </span>
                    <span className="font-arcade text-base sm:text-lg text-gray-100 flex-1 min-w-0 break-words font-medium tracking-wide">
                      {item.descrizione}
                    </span>
                  </div>
                )}

                {/* Bottoni */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {isBeingEdited ? (
                    <>
                      <button
                        onClick={() => handleSave(numId)}
                        className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors cursor-pointer"
                        title="Salva"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-2 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors cursor-pointer"
                        title="Annulla"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleStartEdit(numId, item.significato, item.descrizione)}
                      className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors border border-cyan-500/20 cursor-pointer"
                      title="Modifica riga"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}