"use client";

import { useState, useEffect } from "react";
import { useGameStore } from "@/hooks/game/useGameStore";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  RotateCcw,
  Maximize,
  Minimize,
  Music,
  Music2,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Home,
} from "lucide-react";
import { startMusic, stopMusic, isMusicPlaying } from "@/lib/sound/audio";

interface GameHeaderProps {
  onOpenRecap: () => void;
}

export function GameHeader({ onOpenRecap }: GameHeaderProps) {
  const newGame = useGameStore((s) => s.newGame);
  const resetAll = useGameStore((s) => s.resetAll);
  const sound = useGameStore((s) => s.sound);
  const toggleMusic = useGameStore((s) => s.toggleMusic);
  const toggleVoice = useGameStore((s) => s.toggleVoice);
  const toggleSfx = useGameStore((s) => s.toggleSfx);
  const config = useGameStore((s) => s.config);
  const calledCount = useGameStore((s) => s.calledNumbers.length);

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFsChange = () =>
      setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // sync musica con store
  useEffect(() => {
    if (sound.musicEnabled) {
      startMusic();
    } else {
      stopMusic();
    }
  }, [sound.musicEnabled]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const handleNewGame = () => {
    if (confirm("Iniziare una NUOVA partita con gli stessi giocatori? I progressi attuali saranno persi.")) {
      newGame();
    }
  };

  const handleExit = () => {
    if (confirm("Uscire e tornare al setup? La partita corrente verrà persa.")) {
      resetAll();
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(255,45,149,0.3)] bg-[rgba(10,10,18,0.85)] backdrop-blur-md">
      <div className="px-3 sm:px-4 py-2 flex items-center justify-between gap-2 flex-wrap">
        {/* LOGO */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={handleExit}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            title="Torna al setup"
          >
            <Home className="w-4 h-4 neon-pink" />
          </button>
          <div className="min-w-0">
            <div className="font-display text-sm sm:text-base neon-pink truncate">
              TOMBOLA COLORATA
            </div>
            {config && (
              <div className="font-arcade text-sm text-muted-foreground -mt-0.5">
                {config.playerCount} gioc ·{" "}
                {calledCount}/
                {config.totalCards} numeri
              </div>
            )}
          </div>
        </div>

        {/* CONTROLLI */}
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          <IconButton
            onClick={onOpenRecap}
            title="Recap vincite"
            active={false}
          >
            <BarChart3 className="w-4 h-4" />
          </IconButton>

          <IconButton
            onClick={toggleSfx}
            title={sound.sfxEnabled ? "Disabilita effetti" : "Abilita effetti"}
            active={sound.sfxEnabled}
          >
            {sound.sfxEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </IconButton>

          <IconButton
            onClick={toggleMusic}
            title={sound.musicEnabled ? "Ferma musica" : "Avvia musica"}
            active={sound.musicEnabled}
          >
            {sound.musicEnabled ? (
              <Music2 className="w-4 h-4" />
            ) : (
              <Music className="w-4 h-4" />
            )}
          </IconButton>

          <IconButton
            onClick={toggleVoice}
            title={sound.voiceEnabled ? "Disabilita voce" : "Abilita voce"}
            active={sound.voiceEnabled}
          >
            {sound.voiceEnabled ? (
              <Mic className="w-4 h-4" />
            ) : (
              <MicOff className="w-4 h-4" />
            )}
          </IconButton>

          <IconButton
            onClick={toggleFullscreen}
            title={isFullscreen ? "Esci da fullscreen" : "Schermo intero"}
            active={isFullscreen}
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
          </IconButton>

          <IconButton
            onClick={handleNewGame}
            title="Nuova partita (stessi giocatori)"
            active={false}
          >
            <RotateCcw className="w-4 h-4" />
          </IconButton>
        </div>
      </div>
    </header>
  );
}

function IconButton({
  children,
  onClick,
  title,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  active: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        "p-2 rounded-lg border transition-all",
        active
          ? "border-[var(--arcade-lime)] bg-[rgba(57,255,20,0.12)] neon-lime"
          : "border-border bg-black/30 text-muted-foreground hover:text-foreground hover:border-[var(--arcade-pink)]/50",
      )}
    >
      {children}
    </button>
  );
}
