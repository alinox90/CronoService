// Gestione dell'inventario attrezzature e della loro assegnazione alle gare
const attrezzatureRepo = require('../repositories/attrezzature.repository');
const asyncHandler = require('../utils/asyncHandler');

const elenca = asyncHandler(async (req, res) => {
  const { stato } = req.query;
  res.json({
    attrezzature: attrezzatureRepo.trovaTutte({
      stato: stato || undefined
    })
  });
});

const dettaglio = asyncHandler(async (req, res) => {
  const attrezzatura = attrezzatureRepo.trovaPerId(Number(req.params.id));
  if (!attrezzatura) return res.status(404).json({ errore: 'Attrezzatura non trovata.' });
  res.json({ attrezzatura });
});

const crea = asyncHandler(async (req, res) => {
  const { nome } = req.body;
  if (!nome) return res.status(400).json({ errore: 'Il nome dell\'attrezzatura e obbligatorio.' });
  const attrezzatura = attrezzatureRepo.crea(req.body);
  res.status(201).json({ attrezzatura });
});

const aggiorna = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!attrezzatureRepo.trovaPerId(id)) return res.status(404).json({ errore: 'Attrezzatura non trovata.' });
  res.json({ attrezzatura: attrezzatureRepo.aggiorna(id, req.body) });
});

const elimina = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!attrezzatureRepo.trovaPerId(id)) return res.status(404).json({ errore: 'Attrezzatura non trovata.' });
  attrezzatureRepo.elimina(id);
  res.status(204).end();
});

const assegnaAGara = asyncHandler(async (req, res) => {
  const { attrezzatura_id, gara_id } = req.body;
  if (!attrezzatura_id || !gara_id) {
    return res.status(400).json({ errore: 'Specificare attrezzatura_id e gara_id.' });
  }
  const attrezzatura = attrezzatureRepo.trovaPerId(attrezzatura_id);
  if (!attrezzatura) return res.status(404).json({ errore: 'Attrezzatura non trovata.' });
  if (attrezzatura.stato !== 'disponibile') {
    return res.status(409).json({ errore: 'L\'attrezzatura non e disponibile.' });
  }
  const assegnazione = attrezzatureRepo.assegnaAGara(attrezzatura_id, gara_id);
  res.status(201).json({ assegnazione });
});

const restituisci = asyncHandler(async (req, res) => {
  const assegnazione = attrezzatureRepo.restituisciDaGara(Number(req.params.assegnazione_id));
  if (!assegnazione) return res.status(404).json({ errore: 'Assegnazione non trovata.' });
  res.json({ assegnazione });
});

module.exports = { elenca, dettaglio, crea, aggiorna, elimina, assegnaAGara, restituisci };
