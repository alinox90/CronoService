// Servizio di notifica: crea la notifica in-app e, in aggiunta, prova a
// inviare una email di cortesia (che verra' solo simulata se l'SMTP non e'
// configurato, vedi emailService.js).
const notificheRepo = require('../repositories/notifiche.repository');
const utentiRepo = require('../repositories/utenti.repository');
const { inviaEmail } = require('./emailService');

async function notificaUtente({ utente_id, titolo, messaggio, tipo = 'info', link = null, inviaEmailAnche = true }) {
  const notifica = notificheRepo.crea({ utente_id, titolo, messaggio, tipo, link });

  if (inviaEmailAnche) {
    const utente = utentiRepo.trovaPerId(utente_id);
    if (utente && utente.email) {
      try {
        await inviaEmail({ to: utente.email, subject: `Crono Service: ${titolo}`, text: messaggio });
      } catch (errore) {
        console.error('[Notifiche] Impossibile inviare l\'email di notifica:', errore.message);
      }
    }
  }

  return notifica;
}

module.exports = { notificaUtente };
