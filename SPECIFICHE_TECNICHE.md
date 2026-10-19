# 🎰 Tombola Colorata — Specifiche Tecniche

> Versione: 1.0.0 · Tema: Arcade Scuro · Stack: Next.js 16 + TypeScript

## 1. Panoramica del progetto

**Tombola Colorata** è un gioco da sala multiplayer (pass-and-play con un banditore unico al computer) dove ogni giocatore è associato a un colore. Una griglia a card nasconde, dietro ogni numero, uno dei colori in gioco. Il banditore digita i numeri detti dai giocatori e la tabella li rivela con un'animazione. Si vincono ambo, terna, quaterna, cinquina e tombola in base a quanti colori uguali vengono scoperti.

**Obiettivo non funzionale**: essere il gioco di tombola più divertente del secolo, con audio chiptune, voce sintetica e animazioni arcade neon.

---

## 2. Stack tecnologico

| Layer | Tecnologia | Versione |
|---|---|---|
| Framework | Next.js (App Router, Turbopack) | 16.x |
| Linguaggio | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| UI kit | shadcn/ui (New York) + Lucide icons | — |
| Animazioni | Framer Motion | 12.x |
| State | Zustand (+ middleware `persist`) | 5.x |
| Audio | Web Audio API (nativo, no dipendenze) | — |
| Voce | Web Speech API (nativa, no dipendenze) | — |
| Font | Press Start 2P + VT323 (Google Fonts via `next/font`) | — |

**Nessun database** è richiesto: la partita è persistita in `localStorage`. Prisma è presente nello scaffold ma non utilizzato in questo gioco.

---

## 3. Architettura

```
┌─────────────────────────────────────────────────────────┐
│                    src/app/page.tsx                     │
│   (routing tra SetupScreen e GameScreen in base a      │
│    phase, con hydration-safe guard via `mounted` e     │
│    `_hydrated` flag dello store persistente)            │
└────────────┬──────────────────────────┬─────────────────┘
             │                          │
   ┌─────────▼──────────┐    ┌──────────▼──────────┐
   │   SetupScreen.tsx  │    │   GameScreen.tsx    │
   │  (tema, n° gioc,   │    │  (griglia, input,   │
   │   toggle nomi,     │    │   animazioni, bonus,│
   │   anteprima colori)│    │   header, modali)   │
   └────────────────────┘    └──────────┬──────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
            ┌───────▼───────┐   ┌───────▼───────┐   ┌───────▼───────┐
            │   Card.tsx    │   │ GameHeader.tsx│   │  BonusBar.tsx │
            │ (flip 3D,     │   │ (recap, full- │   │ (random,      │
            │  spotlight,   │   │  screen, sfx, │   │  change color,│
            │  simboli)     │   │  music, voice) │   │  copri 2,     │
            └───────────────┘   └───────────────┘   │  cambio giro) │
                                                    └───────────────┘
                    ┌───────────────────┐
                    │  Modali:          │
                    │  - WinModal       │
                    │  - ErrorModal     │
                    │  - RecapModal     │
                    │  - Symbol popup   │
                    └───────────────────┘
```

### 3.1 State management

Tutto lo stato di gioco vive in un unico store Zustand persistente: **`src/hooks/game/useGameStore.ts`**.

Stato persistito (in `localStorage`, chiave `tombola-colorata-v1`):
- `phase` (`"setup" | "playing" | "finished"`)
- `config` (numero giocatori, tema, nomi, totale card)
- `cards` (array completo: numero, colore nascosto, simbolo, revealed, covered)
- `calledNumbers`
- `wins` (eventi di vincita storici)
- `copri2Available`, `cambioGiroAvailable`
- `sound` (toggle sfx/music/voice)

Stato **non persistito** (transitorio):
- `error`, `lastWin`, `isSpinning`, `spinTargetId`
- `_hydrated` (flag per hydration-safe rendering)

**Pattern di idratazione**: `page.tsx` usa `mounted` + `_hydrated` per evitare mismatch SSR/client. Il server renderizza sempre il Setup; il client idrata poi lo stato reale.

---

## 4. Dominio di gioco

### 4.1 Colori (ordine fisso)

Definiti in `src/lib/game/constants.ts` → `GAME_COLORS`:

