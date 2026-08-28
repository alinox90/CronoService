const express = require('express');
const convocazioniController = require('../controllers/convocazioni.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// Le proprie convocazioni (vista personale del cronometrista)
router.get('/mie', convocazioniController.mieConvocazioni);

// Vista globale su tutte le convocazioni (designatore/admin/presidente)
router.get('/', requireRole('admin', 'designatore', 'presidente'), convocazioniController.elencaTutte);

// Conferma/rifiuto (proprietario) o cambio stato/sostituzione (designatore/admin) - verificato nel controller
router.put('/:id', convocazioniController.aggiornaStato);

router.delete('/:id', requireRole('admin', 'designatore'), convocazioniController.elimina);

module.exports = router;
