// Query SQL relative alla tabella "risultati"
const db = require('../config/database');

function trovaPerGara(gara_id) {
  return db.prepare('SELECT * FROM risultati WHERE gara_id = ? ORDER BY posizione IS NULL, posizione').all(gara_id);
}

function trovaPerId(id) {
  return db.prepare('SELECT * FROM risultati WHERE id = ?').get(id);
}

function crea(dati) {
  const risultato = db.prepare(`
    INSERT INTO risultati (gara_id, pettorale, atleta_nome, categoria, tempo, posizione, note)
    VALUES (@gara_id, @pettorale, @atleta_nome, @categoria, @tempo, @posizione, @note)
  `).run({ pettorale: null, categoria: null, tempo: null, posizione: null, note: null, ...dati });
  return trovaPerId(risultato.lastInsertRowid);
}

function aggiorna(id, dati) {
  const campiConsentiti = ['pettorale', 'atleta_nome', 'categoria', 'tempo', 'posizione', 'note'];
  const campi = Object.keys(dati).filter((chiave) => campiConsentiti.includes(chiave));
  if (campi.length === 0) return trovaPerId(id);
  const setClause = campi.map((c) => `${c} = @${c}`).join(', ');
  db.prepare(`UPDATE risultati SET ${setClause} WHERE id = @id`).run({ id, ...dati });
  return trovaPerId(id);
}

function elimina(id) {
  db.prepare('DELETE FROM risultati WHERE id = ?').run(id);
}

module.exports = { trovaPerGara, trovaPerId, crea, aggiorna, elimina };
