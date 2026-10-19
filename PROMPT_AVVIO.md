# PROJECT REPOSITORY

Repository: https://github.com/SilvioCorso/tombolaColorata
Token: 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

---  

# SCOPO DI QUESTO PROMPT — INIT-ONLY

Questo è un prompt di **SOLO INIZIALIZZAZIONE e RECUPERO CONTESTO**.

**Cosa FA:**
- Clona/synca la repo
- Installa dipendenze
- Avvia il dev server
- Recupera il contesto tecnico (legge i file chiave in parallelo)
- Esegue un health-check veloce degli endpoint
- **SI FERMA** e restituisce: STATUS + SINTESI + FINDINGS (problemi rilevati, NON fixati)


---

# FLUSSO PER LE FIX MIRATE (dopo l'init, SOLO su richiesta esplicita utente)

Quando l'utente chiede una fix mirata:

1. **Pull** — ripeti STEP 1 + STEP 2 dell'init (fetch/reset/sync + env/install)
2. **Contesto** — leggi i file coinvolti nella fix + worklog
4. **Esegui** — la fix meno invasiva possibile (Production Ready · Responsive · Accessibile · SEO/GEO · Performante · Type Safe)
5. **Verifica** — avvia dev server + agent-browser golden path **nella stessa tool call** (il server muore a fine call)
6. **Commit & Push** —
   ```bash
   cd /home/z/.tombola-repo
   rsync -av --exclude='.git' --exclude='node_modules' --exclude='.next' --exclude='dev.log' \
     /home/z/my-project/ /home/z/.sirviodj-repo/
   git add . && git commit -m "descrizione chiara" && git push origin main
   ```
7. **Report** — file modificati + riassunto lavoro + criticità residue

L'utente installa manualmente su Vercel — **non fare deploy**.

---

# REGOLE CRITICHE (riassunto — non dimenticarle)

1. **INIT-ONLY**: niente fix, niente commit, niente push durante l'inizializzazione
2. **Server vive solo nella tool call**: riavvia quando serve, non cercare di tenerlo alive
3. **Pre-kill porta 3000**: sempre `lsof -ti:3000 | xargs -r kill -9` prima di `bun run dev`
4. **Non investigare i Known Quirks**: sono pre-documentati, applica i workaround
5. **`.env.example` del progetto** è la source of truth per le env vars
6. **`worklog.md` è gitignored**: leggi per contesto, NON committare
7. **Dopo il REPORT, FERMATI**: attendi le richieste mirate dell'utente
8. **Una fix alla volta**: non accumulare modifiche non richieste


## CONTESTO

Devi sviluppare o modificare un gioco web chiamato **Tombola Colorata**. È un gioco da sala party in stile "tombola" dove i giocatori sono associati a colori e il banditore (operatore unico al computer) gestisce il tabellone.

Il progetto è **già esistente e funzionante**. È scritto in **Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + shadcn/ui + Zustand**. La parte dinamica (audio, voce, animazioni) usa API native del browser (Web Audio API, Web Speech API, CSS animations, Framer Motion).

Prima di partire, **leggi obbligatoriamente** questi file:
1. `SPECIFICHE_TECNICHE.md` — specifiche complete di architettura, dominio, animazioni, audio, temi.
2. `ISTRUZIONI.md` — come avviare il progetto e i vincoli di sviluppo.
3. `src/lib/game/types.ts`, `src/lib/game/constants.ts`, `src/lib/game/distribution.ts` — il dominio di gioco.
4. `src/hooks/game/useGameStore.ts` — tutto lo stato e le azioni.
5. `src/components/game/GameScreen.tsx` — orchestrazione UI e animazioni.

## COSA FA IL GIOCO (riassunto)

- Il banditore sceglie un tema (attualmente solo "Arcade Scuro"), il numero di giocatori (2-10), e opzionalmente i nomi.
- A ogni giocatore viene assegnato un colore in ordine fisso (Rosso, Blu, Giallo, Verde, Azzurro, Arancione, Grigio grafite, Viola, Magenta, Verde acqua).
- Viene generato un tabellone con N card (es. 3 giocatori = 60 card, 20 per colore). Ogni card mostra un numero progressivo (1..N) e nasconde un colore (mescolato). ~12% delle card nasconde anche un simbolo bonus.
- A turno, ogni giocatore dice un numero libero. Il banditore lo digita. Il software fa scorrere le card con un'animazione ease-out e poi gira la card bersaglio mostrando il colore (e l'eventuale simbolo) con un flip 3D.
- Quando 2 card dello stesso colore sono scoperte: **ambo**. 3 = terna. 4 = quaterna. 5 = cinquina. Tutte = **tombola**. Modale di vittoria + voce sintetica italiana.
- Se un giocatore dice un numero già uscito, appare una modale con un messaggio di presa in giro (20 frasi randomiche in `src/lib/game/mockery.ts`).
- Bonus: **Random** (numero casuale libero), **Cambia colore** (scambia colore di una card scoperta con una coperta), **Copri 2** (copre 2 card scoperte, escludendole dai conteggi), **Cambio giro** (simbolo fisico, tracciato ma non gestito dal software).
- Audio: effetti chiptune (Web Audio API), musica di sottofondo opzionale, voce sintetica (Web Speech API).
- Persistenza in `localStorage` (si riprende la partita dopo refresh).
- Schermo intero, recap con istogramma orizzontale dei progressi per colore.

