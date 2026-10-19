# 🎰 Tombola Colorata — Istruzioni

Benvenuto in **Tombola Colorata**, il gioco di tombola a colori con tema arcade neon, audio chiptune e voce sintetica!

---

## 🚀 Avvio rapido

### Prerequisiti

- [**Node.js**](https://nodejs.org/) ≥ 20
- [**Bun**](https://bun.sh/) (consigliato) oppure npm/yarn

### Installazione

Decomprimi lo ZIP in una cartella, entra nel progetto e installa le dipendenze:

```bash
cd tombola-colorata
bun install
```

> Se non hai Bun, puoi usare `npm install` o `yarn install`.

### Avvio del gioco

```bash
bun run dev
```

Apri il browser su **http://localhost:3000**

> ⚠️ Il primo click sulla pagina è necessario per sbloccare l'audio (limito dei browser). Dopo il primo gesto, suoni e voce funzioneranno.

---

## 🎮 Come si gioca

1. **Setup**: il banditore sceglie il tema, il numero di giocatori (2-10) e opzionalmente i nomi dei partecipanti.
2. **Avvio**: clicca "AVVIA LA TOMBOLA!". Si genera il tabellone.
3. **Turno**: ogni giocatore dice ad alta voce un numero libero. Il banditore lo digita nell'input in basso e clicca "GIRA!".
4. **Animazione**: la tabella scorre illuminando le caselle e si ferma su quella detta, che si gira mostrando il colore nascosto.
5. **Vincite**: quando 2/3/4/5 card dello stesso colore sono scoperte, appare una modale (Ambo/Terna/Quaterna/Cinquina). Se tutte le card di un colore sono scoperte: **TOMBOLA!**

### Colori (assegnati in ordine fisso)

| # | Colore | Hex |
|---|---|---|
| 1 | Rosso | #E53935 |
| 2 | Blu | #1E88E5 |
| 3 | Giallo | #FDD835 |
| 4 | Verde | #43A047 |
| 5 | Azzurro | #4FC3F7 |
| 6 | Arancione | #FB8C00 |
| 7 | Grigio grafite | #424242 |
| 8 | Viola | #8E24AA |
| 9 | Magenta | #D81B60 |
| 10 | Verde | #26A69A |

### Distribuzione card

| Giocatori | Card per colore | Totale |
|---|---|---|
| 2 | 20 | 40 |
| 3 | 20 | 60 |
| 4 | 20 | 80 |
| 5 | 14 | 70 |
| 6 | 10 | 60 |
| 7 | 10 | 70 |
| 8 | 10 | 80 |
| 9 | 10 | 90 |
| 10 | 8 | 80 |

---

## 🎯 Bonus

- **RANDOM** 🎲: se un giocatore non sa che numero dire, il software ne sceglie uno libero a caso.
- **CAMBIA COLORE** 🔀: clicca una card scoperta per scambiare il suo colore con quello di una card coperta di un altro colore. Appare un menu a tendina per scegliere il colore.
- **COPRI 2** 🛡️: ogni volta che si trova il simbolo "Copri 2" su una card, si guadagna una copertura. Attivando il bonus e cliccando una card scoperta, la si copre (escludendola dai conteggi vincite).
- **CAMBIO GIRO** 🔁: simbolo fisico. Il giocatore che lo trova riceve una carta da usare a tavolo quando vuole (regola non gestita dal software).

---

## 🎛️ Controlli header

- **Recap** (istogramma): stato scoperta per colore + numeri detti.
- **Sfx on/off**: effetti sonori.
- **Musica on/off**: musica chiptune di sottofondo.
- **Voce on/off**: voce sintetica italiana che annuncia vincite.
- **Fullscreen**: schermo intero.
- **Nuova partita**: ricomincia con gli stessi giocatori.
- **Home**: torna al setup (perde la partita corrente).

---

## ⌨️ Comandi rapidi

- **Invio** nell'input numerico: gira la card.
- L'input accetta numeri da `1` a `N` (dove N è il totale card della partita).

---

## 💾 Persistenza

La partita viene salvata automaticamente in `localStorage`. Se chiudi e riapri il browser, lo stato è preservato. Per ricominciare da zero: "Home" → nuovo setup.

---

## 🛠️ Personalizzazione

- **Messaggi di presa in giro**: edita `src/lib/game/mockery.ts`.
- **Colori**: edita `src/lib/game/constants.ts` → `GAME_COLORS`.
- **Distribuzione card**: edita `DISTRIBUTION` nello stesso file.
- **Temi**: aggiungi entry in `THEMES` (vedi `SPECIFICHE_TECNICHE.md` sezione 8).
- **Audio**: aggiungi funzioni in `src/lib/sound/audio.ts`.

---

## 🐛 Troubleshooting

| Problema | Soluzione |
|---|---|
| Non sento audio | Clicca una volta sulla pagina (sblocco autoplay). Verifica icone sfx/musica accese. |
| La voce non parla | Verifica che il browser supporti `speechSynthesis` (Chrome, Edge, Safari sì). Attiva "Voce on". |
| Pagina bianca | Apri la console del browser (F12). Se vedi errori, controlla `dev.log` in fondo al progetto. |
| Lint fallisce | Esegui `bun run lint` e correggi gli errori segnalati. |
| Cambia porta | Il dev server è fisso su 3000. Per cambiarla edita `package.json` → `"dev": "next dev -p PORTA"`. |

---

## 📁 File importanti

- `SPECIFICHE_TECNICHE.md` — specifiche complete (architettura, dominio, animazioni, audio).
- `PROMPT_AVVIO.md` — prompt da inviare a un'IA per nuove feature/fix.
- `src/lib/game/mockery.ts` — i 20 messaggi di presa in giro (modificabili).
- `dev.log` — log del server di sviluppo.

---

## 🧪 Sviluppo

```bash
bun run dev      # avvia in dev mode (hot reload)
bun run lint     # check qualità codice (deve passare con 0 errori)
```

**Non usare `bun run build`** durante lo sviluppo.

---

Buon divertimento! 🎉 Se trovi bug o vuoi aggiungere feature, usa `PROMPT_AVVIO.md` con la tua IA preferita.
