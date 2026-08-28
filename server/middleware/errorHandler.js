// Gestore centralizzato degli errori non catturati nelle rotte
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error('[Errore]', err);

  if (err && err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({ errore: 'Valore duplicato: la risorsa esiste gia.' });
  }
  if (err && err.code && err.code.startsWith('SQLITE_CONSTRAINT')) {
    return res.status(400).json({ errore: 'Dati non validi rispetto ai vincoli del database.' });
  }

  const status = err.status || 500;
  res.status(status).json({ errore: err.message || 'Errore interno del server.' });
}

module.exports = errorHandler;
