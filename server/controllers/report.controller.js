// Report e statistiche aggregate per le dashboard amministrative.
// Nota: la durata di una gara non e' tracciata esplicitamente nello schema,
// quindi le "ore di servizio" sono stimate applicando una durata media
// convenzionale per ogni convocazione completata (approssimazione dichiarata,
// adeguata per un prototipo di tesi).
const db = require('../config/database');
const attrezzatureRepo = require('../repositories/attrezzature.repository');
const asyncHandler = require('../utils/asyncHandler');

const DURATA_MEDIA_ORE_PER_SERVIZIO = 4;

const serviziPerCronometrista = asyncHandler(async (req, res) => {
  const dati = db.prepare(`
    SELECT u.id, u.nome, u.cognome, COUNT(c.id) AS numero_servizi
    FROM utenti u
    LEFT JOIN convocazioni c ON c.utente_id = u.id AND c.stato IN ('confermata', 'completata')
    WHERE u.ruolo = 'cronometrista'
    GROUP BY u.id
    ORDER BY numero_servizi DESC
  `).all();
  res.json({ serviziPerCronometrista: dati });
});

const oreServizio = asyncHandler(async (req, res) => {
  const dati = db.prepare(`
    SELECT u.id, u.nome, u.cognome, COUNT(c.id) AS numero_servizi
    FROM utenti u
    LEFT JOIN convocazioni c ON c.utente_id = u.id AND c.stato IN ('confermata', 'completata')
    WHERE u.ruolo = 'cronometrista'
    GROUP BY u.id
    ORDER BY numero_servizi DESC
  `).all().map((riga) => ({
    ...riga,
    ore_stimate: riga.numero_servizi * DURATA_MEDIA_ORE_PER_SERVIZIO
  }));
  res.json({ oreServizio: dati, durataMediaOrePerServizio: DURATA_MEDIA_ORE_PER_SERVIZIO });
});

const utilizzoAttrezzature = asyncHandler(async (req, res) => {
  res.json({ utilizzoAttrezzature: attrezzatureRepo.contaUtilizzoPerAttrezzatura() });
});

// Riepilogo generale usato dalla dashboard iniziale
const riepilogo = asyncHandler(async (req, res) => {
  const totaliGare = db.prepare(`
    SELECT
      COUNT(*) AS totale,
      SUM(CASE WHEN stato = 'pianificata' THEN 1 ELSE 0 END) AS pianificate,
      SUM(CASE WHEN stato = 'confermata' THEN 1 ELSE 0 END) AS confermate,
      SUM(CASE WHEN stato = 'svolta' THEN 1 ELSE 0 END) AS svolte
    FROM gare
  `).get();
  const totaleCronometristi = db.prepare("SELECT COUNT(*) AS totale FROM utenti WHERE ruolo = 'cronometrista' AND attivo = 1").get();
  const convocazioniDaConfermare = db.prepare("SELECT COUNT(*) AS totale FROM convocazioni WHERE stato = 'proposta'").get();
  const attrezzatureDisponibili = db.prepare("SELECT COUNT(*) AS totale FROM attrezzature WHERE stato = 'disponibile'").get();

  res.json({
    gare: totaliGare,
    cronometristiAttivi: totaleCronometristi.totale,
    convocazioniDaConfermare: convocazioniDaConfermare.totale,
    attrezzatureDisponibili: attrezzatureDisponibili.totale
  });
});

module.exports = { serviziPerCronometrista, oreServizio, utilizzoAttrezzature, riepilogo };