| # | Nome | Hex | Assegnato a |
|---|---|---|---|
| 1 | Rosso | `#E53935` | Giocatore 1 |
| 2 | Blu | `#1E88E5` | Giocatore 2 |
| 3 | Giallo | `#FDD835` | Giocatore 3 |
| 4 | Verde | `#43A047` | Giocatore 4 |
| 5 | Azzurro | `#4FC3F7` | Giocatore 5 |
| 6 | Arancione | `#FB8C00` | Giocatore 6 |
| 7 | Grigio grafite | `#424242` | Giocatore 7 |
| 8 | Viola | `#8E24AA` | Giocatore 8 |
| 9 | Magenta | `#D81B60` | Giocatore 9 |
| 10 | Verde (acqua) | `#26A69A` | Giocatore 10 |

> **Nota**: l'utente ha fornito 2 colori verdi ("Verde" #43A047 e "Verde" #26A69A). Per evitare ambiguità nelle label interne sono stati chiamati `verde` e `verdeAcqua`, ma **il nome visualizzato è sempre "Verde"** per entrambi, come da specifica. Il colore esatto è identificato dal `key`/`hex`.

### 4.2 Distribuzione card per numero di giocatori

| Giocatori | Card per colore | Totale card |
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

Tabella in `DISTRIBUTION` (constants.ts). Funzione `getDistribution(n)` solleva eccezione per `n` non supportato.

### 4.3 Generazione del mazzo (`createDeck` in distribution.ts)

1. Crea una pool di colori: per ogni colore attivo, `cardsPerColor` entry.
2. **Mescola** Fisher-Yates la pool → il colore nascosto dietro ogni numero è casuale.
3. Assegna numeri **1..N in ordine** (i numeri visibili sono progressivi, come da specifica).
4. **Simboli bonus**: ~12% delle card (`SYMBOL_RATE = 0.12`) riceve casualmente `cambioGiro` o `copri2` (50/50). Minimo 2 card con simbolo.

### 4.4 Livelli di vincita

Rilevati in `detectWin(cards, color, alreadyWonLevels)`:

| Livello | Soglia (card di quel colore scoperte) |
|---|---|
| Ambo | 2 |
| Terna | 3 |
| Quaterna | 4 |
| Cinquina | 5 |
| Tombola | tutte le card del colore |

Le card coperte dal bonus "Copri 2" sono **escluse** dal conteggio (`covered = true` → `countRevealedForColor` le filtra). Questo significa che coprire una card può far "regredire" virtualmente una soglia già raggiunta, ma il livello è già stato registrato in `wins` e non viene rimosso: si evitano doppi annunci grazie al check `alreadyWonLevels`.

### 4.5 Griglia

Numero di colonne calcolato in `getGridColumns(total)`:
- ≤40 → 8 colonne
- ≤60 → 10 colonne
- ≤70 → 10 colonne
- ≤80 → 10 colonne
- ≤90 → 10 colonne

Le righe sono implicitamente `Math.ceil(total / cols)`. La griglia è full-screen, responsiva, `aspect-square` per ogni card.

---

## 5. Bonus

### 5.1 Random
Pulsante che chiama `pickRandom()` → `pickRandomAvailableNumber(cards)` → restituisce un numero di card non rivelata e non coperta. Delega poi a `callNumber(n)` come se fosse un numero normale.

### 5.2 Cambia colore
- Attivabile con pulsante toggle. Entra in modalità "change color".
- Il banditore clicca una **card scoperta non coperta**.
- Si apre un **dropdown** con i colori disponibili (colori che hanno almeno una card coperta scambiabile, escluso quello attuale della card).
- `applyChangeColor(revealedCardId, targetColorKey)`:
  - Trova una card coperta del colore target.
  - **Scambia i colori** tra le due card.
  - Rileva nuove vincite su entrambi i colori coinvolti.

### 5.3 Copri 2 (simbolo nascosto)
- Quando viene rivelata una card con simbolo `copri2`, `copri2Available` += 1.
- Il pulsante bonus è abilitato solo se `copri2Available > 0`.
- Attivando la modalità, il banditore clicca una card scoperta → `applyCopri2(cardId)` → `covered = true`, `copri2Available` -= 1.
- La card coperta è visualizzata con X dorata e **esclusa dai conteggi vincite**.

