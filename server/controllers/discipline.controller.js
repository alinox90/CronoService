// Gestione delle discipline sportive
const disciplineRepo = require('../repositories/discipline.repository');
const asyncHandler = require('../utils/asyncHandler');

const elenca = asyncHandler(async (req, res) => {
  res.json({ discipline: disciplineRepo.trovaTutte() });
});

const crea = asyncHandler(async (req, res) => {
  const { nome } = req.body;
  if (!nome) return res.status(400).json({ errore: 'Il nome della disciplina e obbligatorio.' });
  const disciplina = disciplineRepo.crea(req.body);
  res.status(201).json({ disciplina });
});

const aggiorna = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!disciplineRepo.trovaPerId(id)) return res.status(404).json({ errore: 'Disciplina non trovata.' });
  res.json({ disciplina: disciplineRepo.aggiorna(id, req.body) });
});

const elimina = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!disciplineRepo.trovaPerId(id)) return res.status(404).json({ errore: 'Disciplina non trovata.' });
  disciplineRepo.elimina(id);
  res.status(204).end();
});

module.exports = { elenca, crea, aggiorna, elimina };
