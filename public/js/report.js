// Pagina "Report": statistiche e grafici a barre (senza librerie esterne)
// su servizi per cronometrista, ore di servizio e utilizzo delle attrezzature.
(async () => {
  const utente = await Layout.init('report', 'Report e statistiche');
  if (!utente) return;
  const contenuto = Layout.contenitore();

  function grafico(titolo, elementi, chiaveEtichetta, chiaveValore, suffisso = '') {
    const dati = elementi.filter((e) => e[chiaveValore] > 0);
    if (dati.length === 0) return `<div class="card"><h3>${titolo}</h3><div class="stato-vuoto">Nessun dato disponibile</div></div>`;
    const massimo = Math.max(...dati.map((e) => e[chiaveValore]));
    return `
      <div class="card">
        <h3>${titolo}</h3>
        ${dati.map((e) => `
          <div class="barra-grafico">
            <div class="etichetta-barra">${Layout.escapeHtml(e[chiaveEtichetta])}</div>
            <div class="traccia-barra"><div class="riempimento-barra" style="width:${(e[chiaveValore] / massimo) * 100}%"></div></div>
            <div class="valore-barra">${e[chiaveValore]}${suffisso}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  try {
    const [servizi, ore, attrezzature] = await Promise.all([
      api.get('/report/servizi-per-cronometrista'),
      api.get('/report/ore-servizio'),
      api.get('/report/utilizzo-attrezzature')
    ]);

    const serviziEtichettati = servizi.serviziPerCronometrista.map((s) => ({ ...s, nomeCompleto: `${s.nome} ${s.cognome}` }));
    const oreEtichettate = ore.oreServizio.map((s) => ({ ...s, nomeCompleto: `${s.nome} ${s.cognome}` }));

    contenuto.innerHTML = `
      ${grafico('Numero di servizi per cronometrista', serviziEtichettati, 'nomeCompleto', 'numero_servizi')}
      ${grafico(`Ore di servizio stimate (${ore.durataMediaOrePerServizio} ore/servizio)`, oreEtichettate, 'nomeCompleto', 'ore_stimate', ' h')}
      ${grafico('Utilizzo delle attrezzature', attrezzature.utilizzoAttrezzature, 'nome', 'numero_utilizzi')}
    `;
  } catch (errore) {
    Util.mostraErrore(contenuto, errore);
  }
})();
