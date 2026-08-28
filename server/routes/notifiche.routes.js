const express = require('express');
const notificheController = require('../controllers/notifiche.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', notificheController.mieNotifiche);
router.put('/:id/letta', notificheController.segnaComeLetta);
router.put('/tutte/lette', notificheController.segnaTutteComeLette);

module.exports = router;
