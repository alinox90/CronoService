const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Limita i tentativi di login per mitigare attacchi di forza bruta
const limitatoreLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { errore: 'Troppi tentativi di accesso. Riprova tra qualche minuto.' }
});

router.post('/login', limitatoreLogin, authController.login);
router.post('/logout', requireAuth, authController.logout);
router.get('/me', authController.me);

module.exports = router;
