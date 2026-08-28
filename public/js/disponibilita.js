// Pagina "Disponibilità": i cronometristi dichiarano le proprie finestre di
// disponibilità/indisponibilità, usate dall'algoritmo di assegnazione.
// Designatore/admin/presidente vedono la disponibilità di tutti.
(async () => {
  const utente = await Layout.init('disponibilita', 'Disponibilità');
  if (!utente) return;
  const contenuto = Layout.contenitore();
  const vistaGlobale = ['admin', 'designatore', 'presidente'].includes(utente.ruolo);
  const puoInserire = utente.ruolo === 'cronometrista' || utente.ruolo === 'admin' || utente.ruolo === 'designatore';

  let elenco = [];

  function renderStruttura() {
    contenuto.innerHTML = `
      ${puoInserire ? `
        <div class="card">
          <h3>Dichiara una disponibilità</h3>
          <form id="modulo-disponibilita">
            <div class="riga-campi">
              <div class="campo"><label>Dal</label><input type="date" id="disp-inizio" required></div>
              <div class="campo"><label>Al</label><input type="date" id="disp-fine" required></div>
              <div class="campo"><label>Tipo</label>
                <select id="disp-tipo">
                  <option value="disponibile">Disponibile</option>
                  <option value="non_disponibile">Non disponibile</option>
                </select>
              </div>
            </div>
            <div class="campo"><label>Note</label><input type="text" id="disp-note"></div>
            <button type="submit" class="bottone-primario">Aggiungi</button>
          </form>
        </div>
      ` : ''}
      <div class="card">
        <h3>${vistaGlobale ? 'Disponibilità dichiarate da tutti i cronometristi' : 'Le tue disponibilità'}</h3>
        <div class="tabella-scroll" id="contenitore-tabella"></div>
      </div>
    `;

    if (puoInserire) {
      document.getElementById('modulo-disponibilita').addEventListener('submit', async (evento) => {
        evento.preventDefault();
        const corpo = {
          data_inizio: document.getElementById('disp-inizio').value,
          data_fine: document.getElementById('disp-fine').value,
          tipo: document.getElementById('disp-tipo').value,
          note: document.getElementById('disp-note').value || null
        };
        try {
          await api.post('/disponibilita', corpo);
          evento.target.reset();
          await carica();
        } catch (errore) { alert(errore.message); }
      });
    }
  }

  async function elimina(id) {
    if (!confirm('Eliminare questa disponibilità?')) return;
    try {
      await api.delete(`/disponibilita/${id}`);
      await carica();
    } catch (errore) { alert(errore.message); }
  }

  async function carica() {
    const contenitoreTabella = document.getElementById('contenitore-tabella');
    contenitoreTabella.innerHTML = '<div class="stato-vuoto">Caricamento...</div>';
    try {
      elenco = (await api.get('/disponibilita')).disponibilita;
      renderTabella();
    } catch (errore) {
      Util.mostraErrore(contenitoreTabella, errore);
    }
  }

  function renderTabella() {
    const contenitoreTabella = document.getElementById('contenitore-tabella');
    if (elenco.length === 0) {
      contenitoreTabella.innerHTML = '<div class="stato-vuoto">Nessuna disponibilità dichiarata</div>';
      return;
    }
    contenitoreTabella.innerHTML = `
      <table>
        <thead><tr>${vistaGlobale ? '<th>Cronometrista</th>' : ''}<th>Dal</th><th>Al</th><th>Tipo</th><th>Note</th><th></th></tr></thead>
        <tbody>
          ${elenco.map((d) => `
            <tr>
              ${vistaGlobale ? `<td>${Layout.escapeHtml(d.utente_nome)} ${Layout.escapeHtml(d.utente_cognome)}</td>` : ''}
              <td>${Util.formattaData(d.data_inizio)}</td>
              <td>${Util.formattaData(d.data_fine)}</td>
              <td>${d.tipo === 'disponibile' ? '<span class="badge badge-successo">Disponibile</span>' : '<span class="badge badge-errore">Non disponibile</span>'}</td>
              <td>${Layout.escapeHtml(d.note || '-')}</td>
              <td>${(d.utente_id === utente.id || utente.ruolo === 'admin' || utente.ruolo === 'designatore') ? `<button class="bottone-secondario bottone-piccolo" data-elimina="${d.id}">Elimina</button>` : ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    contenitoreTabella.querySelectorAll('[data-elimina]').forEach((btn) => btn.addEventListener('click', () => elimina(btn.dataset.elimina)));
  }

  renderStruttura();
  await carica();
})();
