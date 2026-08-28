const express = require('express');
const gareController = require('../controllers/gare.controller');
const convocazioniController = require('../controllers/convocazioni.controller');
const risultatiController = require('../controllers/risultati.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// Calendario gare - lettura consentita a tutti i ruoli autenticati
router.get('/', gareController.elenca);
router.get('/mie', gareController.mieGare);
router.get('/:id', gareController.dettaglio);
router.get('/:id/dettaglio', gareController.dettaglioCompleto);

// Gestione gare - riservata a designatore e amministratore
router.post('/', requireRole('admin', 'designatore'), gareController.crea);
router.put('/:id', requireRole('admin', 'designatore'), gareController.aggiorna);
router.delete('/:id', requireRole('admin'), gareController.elimina);

// Algoritmo intelligente di assegnazione: suggerimenti per la gara
router.get('/:id/suggerimenti', requireRole('admin', 'designatore'), gareController.suggerimenti);

// Convocazioni relative a una gara
router.get('/:gara_id/convocazioni', convocazioniController.elencaPerGara);
router.post('/:gara_id/convocazioni', requireRole('admin', 'designatore'), convocazioniController.crea);

// Risultati relativi a una gara
router.get('/:gara_id/risultati', risultatiController.elencaPerGara);
router.post('/:gara_id/risultati', requireRole('admin', 'designatore'), risultatiController.crea);

module.exports = router;
