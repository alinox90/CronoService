// Client HTTP minimale per dialogare con le API REST di Crono Service
const api = (() => {
  async function richiesta(metodo, percorso, corpo) {
    const opzioni = {
      method: metodo,
      headers: {},
      credentials: 'same-origin'
    };
    if (corpo !== undefined) {
      opzioni.headers['Content-Type'] = 'application/json';
      opzioni.body = JSON.stringify(corpo);
    }

    const risposta = await fetch(`/api${percorso}`, opzioni);

    if (risposta.status === 204) return null;

    let dati = null;
    const testo = await risposta.text();
    if (testo) {
      try { dati = JSON.parse(testo); } catch (e) { dati = null; }
    }

    if (!risposta.ok) {
      const messaggio = (dati && dati.errore) || `Errore ${risposta.status}`;
      const errore = new Error(messaggio);
      errore.status = risposta.status;
      throw errore;
    }

    return dati;
  }

  return {
    get: (percorso) => richiesta('GET', percorso),
    post: (percorso, corpo) => richiesta('POST', percorso, corpo ?? {}),
    put: (percorso, corpo) => richiesta('PUT', percorso, corpo ?? {}),
    delete: (percorso) => richiesta('DELETE', percorso)
  };
})();
