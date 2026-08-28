// Query SQL relative alla tabella "utenti"
const db = require('../config/database');

// Colonne restituite ai client, esclude sempre l'hash della password
const COLONNE_PUBBLICHE = `
  id, nome, cognome, email, ruolo, telefono, indirizzo, comune, qualifica,
  anni_esperienza, lat, lng, attivo, creato_il
`;

function trovaTutti({ ruolo, attivo } = {}) {
  let query = `SELECT ${COLONNE_PUBBLICHE} FROM utenti WHERE 1 = 1`;
  const parametri = [];
  if (ruolo) {
    query += ' AND ruolo = ?';
    parametri.push(ruolo);
  }
  if (attivo !== undefined) {
    query += ' AND attivo = ?';
    parametri.push(attivo ? 1 : 0);
  }
  query += ' ORDER BY cognome, nome';
  return db.prepare(query).all(...parametri);
}

function trovaPerId(id) {
  return db.prepare(`SELECT ${COLONNE_PUBBLICHE} FROM utenti WHERE id = ?`).get(id);
}

function trovaPerEmail(email) {
  return db.prepare('SELECT * FROM utenti WHERE email = ?').get(email);
}

function crea(dati) {
  const risultato = db.prepare(`
    INSERT INTO utenti (nome, cognome, email, password_hash, ruolo, telefono, indirizzo, comune, qualifica, anni_esperienza, lat, lng, attivo)
    VALUES (@nome, @cognome, @email, @password_hash, @ruolo, @telefono, @indirizzo, @comune, @qualifica, @anni_esperienza, @lat, @lng, @attivo)
  `).run({
    telefono: null, indirizzo: null, comune: null, qualifica: null, anni_esperienza: 0, lat: null, lng: null, attivo: 1,
    ...dati
  });
  return trovaPerId(risultato.lastInsertRowid);
}

function aggiorna(id, dati) {
  const campiConsentiti = ['nome', 'cognome', 'email', 'ruolo', 'telefono', 'indirizzo', 'comune', 'qualifica', 'anni_esperienza', 'lat', 'lng', 'attivo'];
  const campi = Object.keys(dati).filter((chiave) => campiConsentiti.includes(chiave));
  if (campi.length === 0) return trovaPerId(id);
  const setClause = campi.map((c) => `${c} = @${c}`).join(', ');
  db.prepare(`UPDATE utenti SET ${setClause} WHERE id = @id`).run({ id, ...dati });
  return trovaPerId(id);
}

function aggiornaPassword(id, password_hash) {
  db.prepare('UPDATE utenti SET password_hash = ? WHERE id = ?').run(password_hash, id);
}

function elimina(id) {
  db.prepare('DELETE FROM utenti WHERE id = ?').run(id);
}

module.exports = { trovaTutti, trovaPerId, trovaPerEmail, crea, aggiorna, aggiornaPassword, elimina };
