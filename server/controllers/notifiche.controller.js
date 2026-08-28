// Centro notifiche in-app dell'utente autenticato
const notificheRepo = require('../repositories/notifiche.repository');
const asyncHandler = require('../utils/asyncHandler');

const mieNotifiche = asyncHandler(async (req, res) => {
  const soloNonLette = req.query.non_lette === '1';
  const notifiche = notificheRepo.trovaPerUtente(req.session.utente.id, { soloNonLette });
  const nonLette = notificheRepo.contaNonLette(req.session.utente.id);
  res.json({ notifiche, nonLette });
});

const segnaComeLetta = asyncHandler(async (req, res) => {
  const notifica = notificheRepo.segnaComeLetta(Number(req.params.id), req.session.utente.id);
  res.json({ notifica });
});

const segnaTutteComeLette = asyncHandler(async (req, res) => {
  notificheRepo.segnaTutteComeLette(req.session.utente.id);
  res.status(204).end();
});

module.exports = { mieNotifiche, segnaComeLetta, segnaTutteComeLette };
