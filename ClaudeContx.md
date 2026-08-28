# Crono Service — Contesto di sviluppo (sessione Claude Code)

Riepilogo salvato il 2026-08-25 per continuare il lavoro in una sessione futura senza perdere contesto.

## Cos'è il progetto

Webapp "Crono Service" per la gestione dei servizi di cronometraggio sportivo della sezione **FICR Palermo**, sviluppata come progetto collegato alla tesi "Piattaforma web per la gestione intelligente delle attività di cronometraggio sportivo" (Università e-Campus, Ingegneria Informatica e dell'Automazione). Le specifiche sono state estratte dal file `Sviluppo tesi.docx`.

Il sistema è dedicato esclusivamente a questa associazione: non esiste (più) alcun concetto di "sezione provinciale" multi-tenant nel modello dati né nell'interfaccia (rimosso su richiesta esplicita dell'utente il 2026-08-25).

Copre: anagrafica cronometristi, calendario gare, assegnazione cronometristi-gare (con algoritmo "intelligente" di suggerimento), disponibilità, attrezzature, risultati, report/statistiche, dashboard per ruolo, autenticazione con RBAC su 4 ruoli, centro notifiche in-app + email opzionale.

Il piano di sviluppo approvato è salvato in `C:\Users\Alessandro\.claude\plans\delightful-prancing-turtle.md` (schema DB, matrice RBAC, disegno dell'algoritmo, struttura progetto, elenco API, passi di verifica).

## Decisioni confermate con l'utente

- **Database:** SQLite (non Postgres/MySQL) tramite `better-sqlite3`.
- **Notifiche:** centro notifiche in-app sempre attivo + invio email opzionale via `nodemailer` (se manca SMTP configurato, le email vengono solo simulate/loggate in console).

## Stack tecnico

- **Backend:** Node.js + Express (API REST JSON), sessioni cookie-based (`express-session` + `bcryptjs`), RBAC via middleware custom (`requireAuth`, `requireRole`), `helmet`, `express-rate-limit` sul login.
- **Frontend:** HTML/CSS/JS vanilla multi-pagina, nessun framework/bundler, comunicazione via `fetch()`.
- **DB:** SQLite via `better-sqlite3` (sincrono, file singolo), schema applicato automaticamente da `schema.sql` all'avvio.
- **Email:** `nodemailer ^9.0.5` (aggiornato da `^6.9.14` per vulnerabilità high-severity trovate da `npm audit`; ora 0 vulnerabilità) con fallback `jsonTransport` quando SMTP non è configurato.

## Struttura del progetto

```
CronoService/
  package.json, .env.example, README.md
  server/
    config/       env.js, database.js
    db/           schema.sql, seed.js
    middleware/   auth.js (requireAuth, requireRole)
    repositories/ *.repository.js (utenti, discipline, gare, convocazioni, attrezzature, risultati, disponibilita, notifiche)
    services/     assegnazioneService.js (algoritmo), notificheService.js, emailService.js, geoService.js
    controllers/  *.controller.js
    routes/       *.routes.js
    app.js, index.js
  public/
    css/style.css
    js/           api.js, util.js, layout.js, login.js, dashboard.js, utenti.js,
                  attrezzature.js, disponibilita.js, report.js, amministrazione.js,
                  profilo.js, convocazioni.js, gare.js, gara-dettaglio.js
    pages/        una pagina HTML per funzionalità
```

## Schema database (SQLite)

Tabelle: `discipline`, `utenti` (ruolo CHECK: admin/presidente/designatore/cronometrista), `gare` (stato CHECK: pianificata/confermata/svolta/annullata), `disponibilita`, `convocazioni` (stato CHECK: proposta/confermata/rifiutata/sostituita/completata, UNIQUE(gara_id,utente_id)), `attrezzature`, `attrezzature_gare`, `risultati`, `notifiche`, più indici.

## RBAC — 4 ruoli

- **Amministratore di sistema:** accesso completo.
- **Presidente associazione:** consultazione estesa (dashboard/report/gare globali).
- **Designatore dei servizi:** gestisce gare, convocazioni (incl. algoritmo di assegnazione), attrezzature; consulta disponibilità e risultati.
- **Cronometrista:** gestisce proprie convocazioni (conferma/rifiuta) e propria disponibilità; consulta risultati delle gare a cui partecipa.

## Algoritmo intelligente di assegnazione

File: `server/services/assegnazioneService.js`, funzione `calcolaSuggerimenti(gara_id)`.

Punteggio pesato: `distanza 35%`, `esperienza 25%`, `equaDistribuzione 25%`, `disponibilitaDichiarata 15%`, con gate eliminatori su conflitti di calendario e indisponibilità dichiarata. Distanza calcolata con formula dell'emisenoverso (haversine) tra coordinate cronometrista e gara.

## Credenziali demo

Password comune per tutti gli utenti demo: **`CronoService2026!`**

| Ruolo | Email |
|---|---|
| Amministratore di sistema | admin@cronoservice.it |
| Presidente associazione | presidente@cronoservice.it |
| Designatore servizi | laura.greco@cronoservice.it |
| Designatore servizi | marco.bianchi@cronoservice.it |
| Cronometrista | paolo.russo@cronoservice.it (+ altri 9, es. anna.lombardo@, francesca.costa@) |

Seed: 4 discipline, 10 cronometristi con lat/lng nell'area di Palermo (usate dall'algoritmo di distanza), gare passate/future nel territorio di Palermo, convocazioni/disponibilità/risultati/attrezzature di esempio.

