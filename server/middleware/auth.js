// Middleware di autenticazione e controllo dei permessi basato sui ruoli (RBAC)

// Verifica che l'utente abbia effettuato il login (sessione attiva)
function requireAuth(req, res, next) {
  if (!req.session || !req.session.utente) {
    return res.status(401).json({ errore: 'Autenticazione richiesta. Effettuare il login.' });
  }
  next();
}

// Verifica che il ruolo dell'utente sia tra quelli consentiti per la rotta
function requireRole(...ruoliConsentiti) {
  return (req, res, next) => {
    if (!req.session || !req.session.utente) {
      return res.status(401).json({ errore: 'Autenticazione richiesta. Effettuare il login.' });
    }
    if (!ruoliConsentiti.includes(req.session.utente.ruolo)) {
      return res.status(403).json({ errore: 'Non hai i permessi necessari per eseguire questa operazione.' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
