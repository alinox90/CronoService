// Invio email tramite nodemailer. Se non sono configurate credenziali SMTP
// nel file .env, le email vengono solo simulate e scritte nei log del server
// (utile per sviluppo/demo senza dover configurare un vero account email).
const nodemailer = require('nodemailer');
const env = require('../config/env');

const smtpConfigurato = Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);

const transporter = smtpConfigurato
  ? nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: { user: env.smtp.user, pass: env.smtp.pass }
    })
  : nodemailer.createTransport({ jsonTransport: true });

async function inviaEmail({ to, subject, text, html }) {
  const info = await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject,
    text,
    html: html || `<p>${text}</p>`
  });

  if (!smtpConfigurato) {
    console.log(`[Email simulata - SMTP non configurato] A: ${to} | Oggetto: ${subject}`);
  }

  return info;
}

module.exports = { inviaEmail, smtpConfigurato };
