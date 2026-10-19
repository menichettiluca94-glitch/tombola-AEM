// 20 messaggi di presa in giro quando un giocatore dice un numero già uscito.
// Scelti per essere simpatici e leggermente pungenti, ma mai offensivi.
// L'utente ha richiesto di scriverli in autonomia; potrà poi modificarli qui.

export const MOCKERY_MESSAGES: string[] = [
  "Ehi, quel numero è già stato scelto, mettiti un paio di occhiali!",
  "Ottima scelta! Peccato che qualcuno con più riflessi l’abbia già fatta.",
  "Quel numero è già volato via, proprio come le tue speranze.",
  "Quel numero è già stato chiamato... stai sognando ad occhi aperti?",
  "Ah, vuoi quel numero? Perfetto. Peccato, è già stato scelto.",
  "Quel numero non c’è più. È stato scelto, celebrato e archiviato.",
  "è stato detto lo stesso numero due volte... memoria da elefante rotta?",
  "Quel numero è già in pensione, cercane uno nuovo!",
  "Quel numero è fuori servizio. Prova con uno disponibile.",
  "Numero esaurito. Come la pazienza di chi te l’ha già chiesto.",
  "Prenotato. E no, non puoi fare overbooking.",
  "Già detto! La tombola non si vince con il copia-incolla.",
  "Stop! Quel numero è già stato strappato dalla lista.",
  "Sei sicuro di non stare leggendo il tabellone al contrario?",
  "Il numero è già uscito: il banditore è triste. Non far piangere il banditore.",
  "Sì, ottima scelta. Peccato che sia già stata fatta da qualcuno più sveglio.",
  "Numero già chiamato! Sveglia, stiamo giocando a Tombola!",
  "Colpo di scena: il numero era già uscito. Trama da soap opera."
];

/** Restituisce un messaggio casuale dalla lista. */
export function randomMockeryMessage(): string {
  return MOCKERY_MESSAGES[Math.floor(Math.random() * MOCKERY_MESSAGES.length)];
}
