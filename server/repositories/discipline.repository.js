// Query SQL relative alla tabella "discipline"
const db = require('../config/database');

function trovaTutte() {
  return db.prepare('SELECT * FROM discipline ORDER BY nome').all();
}

function trovaPerId(id) {
  return db.prepare('SELECT * FROM discipline WHERE id = ?').get(id);
}

function crea(dati) {
  const risultato = db.prepare('INSERT INTO discipline (nome, descrizione) VALUES (@nome, @descrizione)')
    .run({ descrizione: null, ...dati });
  return trovaPerId(risultato.lastInsertRowid);
}

function aggiorna(id, dati) {
  const campiConsentiti = ['nome', 'descrizione'];
  const campi = Object.keys(dati).filter((chiave) => campiConsentiti.includes(chiave));
  if (campi.length === 0) return trovaPerId(id);
  const setClause = campi.map((c) => `${c} = @${c}`).join(', ');
  db.prepare(`UPDATE discipline SET ${setClause} WHERE id = @id`).run({ id, ...dati });
  return trovaPerId(id);
}

function elimina(id) {
  db.prepare('DELETE FROM discipline WHERE id = ?').run(id);
}

module.exports = { trovaTutte, trovaPerId, crea, aggiorna, elimina };
