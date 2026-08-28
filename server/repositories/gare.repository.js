// Query SQL relative alla tabella "gare"
const db = require('../config/database');

const SELECT_BASE = `
  SELECT g.*, d.nome AS disciplina_nome,
         (SELECT COUNT(*) FROM convocazioni c WHERE c.gara_id = g.id AND c.stato IN ('proposta', 'confermata', 'completata')) AS cronometristi_assegnati
  FROM gare g
  LEFT JOIN discipline d ON d.id = g.disciplina_id
`;

function trovaTutte({ disciplina_id, stato, da, a } = {}) {
  let query = `${SELECT_BASE} WHERE 1 = 1`;
  const parametri = [];
  if (disciplina_id) { query += ' AND g.disciplina_id = ?'; parametri.push(disciplina_id); }
  if (stato) { query += ' AND g.stato = ?'; parametri.push(stato); }
  if (da) { query += ' AND g.data_gara >= ?'; parametri.push(da); }
  if (a) { query += ' AND g.data_gara <= ?'; parametri.push(a); }
  query += ' ORDER BY g.data_gara, g.ora_gara';
  return db.prepare(query).all(...parametri);
}

function trovaPerId(id) {
  return db.prepare(`${SELECT_BASE} WHERE g.id = ?`).get(id);
}

// Gare a cui un dato utente e' convocato (per la vista personale del cronometrista)
function trovaPerUtente(utente_id) {
  return db.prepare(`
    SELECT g.*, d.nome AS disciplina_nome,
           c.stato AS stato_convocazione, c.ruolo_servizio, c.id AS convocazione_id
    FROM convocazioni c
    JOIN gare g ON g.id = c.gara_id
    LEFT JOIN discipline d ON d.id = g.disciplina_id
    WHERE c.utente_id = ?
    ORDER BY g.data_gara DESC
  `).all(utente_id);
}

function crea(dati) {
  const risultato = db.prepare(`
    INSERT INTO gare (nome, disciplina_id, data_gara, ora_gara, luogo, indirizzo, lat, lng, stato, cronometristi_richiesti, note, creato_da)
    VALUES (@nome, @disciplina_id, @data_gara, @ora_gara, @luogo, @indirizzo, @lat, @lng, @stato, @cronometristi_richiesti, @note, @creato_da)
  `).run({
    ora_gara: null, luogo: null, indirizzo: null, lat: null, lng: null, stato: 'pianificata',
    cronometristi_richiesti: 1, note: null, ...dati
  });
  return trovaPerId(risultato.lastInsertRowid);
}

function aggiorna(id, dati) {
  const campiConsentiti = ['nome', 'disciplina_id', 'data_gara', 'ora_gara', 'luogo', 'indirizzo', 'lat', 'lng', 'stato', 'cronometristi_richiesti', 'note'];
  const campi = Object.keys(dati).filter((chiave) => campiConsentiti.includes(chiave));
  if (campi.length === 0) return trovaPerId(id);
  const setClause = campi.map((c) => `${c} = @${c}`).join(', ');
  db.prepare(`UPDATE gare SET ${setClause} WHERE id = @id`).run({ id, ...dati });
  return trovaPerId(id);
}

function elimina(id) {
  db.prepare('DELETE FROM gare WHERE id = ?').run(id);
}

module.exports = { trovaTutte, trovaPerId, trovaPerUtente, crea, aggiorna, elimina };
