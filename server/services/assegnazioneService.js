// Sistema intelligente di assegnazione dei cronometristi alle gare.
//
// Per ogni gara calcola, per ciascun cronometrista attivo, un punteggio di
// idoneita basato su piu fattori (disponibilita, distanza geografica,
// esperienza, equa distribuzione dei servizi) ed esclude a priori chi ha
// conflitti di calendario o ha dichiarato indisponibilita per quella data.
// Il risultato e' un elenco ordinato di suggerimenti: la decisione finale
// di convocazione resta comunque al designatore dei servizi.
const utentiRepo = require('../repositories/utenti.repository');
const gareRepo = require('../repositories/gare.repository');
const convocazioniRepo = require('../repositories/convocazioni.repository');
const disponibilitaRepo = require('../repositories/disponibilita.repository');
const { calcolaDistanzaKm } = require('./geoService');

// Pesi relativi dei singoli fattori nel punteggio finale (la somma e' 1)
const PESI = {
  distanza: 0.35,
  esperienza: 0.25,
  equaDistribuzione: 0.25,
  disponibilitaDichiarata: 0.15
};

const GIORNI_FINESTRA_EQUITA = 180; // periodo su cui si valuta il carico di servizi recente

function dataMenoGiorni(dataISO, giorni) {
  const data = new Date(dataISO);
  data.setDate(data.getDate() - giorni);
  return data.toISOString().slice(0, 10);
}

// Converte la distanza in km in un punteggio 0-100 (decadimento morbido: piu vicino = punteggio piu alto)
function punteggioDaDistanza(distanzaKm) {
  if (distanzaKm == null) return 50; // punteggio neutro se non si conoscono le coordinate
  return Math.round((100 / (1 + distanzaKm / 50)) * 10) / 10;
}

function punteggioDaEsperienza(anniEsperienza) {
  return Math.min(100, Math.round((anniEsperienza || 0) * 5 * 10) / 10);
}

function punteggioDaEquita(serviziRecenti) {
  return Math.max(0, 100 - serviziRecenti * 15);
}

function calcolaSuggerimenti(gara_id) {
  const gara = gareRepo.trovaPerId(gara_id);
  if (!gara) {
    const errore = new Error('Gara non trovata.');
    errore.status = 404;
    throw errore;
  }

  const candidati = utentiRepo.trovaTutti({ ruolo: 'cronometrista', attivo: 1 });
  const dataLimiteEquita = dataMenoGiorni(gara.data_gara, GIORNI_FINESTRA_EQUITA);

  const risultati = candidati.map((utente) => {
    const motiviEsclusione = [];

    const conflitti = convocazioniRepo.trovaConflittiData(utente.id, gara.data_gara, gara.id);
    if (conflitti.length > 0) {
      motiviEsclusione.push('Gia convocato per un\'altra gara nella stessa data');
    }

    if (disponibilitaRepo.eIndisponibile(utente.id, gara.data_gara)) {
      motiviEsclusione.push('Ha dichiarato indisponibilita per questa data');
    }

    const distanzaKm = calcolaDistanzaKm(utente.lat, utente.lng, gara.lat, gara.lng);
    const disponibilitaDichiarata = disponibilitaRepo.eDisponibile(utente.id, gara.data_gara);
    const serviziRecenti = convocazioniRepo.contaServiziRecenti(utente.id, dataLimiteEquita);

    const fattori = {
      distanza: punteggioDaDistanza(distanzaKm),
      esperienza: punteggioDaEsperienza(utente.anni_esperienza),
      equaDistribuzione: punteggioDaEquita(serviziRecenti),
      disponibilitaDichiarata: disponibilitaDichiarata ? 100 : 40
    };

    const punteggioTotale = Math.round(
      (fattori.distanza * PESI.distanza +
        fattori.esperienza * PESI.esperienza +
        fattori.equaDistribuzione * PESI.equaDistribuzione +
        fattori.disponibilitaDichiarata * PESI.disponibilitaDichiarata) * 10
    ) / 10;

    return {
      utente: {
        id: utente.id,
        nome: utente.nome,
        cognome: utente.cognome,
        qualifica: utente.qualifica,
        anni_esperienza: utente.anni_esperienza
      },
      idoneo: motiviEsclusione.length === 0,
      motiviEsclusione,
      distanzaKm: distanzaKm != null ? Math.round(distanzaKm * 10) / 10 : null,
      disponibilitaDichiarata,
      serviziRecenti,
      fattori,
      punteggioTotale
    };
  });

  risultati.sort((a, b) => {
    if (a.idoneo !== b.idoneo) return a.idoneo ? -1 : 1;
    return b.punteggioTotale - a.punteggioTotale;
  });

  return { gara, suggerimenti: risultati };
}

module.exports = { calcolaSuggerimenti };
