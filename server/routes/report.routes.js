const express = require('express');
const reportController = require('../controllers/report.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);
router.use(requireRole('admin', 'presidente', 'designatore'));

router.get('/riepilogo', reportController.riepilogo);
router.get('/servizi-per-cronometrista', reportController.serviziPerCronometrista);
router.get('/ore-servizio', reportController.oreServizio);
router.get('/utilizzo-attrezzature', reportController.utilizzoAttrezzature);

module.exports = router;
