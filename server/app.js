// Configurazione dell'applicazione Express: middleware di sicurezza, sessioni,
// file statici del frontend e montaggio delle rotte API REST.
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const session = require('express-session');
const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet({
  // Consente il caricamento di script/stili locali senza dover configurare
  // una Content-Security-Policy dettagliata per un prototipo di tesi
  contentSecurityPolicy: false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000 // 8 ore
  }
}));

// --- Rotte API ---
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/utenti', require('./routes/utenti.routes'));
app.use('/api/discipline', require('./routes/discipline.routes'));
app.use('/api/gare', require('./routes/gare.routes'));
app.use('/api/convocazioni', require('./routes/convocazioni.routes'));
app.use('/api/attrezzature', require('./routes/attrezzature.routes'));
app.use('/api/risultati', require('./routes/risultati.routes'));
app.use('/api/disponibilita', require('./routes/disponibilita.routes'));
app.use('/api/notifiche', require('./routes/notifiche.routes'));
app.use('/api/report', require('./routes/report.routes'));

app.use('/api', (req, res) => {
  res.status(404).json({ errore: 'Risorsa API non trovata.' });
});

// --- Frontend statico (HTML, CSS, JS vanilla) ---
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use(errorHandler);

module.exports = app;
