// Gestione del calendario gare
const gareRepo = require('../repositories/gare.repository');
const convocazioniRepo = require('../repositories/convocazioni.repository');
const attrezzatureRepo = require('../repositories/attrezzature.repository');
const risultatiRepo = require('../repositories/risultati.repository');
const { calcolaSuggerimenti } = require('../services/assegnazioneService');
const asyncHandler = require('../utils/asyncHandler');

const elenca = asyncHandler(async (req, res) => {
  const { disciplina_id, stato, da, a } = req.query;
  const gare = gareRepo.trovaTutte({
    disciplina_id: disciplina_id ? Number(disciplina_id) : undefined,
    stato: stato || undefined,
    da: da || undefined,
    a: a || undefined
  });
  res.json({ gare });
});

const dettaglio = asyncHandler(async (req, res) => {
  const gara = gareRepo.trovaPerId(Number(req.params.id));
  if (!gara) return res.status(404).json({ errore: 'Gara non trovata.' });
  res.json({ gara });
});

// Dettaglio aggregato: gara + convocazioni + attrezzature assegnate + risultati
const dettaglioCompleto = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const gara = gareRepo.trovaPerId(id);
  if (!gara) return res.status(404).json({ errore: 'Gara non trovata.' });

  res.json({
    gara,
    convocazioni: convocazioniRepo.trovaPerGara(id),
    attrezzature: attrezzatureRepo.trovaAssegnazioniPerGara(id),
    risultati: risultatiRepo.trovaPerGara(id)
  });
});

const mieGare = asyncHandler(async (req, res) => {
  res.json({ gare: gareRepo.trovaPerUtente(req.session.utente.id) });
});

const crea = asyncHandler(async (req, res) => {
  const { nome, data_gara } = req.body;
  if (!nome || !data_gara) return res.status(400).json({ errore: 'Nome e data della gara sono obbligatori.' });
  const gara = gareRepo.crea({ ...req.body, creato_da: req.session.utente.id });
  res.status(201).json({ gara });
});

const aggiorna = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!gareRepo.trovaPerId(id)) return res.status(404).json({ errore: 'Gara non trovata.' });
  res.json({ gara: gareRepo.aggiorna(id, req.body) });
});

const elimina = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!gareRepo.trovaPerId(id)) return res.status(404).json({ errore: 'Gara non trovata.' });
  gareRepo.elimina(id);
  res.status(204).end();
});

// Algoritmo intelligente di assegnazione: restituisce i cronometristi
// suggeriti per la gara, ordinati per punteggio di idoneita
const suggerimenti = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const risultato = calcolaSuggerimenti(id);
  res.json(risultato);
});

module.exports = { elenca, dettaglio, dettaglioCompleto, mieGare, crea, aggiorna, elimina, suggerimenti };
