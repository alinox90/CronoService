# Crono Service

Piattaforma web per la gestione operativa dei servizi di cronometraggio sportivo della sezione FICR Palermo, sviluppata come progetto di tesi (Università e-Campus, Corso di Laurea in Ingegneria Informatica e dell'Automazione). Il sistema è dedicato esclusivamente a questa associazione: non gestisce altre sezioni provinciali.

L'applicazione centralizza in un unico ambiente le attività oggi gestite tramite fogli Excel, email, WhatsApp e moduli cartacei: anagrafica dei cronometristi, calendario delle gare, assegnazione dei cronometristi agli eventi, gestione delle attrezzature, archiviazione dei risultati, reportistica e dashboard amministrative.

## Stack tecnologico

- **Backend:** Node.js + Express (API REST in JSON), autenticazione con sessioni cookie-based (`express-session` + `bcryptjs`), RBAC su 4 ruoli.
- **Frontend:** HTML, CSS e JavaScript vanilla (nessun framework, nessun bundler), applicazione multi-pagina.
- **Database:** SQLite tramite `better-sqlite3` (file singolo, zero configurazione).
- **Notifiche:** centro notifiche in-app sempre attivo + invio email opzionale tramite `nodemailer` (se non configurato l'SMTP, le email vengono simulate e registrate nei log del server).

## Requisiti

- Node.js 18 o superiore.

## Avvio rapido

```bash
npm install
npm run seed    # crea il database SQLite e lo popola con dati dimostrativi
npm run dev      # avvia il server in sviluppo (nodemon)
```

L'applicazione sarà disponibile su [http://localhost:3000](http://localhost:3000).

Per l'avvio in produzione: `npm start`.

### Configurazione (opzionale)

Copiare `.env.example` in `.env` per personalizzare porta, segreto di sessione, percorso del database e credenziali SMTP. Senza un SMTP configurato, le notifiche via email vengono semplicemente simulate (loggate in console) mentre il centro notifiche in-app resta pienamente funzionante.

## Credenziali demo

Password comune per tutti gli utenti demo: **`CronoService2026!`**

| Ruolo | Email |
|---|---|
| Amministratore di sistema | `admin@cronoservice.it` |
| Presidente associazione | `presidente@cronoservice.it` |
| Designatore servizi | `laura.greco@cronoservice.it` |
| Designatore servizi | `marco.bianchi@cronoservice.it` |
| Cronometrista | `paolo.russo@cronoservice.it` (e altri 9, vedi la pagina "Cronometristi") |

## Ruoli e permessi (RBAC)

- **Amministratore di sistema:** accesso completo (utenti, discipline, gare, convocazioni, attrezzature, risultati, report).
- **Presidente associazione:** consultazione estesa di dashboard, report e gare a livello globale.
- **Designatore dei servizi:** gestisce gare, convocazioni (incluso l'algoritmo di assegnazione), attrezzature; consulta disponibilità e risultati.
- **Cronometrista:** gestisce le proprie convocazioni (conferma/rifiuta) e la propria disponibilità; consulta i risultati delle gare a cui partecipa.

## Struttura del progetto

```
CronoService/
  server/
    config/       configurazione (variabili d'ambiente, connessione al database)
    db/           schema SQL e script di popolamento dati demo
    middleware/   autenticazione, controllo dei ruoli, gestione errori
    repositories/ query SQL incapsulate per ciascuna entità
    services/     algoritmo di assegnazione, notifiche, email, calcolo distanze
    controllers/  logica delle richieste HTTP
    routes/       definizione delle rotte REST
    app.js        configurazione dell'app Express
    index.js       punto di ingresso del server
  public/          frontend statico (HTML, CSS, JS vanilla)
    pages/         una pagina HTML per ciascuna funzionalità
    js/            uno script client per pagina + moduli condivisi (api, layout, util)
    css/           foglio di stile unico
```

## Modello dei dati

Sei entità principali (come da specifica di tesi) più le tabelle di supporto necessarie:

`discipline`, `utenti`, `gare`, `convocazioni`, `attrezzature`, `risultati`, più `disponibilita`, `attrezzature_gare` e `notifiche`. Lo schema completo, commentato, è consultabile in `server/db/schema.sql`.

## Algoritmo intelligente di assegnazione

Per ogni gara, il sistema (`server/services/assegnazioneService.js`) propone un elenco ordinato di cronometristi idonei calcolando un punteggio pesato basato su:

- **disponibilità** dichiarata e assenza di conflitti di calendario (fattori eliminatori);
- **distanza geografica** tra il cronometrista e la sede della gara (formula dell'emisenoverso);
- **esperienza** (anni di servizio);
- **equa distribuzione** dei servizi, per bilanciare il carico tra i cronometristi.

Il risultato è un suggerimento: la decisione finale di convocazione resta sempre al designatore dei servizi.

## Deploy su Render (piano gratuito)

Il repository include un file `render.yaml` che configura automaticamente il servizio:

1. Su [render.com](https://render.com) creare un account e collegare il repository GitHub `alinox90/CronoService`.
2. Scegliere **New > Blueprint** e selezionare il repository: Render legge `render.yaml` e crea il servizio web (piano Free) con build (`npm install`) e avvio (`npm run seed && npm start`) già configurati.
3. `SESSION_SECRET` viene generato automaticamente da Render; le altre variabili SMTP restano opzionali (email simulate se non impostate).
4. Al termine del deploy l'app è raggiungibile all'URL `https://crono-service.onrender.com` (o simile) assegnato da Render.

**Nota:** il piano Free di Render non offre disco persistente, quindi il database SQLite viene ricreato e ripopolato con i dati demo (`npm run seed`) a ogni riavvio del servizio (es. dopo un periodo di inattività). Per un uso con persistenza reale dei dati serve un piano a pagamento con disco persistente (Render) oppure un servizio come Fly.io con volume persistente.

## Note e limiti noti (prototipo di tesi)

- Le sessioni sono mantenute in memoria: un riavvio del server invalida le sessioni attive.
- Non è implementata una libreria dedicata anti-CSRF; la mitigazione si basa sui cookie di sessione `SameSite=Lax`.
- Le "ore di servizio" nel report sono stimate applicando una durata media convenzionale per convocazione, poiché la durata puntuale di una gara non è tracciata nello schema.
- Non sono implementate le notifiche push del browser (richiederebbero chiavi VAPID e HTTPS anche in locale); il centro notifiche in-app copre lo stesso bisogno funzionale.

Possibili evoluzioni future: notifiche push reali, esportazione report in PDF/Excel, storico versioni delle convocazioni, app mobile dedicata ai cronometristi.
