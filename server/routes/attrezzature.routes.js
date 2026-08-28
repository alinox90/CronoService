const express = require('express');
const attrezzatureController = require('../controllers/attrezzature.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', attrezzatureController.elenca);
router.get('/:id', attrezzatureController.dettaglio);

router.post('/', requireRole('admin', 'designatore'), attrezzatureController.crea);
router.put('/:id', requireRole('admin', 'designatore'), attrezzatureController.aggiorna);
router.delete('/:id', requireRole('admin'), attrezzatureController.elimina);

router.post('/assegna', requireRole('admin', 'designatore'), attrezzatureController.assegnaAGara);
router.put('/assegnazioni/:assegnazione_id/restituisci', requireRole('admin', 'designatore'), attrezzatureController.restituisci);

module.exports = router;
