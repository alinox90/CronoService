// Query SQL relative alla tabella "notifiche"
const db = require('../config/database');

function trovaPerUtente(utente_id, { soloNonLette } = {}) {
  let query = 'SELECT * FROM notifiche WHERE utente_id = ?';
  const parametri = [utente_id];
  if (soloNonLette) query += ' AND letto = 0';
  query += ' ORDER BY creato_il DESC LIMIT 50';
  return db.prepare(query).all(...parametri);
}

function contaNonLette(utente_id) {
  const riga = db.prepare('SELECT COUNT(*) AS totale FROM notifiche WHERE utente_id = ? AND letto = 0').get(utente_id);
  return riga.totale;
}

function crea({ utente_id, titolo, messaggio, tipo = 'info', link = null }) {
  const risultato = db.prepare(`
    INSERT INTO notifiche (utente_id, titolo, messaggio, tipo, link)
    VALUES (?, ?, ?, ?, ?)
  `).run(utente_id, titolo, messaggio, tipo, link);
  return db.prepare('SELECT * FROM notifiche WHERE id = ?').get(risultato.lastInsertRowid);
}

function segnaComeLetta(id, utente_id) {
  db.prepare('UPDATE notifiche SET letto = 1 WHERE id = ? AND utente_id = ?').run(id, utente_id);
  return db.prepare('SELECT * FROM notifiche WHERE id = ?').get(id);
}

function segnaTutteComeLette(utente_id) {
  db.prepare('UPDATE notifiche SET letto = 1 WHERE utente_id = ?').run(utente_id);
}

module.exports = { trovaPerUtente, contaNonLette, crea, segnaComeLetta, segnaTutteComeLette };