### 5.4 Cambio giro (simbolo nascosto)
- Quando viene rivelata una card con simbolo `cambioGiro`, `cambioGiroAvailable` += 1.
- **La logica del cambio giro non è gestita dal software**: il giocatore che trova il simbolo riceve fisicamente una carta da usare quando vuole (regola da tavolo).
- Il counter è solo display + tracciamento.

---

## 6. Animazioni

### 6.1 Scorrimento (slot machine)
In `GameScreen.tsx`, useEffect su `[isSpinning, spinTargetId]`:
1. Trova l'indice della card target nello store (via `getState()` per evitare riavvii).
2. Genera una sequenza di indici (max 18 tick) terminante con il target.
3. Calcola intervalli **ease-out**: `35ms + (progress^1.8) * 170ms` → veloce all'inizio, lento alla fine.
4. Per ogni tick: `setSpotlightIndex(idx)` + `playSpinTick()`.
5. Dopo l'ultimo tick: `playLand()` (suono atterraggio).
6. Dopo +120ms: `playFlip()` (suono flip).
7. Dopo +250ms: `finalizeReveal(targetCard.id)` → scopre la card nello store, rileva vincite, simboli, voce.

### 6.2 Flip 3D della card
CSS puro in `globals.css`:
- `.card-3d` con `perspective: 1000px`.
- `.card-inner` con `transform-style: preserve-3d` e `transition: transform 0.7s`.
- `.card-flipped .card-inner` applica `rotateY(180deg)`.
- `.card-face` con `backface-visibility: hidden`.
- Spotlight pulsante (`.card-spotlight`) e glow finale (`.card-target-glow`).

### 6.3 Modali
- **WinModal**: spring scale + rotazione, shake, glow del colore vincente, trofeo.
- **ErrorModal**: triangolo warning rotante, shake.
- **RecapModal**: Dialog shadcn con barre orizzontali animate via Framer Motion.
- **Symbol popup**: banner in alto con slide-in + spring.

---

## 7. Audio

Tutto in `src/lib/sound/audio.ts`, **Web Audio API nativa**, niente file esterni.

| Funzione | Quando | Suono |
|---|---|---|
| `playSpinTick()` | ogni tick scorrimento | square 660Hz 50ms |
| `playLand()` | atterraggio su target | triangle 220Hz + square 440Hz |
| `playFlip()` | inizio flip | sawtooth sweep 300→900Hz + chord |
| `playError()` | numero già uscito | sawtooth sweep 320→140Hz + 160→90Hz |
| `playSymbol()` | simbolo trovato | arpeggio C5-E5-G5-C6 |
| `playWin(level)` | vincita | fanfara crescente (3-8 note), accordo finale per tombola |
| `playClick()` | UI | square 880Hz breve |

**Musica di sottofondo**: loop arpeggiato in C maggiore (`MUSIC_SEQUENCE`), attivabile/disattivabile. `setInterval` a 200ms (~120 bpm). Volume basso (0.05).

**Voce sintetica** (`voice.ts`): `SpeechSynthesisUtterance` con:
- Ricerca voce italiana (`it-IT`).
- `rate = 1.12` (allegra), `pitch = 1.25` (simpatica).
- Annuncia: numero + colore trovato, simboli bonus, vincite (con nome giocatore se presente).

**Policy autoplay**: il browser blocca l'audio fino al primo gesto utente. `unlockAudio()` è chiamato al primo `pointerdown`/`keydown`.

---

## 8. Temi

Definiti in `THEMES` (constants.ts). Attualmente solo `arcadeScuro`. La struttura è pronta per aggiungerne altri: basta aggiungere un'entry a `THEMES` e un pulsante nello SetupScreen.

Ogni tema definisce: `isDark`, accenti (`accent`, `accent2`, `accent3`), font (`displayFont`, `bodyFont`), `bgGradient`.

Le variabili CSS arcade (`--arcade-pink`, `--arcade-lime`, `--arcade-gold`, `--arcade-cyan`) sono in `globals.css`. Animazioni custom: `spotlight-pulse`, `target-glow`, `revealed-pop`, `win-shake`, `blink`, `logo-pulse`, `grid-drift`.

---

## 9. Messaggi di presa in giro

20 messaggi in `src/lib/game/mockery.ts` → `MOCKERY_MESSAGES`. Selezionati randomicamente via `randomMockeryMessage()` quando viene chiamato un numero già uscito o fuori range.

