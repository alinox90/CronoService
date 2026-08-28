const express = require('express');
const disciplineController = require('../controllers/discipline.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', disciplineController.elenca);
router.post('/', requireRole('admin'), disciplineController.crea);
router.put('/:id', requireRole('admin'), disciplineController.aggiorna);
router.delete('/:id', requireRole('admin'), disciplineController.elimina);

module.exports = router;
