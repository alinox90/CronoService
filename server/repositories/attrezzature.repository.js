// Query SQL relative alla tabella "attrezzature" e alla loro assegnazione alle gare
const db = require('../config/database');

function trovaTutte({ stato } = {}) {
  let query = `SELECT a.* FROM attrezzature a WHERE 1 = 1`;
  const parametri = [];
  if (stato) { query += ' AND a.stato = ?'; parametri.push(stato); }
  query += ' ORDER BY a.nome';
  return db.prepare(query).all(...parametri);
}

function trovaPerId(id) {
  return db.prepare('SELECT a.* FROM attrezzature a WHERE a.id = ?').get(id);
}

function crea(dati) {
  const risultato = db.prepare(`
    INSERT INTO attrezzature (nome, tipo, numero_serie, stato, note)
    VALUES (@nome, @tipo, @numero_serie, @stato, @note)
  `).run({ tipo: null, numero_serie: null, stato: 'disponibile', note: null, ...dati });
  return trovaPerId(risultato.lastInsertRowid);
}

function aggiorna(id, dati) {
  const campiConsentiti = ['nome', 'tipo', 'numero_serie', 'stato', 'note'];
  const campi = Object.keys(dati).filter((chiave) => campiConsentiti.includes(chiave));
  if (campi.length === 0) return trovaPerId(id);
  const setClause = campi.map((c) => `${c} = @${c}`).join(', ');
  db.prepare(`UPDATE attrezzature SET ${setClause} WHERE id = @id`).run({ id, ...dati });
  return trovaPerId(id);
}

function elimina(id) {
  db.prepare('DELETE FROM attrezzature WHERE id = ?').run(id);
}

function trovaAssegnazioniPerGara(gara_id) {
  return db.prepare(`
    SELECT ag.*, a.nome, a.tipo, a.numero_serie
    FROM attrezzature_gare ag
    JOIN attrezzature a ON a.id = ag.attrezzatura_id
    WHERE ag.gara_id = ?
  `).all(gara_id);
}

function assegnaAGara(attrezzatura_id, gara_id) {
  const risultato = db.prepare('INSERT INTO attrezzature_gare (attrezzatura_id, gara_id) VALUES (?, ?)').run(attrezzatura_id, gara_id);
  db.prepare("UPDATE attrezzature SET stato = 'in_uso' WHERE id = ?").run(attrezzatura_id);
  return db.prepare('SELECT * FROM attrezzature_gare WHERE id = ?').get(risultato.lastInsertRowid);
}

function restituisciDaGara(assegnazione_id) {
  const assegnazione = db.prepare('SELECT * FROM attrezzature_gare WHERE id = ?').get(assegnazione_id);
  if (!assegnazione) return null;
  db.prepare("UPDATE attrezzature_gare SET data_restituzione = datetime('now') WHERE id = ?").run(assegnazione_id);
  db.prepare("UPDATE attrezzature SET stato = 'disponibile' WHERE id = ?").run(assegnazione.attrezzatura_id);
  return db.prepare('SELECT * FROM attrezzature_gare WHERE id = ?').get(assegnazione_id);
}

// Numero di assegnazioni per attrezzatura, usato dal report "utilizzo attrezzature"
function contaUtilizzoPerAttrezzatura() {
  return db.prepare(`
    SELECT a.id, a.nome, a.tipo, COUNT(ag.id) AS numero_utilizzi
    FROM attrezzature a
    LEFT JOIN attrezzature_gare ag ON ag.attrezzatura_id = a.id
    GROUP BY a.id
    ORDER BY numero_utilizzi DESC
  `).all();
}

module.exports = {
  trovaTutte, trovaPerId, crea, aggiorna, elimina,
  trovaAssegnazioniPerGara, assegnaAGara, restituisciDaGara, contaUtilizzoPerAttrezzatura
};
