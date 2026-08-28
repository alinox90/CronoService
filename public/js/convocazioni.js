// Pagina "Convocazioni": vista personale per il cronometrista (conferma/rifiuta),
// vista globale con filtri per designatore/admin/presidente
(async () => {
  const utente = await Layout.init('convocazioni', 'Convocazioni');
  if (!utente) return;
  const contenuto = Layout.contenitore();
  const vistaGlobale = ['admin', 'designatore', 'presidente'].includes(utente.ruolo);

  try {
    if (vistaGlobale) await renderVistaGlobale(contenuto);
    else await renderVistaPersonale(contenuto);
  } catch (errore) {
    Util.mostraErrore(contenuto, errore);
  }
})();

async function renderVistaPersonale(contenuto) {
  const { convocazioni } = await api.get('/convocazioni/mie');

  function render() {
    contenuto.innerHTML = `
      <div class="card">
        <div class="tabella-scroll">
          ${convocazioni.length === 0 ? '<div class="stato-vuoto">Non hai ancora convocazioni</div>' : `
            <table>
              <thead><tr><th>Gara</th><th>Data</th><th>Ruolo</th><th>Stato</th><th></th></tr></thead>
              <tbody>
                ${convocazioni.map((c) => `
                  <tr>
                    <td><a href="/pages/gara-dettaglio.html?id=${c.gara_id}">${Layout.escapeHtml(c.gara_nome)}</a></td>
                    <td>${Util.formattaData(c.data_gara)}</td>
                    <td>${Layout.escapeHtml(c.ruolo_servizio || '-')}</td>
                    <td>${Util.badgeStatoConvocazione(c.stato)}</td>
                    <td>
                      ${c.stato === 'proposta' ? `
                        <button class="bottone-successo bottone-piccolo" data-id="${c.id}" data-azione="confermata">Conferma</button>
                        <button class="bottone-errore bottone-piccolo" data-id="${c.id}" data-azione="rifiutata">Rifiuta</button>
                      ` : ''}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      </div>
    `;

    contenuto.querySelectorAll('[data-azione]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await api.put(`/convocazioni/${btn.dataset.id}`, { stato: btn.dataset.azione });
          const aggiornata = convocazioni.find((c) => c.id === Number(btn.dataset.id));
          aggiornata.stato = btn.dataset.azione;
          render();
        } catch (errore) { alert(errore.message); }
      });
    });
  }

  render();
}

async function renderVistaGlobale(contenuto) {
  contenuto.innerHTML = `
    <div class="barra-azioni">
      <div class="gruppo-filtri">
        <select id="filtro-stato">
          <option value="">Tutti gli stati</option>
          <option value="proposta">Proposta</option>
          <option value="confermata">Confermata</option>
          <option value="rifiutata">Rifiutata</option>
          <option value="sostituita">Sostituita</option>
          <option value="completata">Completata</option>
        </select>
      </div>
    </div>
    <div class="card"><div class="tabella-scroll" id="contenitore-tabella"></div></div>
  `;

  document.getElementById('filtro-stato').addEventListener('change', carica);
  await carica();

  async function carica() {
    const stato = document.getElementById('filtro-stato').value;
    const contenitoreTabella = document.getElementById('contenitore-tabella');
    contenitoreTabella.innerHTML = '<div class="stato-vuoto">Caricamento...</div>';
    try {
      const { convocazioni } = await api.get(`/convocazioni${stato ? `?stato=${stato}` : ''}`);
      if (convocazioni.length === 0) {
        contenitoreTabella.innerHTML = '<div class="stato-vuoto">Nessuna convocazione trovata</div>';
        return;
      }
      contenitoreTabella.innerHTML = `
        <table>
          <thead><tr><th>Gara</th><th>Data</th><th>Cronometrista</th><th>Ruolo</th><th>Punteggio</th><th>Stato</th></tr></thead>
          <tbody>
            ${convocazioni.map((c) => `
              <tr>
                <td><a href="/pages/gara-dettaglio.html?id=${c.gara_id}">${Layout.escapeHtml(c.gara_nome)}</a></td>
                <td>${Util.formattaData(c.data_gara)}</td>
                <td>${Layout.escapeHtml(c.utente_nome)} ${Layout.escapeHtml(c.utente_cognome)}</td>
                <td>${Layout.escapeHtml(c.ruolo_servizio || '-')}</td>
                <td>${c.punteggio_assegnazione != null ? c.punteggio_assegnazione : '-'}</td>
                <td>${Util.badgeStatoConvocazione(c.stato)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (errore) {
      Util.mostraErrore(contenitoreTabella, errore);
    }
  }
}