Facilmente modificabili: basta editare l'array. La funzione `randomMockeryMessage()` gestisce la selezione.

---

## 10. Persistenza e reset

- **Salvataggio**: `localStorage` chiave `tombola-colorata-v1`, tramite `persist` middleware.
- **Ripristino**: automatico al caricamento. `_hydrated` flag evita flicker.
- **Reset completo**: pulsante "Torna al setup" (icona Home) → `resetAll()` ripristina `initialState` mantenendo solo le preferenze audio.
- **Nuova partita** (stessi giocatori): pulsante "Nuova partita" (icona RotateCcw) → `newGame()` rigenera il mazzo con stesso config.

---

## 11. routing e vincoli

- **Una sola rotta visibile**: `/` (src/app/page.tsx). Non creare altre route.
- **Porta dev server**: 3000 (fissa, configurata in `package.json` → `"dev": "next dev -p 3000"`).
- **Non usare `bun run build`** in development (solo `bun run dev`).
- **Lint**: `bun run lint` (ESLint flat config).

---

## 12. File chiave (mappa rapida)

| File | Ruolo |
|---|---|
| `src/app/page.tsx` | Routing setup/game + hydration guard |
| `src/app/layout.tsx` | Font arcade + metadata |
| `src/app/globals.css` | Tema arcade, animazioni, variabili CSS |
| `src/lib/game/types.ts` | Tipi TypeScript centrali |
| `src/lib/game/constants.ts` | Colori, distribuzione, temi, griglia |
| `src/lib/game/distribution.ts` | createDeck, detectWin, pickRandom, swap |
| `src/lib/game/mockery.ts` | 20 messaggi di presa in giro |
| `src/lib/sound/audio.ts` | Web Audio API: SFX + musica |
| `src/lib/sound/voice.ts` | Web Speech API: voce sintetica |
| `src/hooks/game/useGameStore.ts` | Store Zustand persistente |
| `src/components/game/SetupScreen.tsx` | Schermata setup |
| `src/components/game/GameScreen.tsx` | Schermata gioco + animazioni |
| `src/components/game/Card.tsx` | Card con flip 3D |
| `src/components/game/GameHeader.tsx` | Header controlli globali |
| `src/components/game/BonusBar.tsx` | Barra bonus |
| `src/components/game/RecapModal.tsx` | Modale recap + istogramma |
| `src/components/game/WinModal.tsx` | Modale vincita |
| `src/components/game/ErrorModal.tsx` | Modale errore |

---

## 13. Limiti noti e design choices

- **Desktop-first**: responsive su mobile ma ottimizzato per schermi grandi da sala.
- **Un solo tema** implementato ("arcadeScuro"); struttura pronta per estensione.
- **Nomi giocatori opzionali**: se non inseriti, gli annunci usano solo il colore ("Il Rosso ha fatto ambo!").
- **Cambio giro non gestito dal software**: è una regola fisica da tavolo; il software traccia solo quante carte sono state trovate.
- **Audio sbloccato al primo gesto**: vincolo dei browser. Lo sblocco è automatico.
- **Tombola non chiude la partita**: si può continuare per i piazzamenti (come da specifica utente).
- **Classifica finale non implementata** (richiesta futura esplicitamente esclusa).

---

## 14. Come estendere

### Aggiungere un tema
1. Aggiungere entry in `THEMES` (constants.ts).
2. Aggiungere a `THEME_LIST` (automatico via `Object.values`).
3. Opzionale: aggiungere variabili CSS dedicate in globals.css.

### Modificare i messaggi di presa in giro
Editare direttamente l'array `MOCKERY_MESSAGES` in `mockery.ts`.

### Aggiungere un simbolo bonus
1. Estendere `SymbolKind` in types.ts.
2. Aggiungere logica di assegnazione in `createDeck` (distribution.ts).
3. Aggiungere icona/UI in `Card.tsx`.
4. Aggiungere handler in `useGameStore.ts` e UI in `BonusBar.tsx`.

### Cambiare la distribuzione card
Modificare `DISTRIBUTION` in constants.ts.

### Cambiare le soglie di vincita
Modificare `WIN_THRESHOLDS` in constants.ts e la logica in `detectWin` (distribution.ts).
