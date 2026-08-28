// Autenticazione: login, logout, recupero utente corrente
const bcrypt = require('bcryptjs');
const utentiRepo = require('../repositories/utenti.repository');
const asyncHandler = require('../utils/asyncHandler');

function serializzaUtenteSessione(utente) {
  return {
    id: utente.id,
    nome: utente.nome,
    cognome: utente.cognome,
    email: utente.email,
    ruolo: utente.ruolo
  };
}

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ errore: 'Email e password sono obbligatorie.' });
  }

  const utente = utentiRepo.trovaPerEmail(email.trim().toLowerCase());
  if (!utente || !utente.attivo) {
    return res.status(401).json({ errore: 'Credenziali non valide.' });
  }

  const passwordCorretta = await bcrypt.compare(password, utente.password_hash);
  if (!passwordCorretta) {
    return res.status(401).json({ errore: 'Credenziali non valide.' });
  }

  req.session.utente = serializzaUtenteSessione(utente);
  res.json({ utente: req.session.utente });
});

const logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.status(204).end();
  });
};

const me = (req, res) => {
  if (!req.session || !req.session.utente) {
    return res.status(401).json({ errore: 'Nessuna sessione attiva.' });
  }
  res.json({ utente: req.session.utente });
};

module.exports = { login, logout, me };
