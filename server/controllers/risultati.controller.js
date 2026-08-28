// Gestione dei risultati registrati per ciascuna gara
const risultatiRepo = require('../repositories/risultati.repository');
const gareRepo = require('../repositories/gare.repository');
const asyncHandler = require('../utils/asyncHandler');

const elencaPerGara = asyncHandler(async (req, res) => {
  res.json({ risultati: risultatiRepo.trovaPerGara(Number(req.params.gara_id)) });
});

const crea = asyncHandler(async (req, res) => {
  const gara_id = Number(req.params.gara_id);
  const { atleta_nome } = req.body;
  if (!gareRepo.trovaPerId(gara_id)) return res.status(404).json({ errore: 'Gara non trovata.' });
  if (!atleta_nome) return res.status(400).json({ errore: 'Il nome dell\'atleta e obbligatorio.' });

  const risultato = risultatiRepo.crea({ ...req.body, gara_id });
  res.status(201).json({ risultato });
});

const aggiorna = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!risultatiRepo.trovaPerId(id)) return res.status(404).json({ errore: 'Risultato non trovato.' });
  res.json({ risultato: risultatiRepo.aggiorna(id, req.body) });
});

const elimina = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!risultatiRepo.trovaPerId(id)) return res.status(404).json({ errore: 'Risultato non trovato.' });
  risultatiRepo.elimina(id);
  res.status(204).end();
});

module.exports = { elencaPerGara, crea, aggiorna, elimina };
