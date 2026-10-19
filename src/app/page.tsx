"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/hooks/game/useGameStore";
import { applyThemeVars } from "@/lib/game/constants";
import { SetupScreen } from "@/components/game/SetupScreen";
import { GameScreen } from "@/components/game/GameScreen";

export default function Home() {
  const phase = useGameStore((s) => s.phase);
  const config = useGameStore((s) => s.config);
  const hydrated = useGameStore((s) => s._hydrated);
  const [mounted, setMounted] = useState(false);

  // evita hydration mismatch: il server non vede localStorage
  // pattern standard per Next.js + zustand persist
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // applica il tema salvato in config su <html> (variabili CSS via JS,
  // immune al minifier di Tailwind 4 / Lightning CSS)
  useEffect(() => {
    const themeId = config?.themeId ?? "arcadeScuro";
    document.documentElement.dataset.theme = themeId;
    applyThemeVars(themeId);
  }, [config?.themeId]);

  // prima del mount lato client, mostriamo setup (default server)
  if (!mounted) {
    return <SetupScreen />;
  }

  // se lo store non ha ancora idratato (raro ma possibile), fallback setup
  if (!hydrated) {
    return <SetupScreen />;
  }

  if (phase === "playing" && config) {
    return <GameScreen />;
  }
  return <SetupScreen />;
}
