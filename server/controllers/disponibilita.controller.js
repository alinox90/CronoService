// Gestione della disponibilita/indisponibilita dichiarata dai cronometristi
const disponibilitaRepo = require('../repositories/disponibilita.repository');
const asyncHandler = require('../utils/asyncHandler');

// Il designatore/admin vede tutte le disponibilita, il cronometrista solo le proprie
const elenca = asyncHandler(async (req, res) => {
  const utenteSessione = req.session.utente;
  if (['admin', 'designatore', 'presidente'].includes(utenteSessione.ruolo)) {
    return res.json({ disponibilita: disponibilitaRepo.trovaTutte() });
  }
  res.json({ disponibilita: disponibilitaRepo.trovaPerUtente(utenteSessione.id) });
});

const perUtente = asyncHandler(async (req, res) => {
  res.json({ disponibilita: disponibilitaRepo.trovaPerUtente(Number(req.params.utente_id)) });
});

const crea = asyncHandler(async (req, res) => {
  const { data_inizio, data_fine, tipo } = req.body;
  if (!data_inizio || !data_fine) {
    return res.status(400).json({ errore: 'Data inizio e data fine sono obbligatorie.' });
  }
  if (tipo && !['disponibile', 'non_disponibile'].includes(tipo)) {
    return res.status(400).json({ errore: 'Tipo non valido.' });
  }

  const utenteSessione = req.session.utente;
  // Un cronometrista puo' dichiarare solo la propria disponibilita
  const utente_id = ['admin', 'designatore'].includes(utenteSessione.ruolo) && req.body.utente_id
    ? req.body.utente_id
    : utenteSessione.id;

  const voce = disponibilitaRepo.crea({ ...req.body, utente_id });
  res.status(201).json({ disponibilita: voce });
});

const elimina = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const voce = disponibilitaRepo.trovaPerId(id);
  if (!voce) return res.status(404).json({ errore: 'Voce di disponibilita non trovata.' });

  const utenteSessione = req.session.utente;
  const puoGestireTutte = ['admin', 'designatore'].includes(utenteSessione.ruolo);
  if (voce.utente_id !== utenteSessione.id && !puoGestireTutte) {
    return res.status(403).json({ errore: 'Non puoi eliminare questa voce.' });
  }

  disponibilitaRepo.elimina(id);
  res.status(204).end();
});

module.exports = { elenca, perUtente, crea, elimina };
