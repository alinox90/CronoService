// Caricamento centralizzato delle variabili d'ambiente (.env) con valori di default
require('dotenv').config();

const path = require('path');

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  sessionSecret: process.env.SESSION_SECRET || 'modifica-questo-segreto-in-produzione',
  dbPath: path.resolve(process.cwd(), process.env.DB_PATH || './data/crono-service.db'),
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'Crono Service <no-reply@cronoservice.it>'
  }
};
