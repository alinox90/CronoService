// Funzioni di utilita condivise tra le pagine dell'applicazione
const Util = (() => {
  function formattaData(dataISO) {
    if (!dataISO) return '-';
    const [anno, mese, giorno] = dataISO.split('-');
    return `${giorno}/${mese}/${anno}`;
  }

  function formattaDataOra(dataOraSql) {
    if (!dataOraSql) return '-';
    return new Date(dataOraSql.replace(' ', 'T')).toLocaleString('it-IT');
  }

  const ETICHETTE_STATO_GARA = {
    pianificata: 'Pianificata', confermata: 'Confermata', svolta: 'Svolta', annullata: 'Annullata'
  };
  const CLASSI_STATO_GARA = {
    pianificata: 'badge-neutro', confermata: 'badge-info', svolta: 'badge-successo', annullata: 'badge-errore'
  };

  const ETICHETTE_STATO_CONVOCAZIONE = {
    proposta: 'Proposta', confermata: 'Confermata', rifiutata: 'Rifiutata', sostituita: 'Sostituita', completata: 'Completata'
  };
  const CLASSI_STATO_CONVOCAZIONE = {
    proposta: 'badge-avviso', confermata: 'badge-info', rifiutata: 'badge-errore', sostituita: 'badge-neutro', completata: 'badge-successo'
  };

  const ETICHETTE_STATO_ATTREZZATURA = {
    disponibile: 'Disponibile', in_uso: 'In uso', manutenzione: 'In manutenzione', fuori_servizio: 'Fuori servizio'
  };
  const CLASSI_STATO_ATTREZZATURA = {
    disponibile: 'badge-successo', in_uso: 'badge-info', manutenzione: 'badge-avviso', fuori_servizio: 'badge-errore'
  };

  function badge(etichetta, classe) {
    return `<span class="badge ${classe}">${etichetta}</span>`;
  }

  function badgeStatoGara(stato) {
    return badge(ETICHETTE_STATO_GARA[stato] || stato, CLASSI_STATO_GARA[stato] || 'badge-neutro');
  }
  function badgeStatoConvocazione(stato) {
    return badge(ETICHETTE_STATO_CONVOCAZIONE[stato] || stato, CLASSI_STATO_CONVOCAZIONE[stato] || 'badge-neutro');
  }
  function badgeStatoAttrezzatura(stato) {
    return badge(ETICHETTE_STATO_ATTREZZATURA[stato] || stato, CLASSI_STATO_ATTREZZATURA[stato] || 'badge-neutro');
  }

  function formattaRuolo(ruolo) {
    const mappa = {
      admin: 'Amministratore di sistema', presidente: 'Presidente associazione',
      designatore: 'Designatore servizi', cronometrista: 'Cronometrista'
    };
    return mappa[ruolo] || ruolo;
  }

  function mostraErrore(contenitore, errore) {
    contenitore.innerHTML = `<div class="messaggio-errore">${errore.message || 'Si e verificato un errore imprevisto.'}</div>`;
  }

  return {
    formattaData, formattaDataOra, badgeStatoGara, badgeStatoConvocazione,
    badgeStatoAttrezzatura, formattaRuolo, mostraErrore
  };
})();
