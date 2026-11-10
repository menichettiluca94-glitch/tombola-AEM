"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/hooks/game/useGameStore";
import { applyThemeVars } from "@/lib/game/constants";
import { SMORFIA } from "@/lib/game/smorfia";
import { SetupScreen } from "@/components/game/SetupScreen";
import { GameScreen } from "@/components/game/GameScreen";
import { EditScreen } from "@/components/game/EditScreen";

export default function Home() {
  const phase = useGameStore((s) => s.phase);
  const config = useGameStore((s) => s.config);
  const hydrated = useGameStore((s) => s._hydrated);
  const [mounted, setMounted] = useState(false);

  const [currentView, setCurrentView] = useState<"setup" | "edit">("setup");

  // STATO PERSISTENTE CON LOCALSTORAGE: Legge dal browser se esiste, altrimenti usa la base
  const [smorfiaList, setSmorfiaList] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("smorfia_custom_list");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // Se il JSON è corrotto, ignora e usa il default
        }
      }
    }
    return SMORFIA;
  });

  // Salva automaticamente nel localStorage ogni volta che la lista viene modificata
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("smorfia_custom_list", JSON.stringify(smorfiaList));
    }
  }, [smorfiaList]);

  // Evita hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Applica il tema salvato in config su <html>
  useEffect(() => {
    const themeId = config?.themeId ?? "arcadeScuro";
    document.documentElement.dataset.theme = themeId;
    applyThemeVars(themeId);
  }, [config?.themeId]);

  if (!mounted || !hydrated) {
    return <SetupScreen onNavigateToEdit={() => setCurrentView("edit")} />;
  }

  if (currentView === "edit") {
    return (
      <EditScreen
        smorfiaList={smorfiaList}
        setSmorfiaList={setSmorfiaList}
        onBack={() => setCurrentView("setup")}
      />
    );
  }

  if (phase === "playing" && config) {
    return <GameScreen />;
  }

  return <SetupScreen onNavigateToEdit={() => setCurrentView("edit")} />;
}