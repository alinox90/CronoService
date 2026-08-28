const express = require('express');
const risultatiController = require('../controllers/risultati.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.put('/:id', requireRole('admin', 'designatore'), risultatiController.aggiorna);
router.delete('/:id', requireRole('admin', 'designatore'), risultatiController.elimina);

module.exports = router;
