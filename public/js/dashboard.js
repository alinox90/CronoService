// Dashboard iniziale: riepilogo generale per i ruoli amministrativi,
// riepilogo personale (prossime convocazioni) per i cronometristi
(async () => {
  const utente = await Layout.init('dashboard', 'Dashboard');
  if (!utente) return;
  const contenuto = Layout.contenitore();

  const ruoliAmministrativi = ['admin', 'presidente', 'designatore'];

  try {
    if (ruoliAmministrativi.includes(utente.ruolo)) {
      await renderDashboardAmministrativa(contenuto);
    } else {
      await renderDashboardCronometrista(contenuto, utente);
    }
  } catch (errore) {
    Util.mostraErrore(contenuto, errore);
  }
})();

async function renderDashboardAmministrativa(contenuto) {
  const [{ gare, cronometristiAttivi, convocazioniDaConfermare, attrezzatureDisponibili }, gareResp, serviziResp] = await Promise.all([
    api.get('/report/riepilogo'),
    api.get('/gare'),
    api.get('/report/servizi-per-cronometrista')
  ]);

  const prossimeGare = gareResp.gare
    .filter((g) => g.stato !== 'annullata')
    .slice()
    .sort((a, b) => a.data_gara.localeCompare(b.data_gara))
    .slice(0, 5);

  const topCronometristi = serviziResp.serviziPerCronometrista
    .filter((c) => c.numero_servizi > 0)
    .slice(0, 5);
  const massimoServizi = Math.max(1, ...topCronometristi.map((c) => c.numero_servizi));

  contenuto.innerHTML = `
    <div class="griglia-statistiche">
      <div class="riquadro-statistica"><div class="valore">${gare.totale}</div><div class="etichetta">Gare totali</div></div>
      <div class="riquadro-statistica"><div class="valore">${gare.pianificate}</div><div class="etichetta">Gare pianificate</div></div>
      <div class="riquadro-statistica"><div class="valore">${cronometristiAttivi}</div><div class="etichetta">Cronometristi attivi</div></div>
      <div class="riquadro-statistica"><div class="valore">${convocazioniDaConfermare}</div><div class="etichetta">Convocazioni da confermare</div></div>
      <div class="riquadro-statistica"><div class="valore">${attrezzatureDisponibili}</div><div class="etichetta">Apparecchiature disponibili</div></div>
    </div>

    <div class="card">
      <h2>Prossime gare</h2>
      ${prossimeGare.length === 0 ? '<div class="stato-vuoto">Nessuna gara in programma</div>' : `
        <div class="tabella-scroll">
          <table>
            <thead><tr><th>Gara</th><th>Data</th><th>Stato</th><th>Cronometristi</th></tr></thead>
            <tbody>
              ${prossimeGare.map((g) => `
                <tr onclick="window.location.href='/pages/gara-dettaglio.html?id=${g.id}'" style="cursor:pointer;">
                  <td>${Layout.escapeHtml(g.nome)}</td>
                  <td>${Util.formattaData(g.data_gara)}</td>
                  <td>${Util.badgeStatoGara(g.stato)}</td>
                  <td>${g.cronometristi_assegnati} / ${g.cronometristi_richiesti}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>

    <div class="card">
      <h2>Cronometristi con piu servizi</h2>
      ${topCronometristi.length === 0 ? '<div class="stato-vuoto">Nessun servizio registrato</div>' : topCronometristi.map((c) => `
        <div class="barra-grafico">
          <div class="etichetta-barra">${Layout.escapeHtml(c.nome)} ${Layout.escapeHtml(c.cognome)}</div>
          <div class="traccia-barra"><div class="riempimento-barra" style="width:${(c.numero_servizi / massimoServizi) * 100}%"></div></div>
          <div class="valore-barra">${c.numero_servizi}</div>
        </div>
      `).join('')}
    </div>
  `;
}

async function renderDashboardCronometrista(contenuto, utente) {
  const [convocazioniResp, disponibilitaResp] = await Promise.all([
    api.get('/convocazioni/mie'),
    api.get('/disponibilita')
  ]);

  const convocazioni = convocazioniResp.convocazioni;
  const oggi = new Date().toISOString().slice(0, 10);
  const prossime = convocazioni.filter((c) => c.data_gara >= oggi && c.stato !== 'rifiutata').slice(0, 5);
  const daConfermare = convocazioni.filter((c) => c.stato === 'proposta');
  const completate = convocazioni.filter((c) => c.stato === 'completata').length;

  contenuto.innerHTML = `
    <div class="griglia-statistiche">
      <div class="riquadro-statistica"><div class="valore">${convocazioni.length}</div><div class="etichetta">Convocazioni totali</div></div>
      <div class="riquadro-statistica"><div class="valore">${daConfermare.length}</div><div class="etichetta">Da confermare</div></div>
      <div class="riquadro-statistica"><div class="valore">${completate}</div><div class="etichetta">Servizi completati</div></div>
      <div class="riquadro-statistica"><div class="valore">${disponibilitaResp.disponibilita.length}</div><div class="etichetta">Disponibilità dichiarate</div></div>
    </div>

    ${daConfermare.length > 0 ? `
      <div class="card">
        <h2>Convocazioni da confermare</h2>
        <div class="tabella-scroll">
          <table>
            <thead><tr><th>Gara</th><th>Data</th><th>Ruolo</th><th></th></tr></thead>
            <tbody>
              ${daConfermare.map((c) => `
                <tr>
                  <td>${Layout.escapeHtml(c.gara_nome)}</td>
                  <td>${Util.formattaData(c.data_gara)}</td>
                  <td>${Layout.escapeHtml(c.ruolo_servizio || '-')}</td>
                  <td><a href="/pages/gara-dettaglio.html?id=${c.gara_id}">Gestisci &rarr;</a></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}

    <div class="card">
      <h2>Prossime convocazioni</h2>
      ${prossime.length === 0 ? '<div class="stato-vuoto">Nessuna convocazione imminente</div>' : `
        <div class="tabella-scroll">
          <table>
            <thead><tr><th>Gara</th><th>Data</th><th>Ruolo</th><th>Stato</th></tr></thead>
            <tbody>
              ${prossime.map((c) => `
                <tr onclick="window.location.href='/pages/gara-dettaglio.html?id=${c.gara_id}'" style="cursor:pointer;">
                  <td>${Layout.escapeHtml(c.gara_nome)}</td>
                  <td>${Util.formattaData(c.data_gara)}</td>
                  <td>${Layout.escapeHtml(c.ruolo_servizio || '-')}</td>
                  <td>${Util.badgeStatoConvocazione(c.stato)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;
}
