-- Schema relazionale di Crono Service
-- Sei entita principali richieste dalla tesi (Utenti, Gare, Discipline,
-- Convocazioni, Attrezzature, Risultati) piu tabelle di supporto
-- necessarie per disponibilita, assegnazione attrezzature e notifiche.
-- Sistema dedicato esclusivamente alla gestione della sezione FICR Palermo.

PRAGMA foreign_keys = ON;

-- Discipline sportive gestite (atletica, ciclismo, nuoto, ecc.)
CREATE TABLE IF NOT EXISTS discipline (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nome        TEXT NOT NULL UNIQUE,
  descrizione TEXT
);

-- Utenti del sistema: cronometristi, designatori, presidente, amministratori
CREATE TABLE IF NOT EXISTS utenti (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  nome            TEXT NOT NULL,
  cognome         TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  ruolo           TEXT NOT NULL CHECK (ruolo IN ('admin', 'presidente', 'designatore', 'cronometrista')),
  telefono        TEXT,
  indirizzo       TEXT,
  comune          TEXT,
  qualifica       TEXT,
  anni_esperienza INTEGER DEFAULT 0,
  lat             REAL,
  lng             REAL,
  attivo          INTEGER NOT NULL DEFAULT 1,
  creato_il       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Gare / eventi sportivi da cronometrare
CREATE TABLE IF NOT EXISTS gare (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  nome                   TEXT NOT NULL,
  disciplina_id          INTEGER REFERENCES discipline(id) ON DELETE SET NULL,
  data_gara              TEXT NOT NULL,
  ora_gara               TEXT,
  luogo                  TEXT,
  indirizzo              TEXT,
  lat                    REAL,
  lng                    REAL,
  stato                  TEXT NOT NULL DEFAULT 'pianificata' CHECK (stato IN ('pianificata', 'confermata', 'svolta', 'annullata')),
  cronometristi_richiesti INTEGER NOT NULL DEFAULT 1,
  note                   TEXT,
  creato_da              INTEGER REFERENCES utenti(id) ON DELETE SET NULL,
  creato_il              TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Finestre di disponibilita/indisponibilita dichiarate dai cronometristi
CREATE TABLE IF NOT EXISTS disponibilita (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  utente_id   INTEGER NOT NULL REFERENCES utenti(id) ON DELETE CASCADE,
  data_inizio TEXT NOT NULL,
  data_fine   TEXT NOT NULL,
  tipo        TEXT NOT NULL DEFAULT 'disponibile' CHECK (tipo IN ('disponibile', 'non_disponibile')),
  note        TEXT
);

-- Convocazioni: assegnazione di un cronometrista a una gara
CREATE TABLE IF NOT EXISTS convocazioni (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  gara_id               INTEGER NOT NULL REFERENCES gare(id) ON DELETE CASCADE,
  utente_id             INTEGER NOT NULL REFERENCES utenti(id) ON DELETE CASCADE,
  ruolo_servizio        TEXT,
  stato                 TEXT NOT NULL DEFAULT 'proposta' CHECK (stato IN ('proposta', 'confermata', 'rifiutata', 'sostituita', 'completata')),
  punteggio_assegnazione REAL,
  data_convocazione     TEXT NOT NULL DEFAULT (datetime('now')),
  data_risposta         TEXT,
  note                  TEXT,
  UNIQUE (gara_id, utente_id)
);

-- Inventario attrezzature di cronometraggio
CREATE TABLE IF NOT EXISTS attrezzature (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  nome         TEXT NOT NULL,
  tipo         TEXT,
  numero_serie TEXT UNIQUE,
  stato        TEXT NOT NULL DEFAULT 'disponibile' CHECK (stato IN ('disponibile', 'in_uso', 'manutenzione', 'fuori_servizio')),
  note         TEXT
);

-- Assegnazione delle attrezzature alle gare
CREATE TABLE IF NOT EXISTS attrezzature_gare (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  attrezzatura_id    INTEGER NOT NULL REFERENCES attrezzature(id) ON DELETE CASCADE,
  gara_id            INTEGER NOT NULL REFERENCES gare(id) ON DELETE CASCADE,
  data_assegnazione  TEXT NOT NULL DEFAULT (datetime('now')),
  data_restituzione  TEXT
);

-- Risultati registrati per ciascuna gara
CREATE TABLE IF NOT EXISTS risultati (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  gara_id     INTEGER NOT NULL REFERENCES gare(id) ON DELETE CASCADE,
  pettorale   TEXT,
  atleta_nome TEXT NOT NULL,
  categoria   TEXT,
  tempo       TEXT,
  posizione   INTEGER,
  note        TEXT
);

-- Centro notifiche in-app
CREATE TABLE IF NOT EXISTS notifiche (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  utente_id INTEGER NOT NULL REFERENCES utenti(id) ON DELETE CASCADE,
  titolo    TEXT NOT NULL,
  messaggio TEXT NOT NULL,
  tipo      TEXT NOT NULL DEFAULT 'info',
  letto     INTEGER NOT NULL DEFAULT 0,
  link      TEXT,
  creato_il TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_gare_data ON gare(data_gara);
CREATE INDEX IF NOT EXISTS idx_convocazioni_gara ON convocazioni(gara_id);
CREATE INDEX IF NOT EXISTS idx_convocazioni_utente ON convocazioni(utente_id);
CREATE INDEX IF NOT EXISTS idx_disponibilita_utente ON disponibilita(utente_id);
CREATE INDEX IF NOT EXISTS idx_risultati_gara ON risultati(gara_id);
CREATE INDEX IF NOT EXISTS idx_notifiche_utente ON notifiche(utente_id);