## Comandi

```bash
npm install
npm run seed    # crea/ripopola il DB SQLite con dati demo
npm run dev      # avvia il server in sviluppo (nodemon, auto-restart)
npm start        # avvio "produzione" senza auto-restart
```

App disponibile su `http://localhost:3000`.

## Modifiche esterne rilevate ai file (NON fatte da me, da rispettare senza revert)

- **`public/js/gare.js`**: i campi Latitudine/Longitudine sono stati rimossi dal modulo di creazione/modifica gara; `lat`/`lng` non sono più inclusi nel body di `salvaGara()`.
- **`public/js/gara-dettaglio.js`**: il tab "Risultati" è stato completamente rimosso (restano solo i tab "Convocazioni" e "Attrezzature"); la variabile `risultati` non è più tracciata; la colonna "Distanza" è stata rimossa dalla tabella dei suggerimenti dell'algoritmo (restano Cronometrista/Punteggio/Esperienza/Servizi recenti/Note/azioni).

Queste modifiche vanno mantenute così come sono in eventuali sessioni future.

## Problemi risolti durante lo sviluppo

- **Lettura file .docx**: Read non apre binari; risolto scompattando il docx (è uno zip) via `unzip` e ripulendo l'XML di `word/document.xml` con un one-liner Perl (python non disponibile sul sistema).
- **Vulnerabilità npm audit su nodemailer**: risolte aggiornando a `^9.0.5`.
- **Binding di `undefined` in better-sqlite3**: in `utenti.controller.js` (`aggiornaProfiloProprio`) i campi opzionali del body vengono ora normalizzati con `?? null` prima di passarli alla repository (better-sqlite3 lancia eccezione se si passa `undefined`).
- **Automazione browser**: gli screenshot restituivano dimensioni fisse (896x331) indipendentemente dal viewport reale, rendendo inaffidabili i click per coordinate; risolto usando `javascript_tool` per impostare direttamente i valori dei campi form e chiamare `form.requestSubmit()`.
- **Gestione processi Node su Windows**: per fermare il server avviato con `npm run dev` (nodemon), i processi backgroundati da Bash con `&` possono restare vivi anche se il tool Bash segnala il comando come "completato". Soluzione: individuare i PID reali con `Get-CimInstance Win32_Process -Filter "Name='node.exe'"` (filtrando per command line) e terminarli con `Stop-Process -Id <pid> -Force`.

## Stato attuale

- App completa e testata end-to-end (curl + browser reale): login/sessione, enforcement RBAC (403 lato server e guardia UI lato client), algoritmo di assegnazione (ranking/esclusioni verificati contro i dati seed), workflow convocazione → notifica → conferma → contro-notifica, assegnazione attrezzatura a gara, accuratezza report/statistiche (incrociata con lo stato grezzo del DB), simulazione email quando SMTP non è configurato. Nessun errore JS in console durante i test browser.
- Il server **non è attualmente in esecuzione** (è stato fermato su richiesta esplicita dell'utente).
- `README.md` nel progetto contiene documentazione completa: quick start, credenziali demo, ruoli RBAC, struttura progetto, modello dati, spiegazione algoritmo, limiti noti (sessioni in memoria, nessuna libreria CSRF dedicata, ore di servizio stimate, nessuna push notification reale del browser).

## Prossimi passi possibili

Nessun task esplicito pendente al momento del salvataggio di questo contesto. Possibili sviluppi futuri citati nel README: notifiche push reali, esportazione report in PDF/Excel, storico versioni delle convocazioni, app mobile per cronometristi.
