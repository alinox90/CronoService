// Query SQL relative alla tabella "convocazioni"
const db = require('../config/database');

const SELECT_BASE = `
  SELECT c.*, u.nome AS utente_nome, u.cognome AS utente_cognome, u.email AS utente_email,
         g.nome AS gara_nome, g.data_gara, g.ora_gara
  FROM convocazioni c
  JOIN utenti u ON u.id = c.utente_id
  JOIN gare g ON g.id = c.gara_id
`;

function trovaPerGara(gara_id) {
  return db.prepare(`${SELECT_BASE} WHERE c.gara_id = ? ORDER BY c.punteggio_assegnazione DESC NULLS LAST, u.cognome`).all(gara_id);
}

function trovaTutte({ stato } = {}) {
  let query = `${SELECT_BASE} WHERE 1 = 1`;
  const parametri = [];
  if (stato) { query += ' AND c.stato = ?'; parametri.push(stato); }
  query += ' ORDER BY g.data_gara DESC';
  return db.prepare(query).all(...parametri);
}

function trovaPerUtente(utente_id) {
  return db.prepare(`${SELECT_BASE} WHERE c.utente_id = ? ORDER BY g.data_gara DESC`).all(utente_id);
}

function trovaPerId(id) {
  return db.prepare(`${SELECT_BASE} WHERE c.id = ?`).get(id);
}

// Elenco (gara_id, utente_id) gia' convocati in una data, per rilevare conflitti di calendario
function trovaConflittiData(utente_id, data_gara, escludiGaraId = null) {
  let query = `
    SELECT c.* FROM convocazioni c
    JOIN gare g ON g.id = c.gara_id
    WHERE c.utente_id = ? AND g.data_gara = ? AND c.stato IN ('proposta', 'confermata', 'completata')
  `;
  const parametri = [utente_id, data_gara];
  if (escludiGaraId) {
    query += ' AND c.gara_id != ?';
    parametri.push(escludiGaraId);
  }
  return db.prepare(query).all(...parametri);
}

// Numero di servizi svolti/confermati da un utente negli ultimi N giorni (per l'algoritmo di equa distribuzione)
function contaServiziRecenti(utente_id, dataLimite) {
  const riga = db.prepare(`
    SELECT COUNT(*) AS totale FROM convocazioni c
    JOIN gare g ON g.id = c.gara_id
    WHERE c.utente_id = ? AND c.stato IN ('confermata', 'completata') AND g.data_gara >= ?
  `).get(utente_id, dataLimite);
  return riga.totale;
}

function crea(dati) {
  const risultato = db.prepare(`
    INSERT INTO convocazioni (gara_id, utente_id, ruolo_servizio, stato, punteggio_assegnazione, note)
    VALUES (@gara_id, @utente_id, @ruolo_servizio, @stato, @punteggio_assegnazione, @note)
  `).run({ ruolo_servizio: null, stato: 'proposta', punteggio_assegnazione: null, note: null, ...dati });
  return trovaPerId(risultato.lastInsertRowid);
}

function aggiorna(id, dati) {
  const campiConsentiti = ['ruolo_servizio', 'stato', 'punteggio_assegnazione', 'data_risposta', 'note'];
  const campi = Object.keys(dati).filter((chiave) => campiConsentiti.includes(chiave));
  if (campi.length === 0) return trovaPerId(id);
  const setClause = campi.map((c) => `${c} = @${c}`).join(', ');
  db.prepare(`UPDATE convocazioni SET ${setClause} WHERE id = @id`).run({ id, ...dati });
  return trovaPerId(id);
}

function elimina(id) {
  db.prepare('DELETE FROM convocazioni WHERE id = ?').run(id);
}

module.exports = { trovaPerGara, trovaTutte, trovaPerUtente, trovaPerId, trovaConflittiData, contaServiziRecenti, crea, aggiorna, elimina };
