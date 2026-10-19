"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/hooks/game/useGameStore";
import { isVoiceSupported, speak } from "@/lib/sound/voice";
import { X, AlertTriangle } from "lucide-react";
import { useEffect } from "react";

export function ErrorModal() {
  const error = useGameStore((s) => s.error);
  const dismiss = useGameStore((s) => s.dismissError);
  const sound = useGameStore((s) => s.sound);

  // Annuncia il messaggio di presa in giro via voce (se abilitata).
  // Non c'e' auto-dismiss: l'utente deve cliccare per chiudere.
  useEffect(() => {
    if (error && sound.voiceEnabled && isVoiceSupported()) {
      speak(error, { interrupt: true });
    }
  }, [error, sound.voiceEnabled]);

  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={dismiss}
        >
          <motion.div
            initial={{ scale: 0.5, rotate: -6, y: 30, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, y: 0, opacity: 1 }}
            exit={{ scale: 0.5, y: 30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 16 }}
            className="relative arcade-panel rounded-2xl p-6 sm:p-8 max-w-md w-full text-center"
            style={{
              borderColor: "var(--arcade-gold)",
              boxShadow:
                "0 0 40px rgba(255,214,10,0.5), 0 0 80px rgba(255,214,10,0.3)",
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

            <motion.div
              initial={{ rotate: -20 }}
              animate={{ rotate: [-20, 20, -20, 20, 0] }}
              transition={{ duration: 0.6 }}
              className="mx-auto mb-4 w-16 h-16 rounded-full bg-[rgba(255,214,10,0.15)] border-2 border-[var(--arcade-gold)] flex items-center justify-center"
            >
              <AlertTriangle className="w-8 h-8 neon-gold" />
            </motion.div>

            <div className="font-display text-sm sm:text-base neon-gold mb-3">
              NUMERO GIÀ USCITO!
            </div>
            <p className="font-arcade text-lg sm:text-xl text-foreground leading-snug">
              {error}
            </p>
            <button
              onClick={dismiss}
              className="btn-arcade mt-6 px-6 py-2.5 rounded-lg text-xs"
            >
              HO CAPITO, SCEGLIO UN ALTRO
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
