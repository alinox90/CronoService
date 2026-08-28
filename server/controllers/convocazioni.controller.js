// Gestione delle convocazioni: assegnazione dei cronometristi alle gare,
// conferma/rifiuto da parte del cronometrista, sostituzioni.
const convocazioniRepo = require('../repositories/convocazioni.repository');
const gareRepo = require('../repositories/gare.repository');
const { notificaUtente } = require('../services/notificheService');
const asyncHandler = require('../utils/asyncHandler');

const STATI_VALIDI = ['proposta', 'confermata', 'rifiutata', 'sostituita', 'completata'];

const elencaPerGara = asyncHandler(async (req, res) => {
  res.json({ convocazioni: convocazioniRepo.trovaPerGara(Number(req.params.gara_id)) });
});

const mieConvocazioni = asyncHandler(async (req, res) => {
  res.json({ convocazioni: convocazioniRepo.trovaPerUtente(req.session.utente.id) });
});

// Vista globale per designatore/admin/presidente
const elencaTutte = asyncHandler(async (req, res) => {
  res.json({ convocazioni: convocazioniRepo.trovaTutte({ stato: req.query.stato || undefined }) });
});

// Convoca manualmente un cronometrista per una gara (creato dal designatore,
// eventualmente a partire da un suggerimento dell'algoritmo di assegnazione)
const crea = asyncHandler(async (req, res) => {
  const gara_id = Number(req.params.gara_id);
  const { utente_id, ruolo_servizio, punteggio_assegnazione, note } = req.body;

  const gara = gareRepo.trovaPerId(gara_id);
  if (!gara) return res.status(404).json({ errore: 'Gara non trovata.' });
  if (!utente_id) return res.status(400).json({ errore: 'Specificare il cronometrista da convocare.' });

  const conflitti = convocazioniRepo.trovaConflittiData(utente_id, gara.data_gara, gara_id);
  if (conflitti.length > 0) {
    return res.status(409).json({ errore: 'Il cronometrista ha gia una convocazione in questa data.' });
  }

  const convocazione = convocazioniRepo.crea({
    gara_id, utente_id, ruolo_servizio: ruolo_servizio || null,
    stato: 'proposta', punteggio_assegnazione: punteggio_assegnazione ?? null, note: note || null
  });

  await notificaUtente({
    utente_id,
    titolo: 'Nuova convocazione',
    messaggio: `Sei stato convocato per "${gara.nome}" il ${gara.data_gara}. Conferma o rifiuta dalla tua area personale.`,
    tipo: 'convocazione',
    link: `/pages/gara-dettaglio.html?id=${gara_id}`
  });

  res.status(201).json({ convocazione });
});

// Il cronometrista conferma o rifiuta una propria convocazione; il
// designatore/admin puo' invece cambiarne lo stato (es. sostituzione)
const aggiornaStato = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { stato, note } = req.body;

  const convocazione = convocazioniRepo.trovaPerId(id);
  if (!convocazione) return res.status(404).json({ errore: 'Convocazione non trovata.' });
  if (!STATI_VALIDI.includes(stato)) return res.status(400).json({ errore: 'Stato non valido.' });

  const utenteSessione = req.session.utente;
  const eProprietario = convocazione.utente_id === utenteSessione.id;
  const puoGestireTutte = ['admin', 'designatore'].includes(utenteSessione.ruolo);

  if (!eProprietario && !puoGestireTutte) {
    return res.status(403).json({ errore: 'Non puoi modificare questa convocazione.' });
  }
  // Il cronometrista puo' solo confermare o rifiutare la propria convocazione
  if (eProprietario && !puoGestireTutte && !['confermata', 'rifiutata'].includes(stato)) {
    return res.status(403).json({ errore: 'Puoi solo confermare o rifiutare la convocazione.' });
  }

  const aggiornata = convocazioniRepo.aggiorna(id, {
    stato, note: note ?? convocazione.note, data_risposta: new Date().toISOString()
  });

  const gara = gareRepo.trovaPerId(convocazione.gara_id);
  if (eProprietario) {
    // Notifica il designatore/creatore della gara della risposta ricevuta
    if (gara && gara.creato_da) {
      await notificaUtente({
        utente_id: gara.creato_da,
        titolo: `Convocazione ${stato}`,
        messaggio: `${convocazione.utente_nome} ${convocazione.utente_cognome} ha ${stato === 'confermata' ? 'confermato' : 'rifiutato'} la convocazione per "${gara.nome}".`,
        tipo: 'convocazione',
        link: `/pages/gara-dettaglio.html?id=${convocazione.gara_id}`,
        inviaEmailAnche: false
      });
    }
  } else if (stato === 'sostituita') {
    await notificaUtente({
      utente_id: convocazione.utente_id,
      titolo: 'Convocazione sostituita',
      messaggio: `Sei stato sostituito nella convocazione per "${gara ? gara.nome : ''}".`,
      tipo: 'convocazione',
      link: `/pages/gara-dettaglio.html?id=${convocazione.gara_id}`
    });
  }

  res.json({ convocazione: aggiornata });
});

const elimina = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!convocazioniRepo.trovaPerId(id)) return res.status(404).json({ errore: 'Convocazione non trovata.' });
  convocazioniRepo.elimina(id);
  res.status(204).end();
});

module.exports = { elencaPerGara, elencaTutte, mieConvocazioni, crea, aggiornaStato, elimina };
