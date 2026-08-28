// Gestione anagrafica utenti (cronometristi, designatori, presidente, admin)
const bcrypt = require('bcryptjs');
const utentiRepo = require('../repositories/utenti.repository');
const { geocodifica } = require('../services/geoService');
const asyncHandler = require('../utils/asyncHandler');

const RUOLI_VALIDI = ['admin', 'presidente', 'designatore', 'cronometrista'];

const elencaUtenti = asyncHandler(async (req, res) => {
  const { ruolo, attivo } = req.query;
  const utenti = utentiRepo.trovaTutti({
    ruolo: ruolo || undefined,
    attivo: attivo !== undefined ? attivo === '1' : undefined
  });
  res.json({ utenti });
});

const dettaglioUtente = asyncHandler(async (req, res) => {
  const utente = utentiRepo.trovaPerId(Number(req.params.id));
  if (!utente) return res.status(404).json({ errore: 'Utente non trovato.' });
  res.json({ utente });
});

const creaUtente = asyncHandler(async (req, res) => {
  const { nome, cognome, email, password, ruolo, telefono, qualifica, anni_esperienza, lat, lng } = req.body;

  if (!nome || !cognome || !email || !password || !ruolo) {
    return res.status(400).json({ errore: 'Nome, cognome, email, password e ruolo sono obbligatori.' });
  }
  if (!RUOLI_VALIDI.includes(ruolo)) {
    return res.status(400).json({ errore: 'Ruolo non valido.' });
  }
  if (utentiRepo.trovaPerEmail(email.trim().toLowerCase())) {
    return res.status(409).json({ errore: 'Esiste gia un utente con questa email.' });
  }

  const password_hash = await bcrypt.hash(password, 10);
  const utente = utentiRepo.crea({
    nome, cognome, email: email.trim().toLowerCase(), password_hash, ruolo,
    telefono: telefono || null, qualifica: qualifica || null,
    anni_esperienza: anni_esperienza || 0, lat: lat ?? null, lng: lng ?? null, attivo: 1
  });
  res.status(201).json({ utente });
});

const aggiornaUtente = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!utentiRepo.trovaPerId(id)) return res.status(404).json({ errore: 'Utente non trovato.' });

  const { ruolo } = req.body;
  if (ruolo && !RUOLI_VALIDI.includes(ruolo)) {
    return res.status(400).json({ errore: 'Ruolo non valido.' });
  }

  const utente = utentiRepo.aggiorna(id, req.body);
  res.json({ utente });
});

// Consente a un utente di aggiornare alcuni dati del proprio profilo (telefono,
// indirizzo e comune). Indirizzo e comune vengono geocodificati in lat/lng,
// coordinate usate dall'algoritmo di assegnazione per calcolare la distanza.
const aggiornaProfiloProprio = asyncHandler(async (req, res) => {
  const id = req.session.utente.id;
  const { telefono, indirizzo, comune } = req.body;

  const datiAggiornamento = {
    telefono: telefono ?? null,
    indirizzo: indirizzo ?? null,
    comune: comune ?? null
  };

  if (indirizzo || comune) {
    const coordinate = await geocodifica(indirizzo, comune);
    if (!coordinate) {
      return res.status(400).json({
        errore: 'Impossibile determinare le coordinate per l\'indirizzo indicato. Verifica indirizzo e comune, oppure contatta l\'amministratore.'
      });
    }
    datiAggiornamento.lat = coordinate.lat;
    datiAggiornamento.lng = coordinate.lng;
  } else {
    datiAggiornamento.lat = null;
    datiAggiornamento.lng = null;
  }

  const utente = utentiRepo.aggiorna(id, datiAggiornamento);
  res.json({ utente });
});

const cambiaPassword = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { password } = req.body;
  const utenteSessione = req.session.utente;
  if (utenteSessione.id !== id && utenteSessione.ruolo !== 'admin') {
    return res.status(403).json({ errore: 'Puoi modificare solo la tua password.' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ errore: 'La password deve avere almeno 6 caratteri.' });
  }
  if (!utentiRepo.trovaPerId(id)) return res.status(404).json({ errore: 'Utente non trovato.' });

  const password_hash = await bcrypt.hash(password, 10);
  utentiRepo.aggiornaPassword(id, password_hash);
  res.status(204).end();
});

const eliminaUtente = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!utentiRepo.trovaPerId(id)) return res.status(404).json({ errore: 'Utente non trovato.' });
  utentiRepo.elimina(id);
  res.status(204).end();
});

module.exports = {
  elencaUtenti, dettaglioUtente, creaUtente, aggiornaUtente,
  aggiornaProfiloProprio, cambiaPassword, eliminaUtente
};