## VINCOLI NON NEGOZIABILI

1. **Framework**: Next.js 16 con App Router, TypeScript. **Non cambiare**.
2. **Porta dev server**: 3000 (fissa). Non usare altre porte.
3. **Non usare `bun run build`** in development. Solo `bun run dev` (parte in background).
4. **Una sola rotta visibile**: `/` (`src/app/page.tsx`). Non creare altre route. Il routing setup/game è interno a `page.tsx` in base al `phase` dello store.
5. **z-ai-web-dev-sdk**: va usato SOLO lato backend, mai client-side. (Non è attualmente usato in questo gioco.)
6. **Styling**: Tailwind CSS 4 + shadcn/ui. I componenti shadcn sono già tutti in `src/components/ui/`. NON crearne di nuovi da zero, riusa quelli.
7. **Evita colori indigo/blue** come primari (il tema arcade usa pink/lime/gold/cyan).
8. **Footer sticky** in fondo quando il contenuto è corto; pushato naturalmente quando è lungo.
9. **Verifica sempre con Agent Browser** prima di dire "fatto": apri `/`, controlla errori console, testa il golden path (setup → avvio → gira un numero → ambo → recap), verifica responsive e sticky footer.
10. **Lint pulito** alla fine (`bun run lint` → 0 errori).
11. **Non scrivere test** se non richiesti esplicitamente.

## STRUTTURA DEL PROGETTO

```
src/
├── app/
│   ├── layout.tsx          # font arcade + metadata
│   ├── page.tsx            # routing setup/game + hydration guard
│   ├── globals.css         # tema arcade + animazioni custom
│   └── api/route.ts        # placeholder (non usato dal gioco)
├── lib/
│   ├── game/
│   │   ├── types.ts        # tipi centrali
│   │   ├── constants.ts    # colori, distribuzione, temi, griglia
│   │   ├── distribution.ts # createDeck, detectWin, pickRandom, swap
│   │   └── mockery.ts      # 20 messaggi di presa in giro
│   ├── sound/
│   │   ├── audio.ts        # Web Audio API: SFX + musica
│   │   └── voice.ts        # Web Speech API: voce italiana
│   ├── db.ts               # Prisma client (non usato dal gioco)
│   └── utils.ts            # cn() helper
├── hooks/game/
│   └── useGameStore.ts     # store Zustand persistente (localStorage)
├── components/
│   ├── game/
│   │   ├── SetupScreen.tsx
│   │   ├── GameScreen.tsx
│   │   ├── Card.tsx
│   │   ├── GameHeader.tsx
│   │   ├── BonusBar.tsx
│   │   ├── RecapModal.tsx
│   │   ├── WinModal.tsx
│   │   └── ErrorModal.tsx
│   └── ui/                 # componenti shadcn (NON modificare)
└── ...
```

## COME AVVIARE IL PROGETTO

```bash
bun install        # solo la prima volta
bun run dev        # parte in background su http://localhost:3000
bun run lint       # check qualità codice
```

Log del dev server: `/home/z/my-project/dev.log` (leggi gli ultimi 30 righe per controllare errori di compile).

## REGOLE DI SVILUPPO

- **Frontend-first**: se lavori su una feature full-stack, scrivi prima la UI così l'utente vede il risultato, poi il backend.
- **Usa API routes** (Next.js) invece di server actions quando serve backend. (Per questo gioco non è attualmente necessario.)
- **Stato**: usa lo store Zustand esistente. Non creare store paralleli.
- **Animazioni**: Framer Motion per transizioni React, CSS per animazioni persistenti della card.
- **Audio**: aggiungi funzioni in `src/lib/sound/audio.ts`. Tutto client-side.
- **Componenti**: preferisci shadcn/ui esistenti. Per UI custom, segui lo stile arcade (classi `arcade-panel`, `btn-arcade`, `btn-arcade-lime`, `neon-*`).
- **Immagini**: se servono, usa la skill Image-Generation.
- **Salva i progressi**: dopo modifiche rilevanti, aggiorna `SPECIFICHE_TECNICHE.md` e `worklog.md` se presenti.

## CHECKLIST DI CONSEGNA

Prima di dire "fatto", assicurati di:

- [ ] Aver letto `SPECIFICHE_TECNICHE.md` e capito l'architettura.
- [ ] Aver avviato il dev server senza errori fatali in `dev.log`.
- [ ] `bun run lint` passa con 0 errori.
- [ ] Verificato con Agent Browser che la pagina `/` carichi senza blank screen né errori console.
- [ ] Tastato il golden path: setup → avvio → gira un numero → rileva vincita → apri recap.
- [ ] Verificato che il footer sia sticky su pagina corta e pushato su pagina lunga.
- [ ] Verificato responsive mobile (viewport 400×800) e desktop (1280×800).
- [ ] Aggiornato `SPECIFICHE_TECNICHE.md` se la feature introduce nuovi file, nuove regole o cambia il dominio.

Inizia confermando di aver letto le specifiche tecniche e proponi un piano di implementazione prima di scrivere codice.
