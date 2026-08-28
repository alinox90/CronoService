// Query SQL relative alla tabella "disponibilita"
const db = require('../config/database');

function trovaPerUtente(utente_id) {
  return db.prepare('SELECT * FROM disponibilita WHERE utente_id = ? ORDER BY data_inizio DESC').all(utente_id);
}

function trovaTutte() {
  return db.prepare(`
    SELECT d.*, u.nome AS utente_nome, u.cognome AS utente_cognome
    FROM disponibilita d
    JOIN utenti u ON u.id = d.utente_id
    ORDER BY d.data_inizio DESC
  `).all();
}

function trovaPerId(id) {
  return db.prepare('SELECT * FROM disponibilita WHERE id = ?').get(id);
}

// Verifica se un utente ha dichiarato una indisponibilita che copre la data indicata
function eIndisponibile(utente_id, data) {
  const riga = db.prepare(`
    SELECT COUNT(*) AS totale FROM disponibilita
    WHERE utente_id = ? AND tipo = 'non_disponibile' AND data_inizio <= ? AND data_fine >= ?
  `).get(utente_id, data, data);
  return riga.totale > 0;
}

// Verifica se un utente ha dichiarato disponibilita esplicita che copre la data indicata
function eDisponibile(utente_id, data) {
  const riga = db.prepare(`
    SELECT COUNT(*) AS totale FROM disponibilita
    WHERE utente_id = ? AND tipo = 'disponibile' AND data_inizio <= ? AND data_fine >= ?
  `).get(utente_id, data, data);
  return riga.totale > 0;
}

function crea(dati) {
  const risultato = db.prepare(`
    INSERT INTO disponibilita (utente_id, data_inizio, data_fine, tipo, note)
    VALUES (@utente_id, @data_inizio, @data_fine, @tipo, @note)
  `).run({ tipo: 'disponibile', note: null, ...dati });
  return trovaPerId(risultato.lastInsertRowid);
}

function elimina(id) {
  db.prepare('DELETE FROM disponibilita WHERE id = ?').run(id);
}

module.exports = { trovaPerUtente, trovaTutte, trovaPerId, eIndisponibile, eDisponibile, crea, elimina };
