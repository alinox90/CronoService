const express = require('express');
const disponibilitaController = require('../controllers/disponibilita.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', disponibilitaController.elenca);
router.get('/utente/:utente_id', requireRole('admin', 'designatore', 'presidente'), disponibilitaController.perUtente);
router.post('/', disponibilitaController.crea);
router.delete('/:id', disponibilitaController.elimina);

module.exports = router;
