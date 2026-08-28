const express = require('express');
const utentiController = require('../controllers/utenti.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// Lettura: admin, presidente e designatore devono poter consultare l'anagrafica
router.get('/', requireRole('admin', 'presidente', 'designatore'), utentiController.elencaUtenti);
// Il dettaglio di un utente e' visibile a chi gestisce l'anagrafica oppure al proprietario del profilo stesso
router.get('/:id', (req, res, next) => {
  const utenteSessione = req.session.utente;
  if (['admin', 'presidente', 'designatore'].includes(utenteSessione.ruolo) || utenteSessione.id === Number(req.params.id)) {
    return next();
  }
  return res.status(403).json({ errore: 'Non hai i permessi necessari per eseguire questa operazione.' });
}, utentiController.dettaglioUtente);

// Scrittura: gestione utenti e ruoli riservata all'amministratore di sistema
router.post('/', requireRole('admin'), utentiController.creaUtente);
router.put('/:id', requireRole('admin'), utentiController.aggiornaUtente);
router.delete('/:id', requireRole('admin'), utentiController.eliminaUtente);

// Cambio password: consentito all'utente stesso o all'amministratore (verificato nel controller)
router.put('/:id/password', utentiController.cambiaPassword);

// Aggiornamento del proprio profilo (telefono e coordinate)
router.put('/me/profilo', utentiController.aggiornaProfiloProprio);

module.exports = router;
