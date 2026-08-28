// Pagina "Attrezzature": inventario completo, gestione riservata a admin/designatore
(async () => {
  const utente = await Layout.init('attrezzature', 'Attrezzature');
  if (!utente) return;
  const contenuto = Layout.contenitore();
  const puoGestire = ['admin', 'designatore'].includes(utente.ruolo);

  let attrezzature = [];

  function renderStruttura() {
    contenuto.innerHTML = `
      <div class="barra-azioni">
        <div class="gruppo-filtri">
          <select id="filtro-stato">
            <option value="">Tutti gli stati</option>
            <option value="disponibile">Disponibile</option>
            <option value="in_uso">In uso</option>
            <option value="manutenzione">In manutenzione</option>
            <option value="fuori_servizio">Fuori servizio</option>
          </select>
        </div>
        ${puoGestire ? '<button class="bottone-accento" id="bottone-nuova">+ Nuova attrezzatura</button>' : ''}
      </div>
      <div class="card"><div class="tabella-scroll" id="contenitore-tabella"></div></div>

      <div class="overlay-modale" id="overlay-modale">
        <div class="modale">
          <div class="intestazione-modale">
            <h2 id="titolo-modale">Nuova attrezzatura</h2>
            <button id="chiudi-modale">&times;</button>
          </div>
          <div id="errore-modale"></div>
          <form id="modulo-attrezzatura">
            <input type="hidden" id="attr-id">
            <div class="campo"><label>Nome</label><input type="text" id="attr-nome" required></div>
            <div class="riga-campi">
              <div class="campo"><label>Tipo</label><input type="text" id="attr-tipo"></div>
              <div class="campo"><label>Numero di serie</label><input type="text" id="attr-serie"></div>
            </div>
            <div class="campo"><label>Stato</label>
              <select id="attr-stato">
                <option value="disponibile">Disponibile</option>
                <option value="in_uso">In uso</option>
                <option value="manutenzione">In manutenzione</option>
                <option value="fuori_servizio">Fuori servizio</option>
              </select>
            </div>
            <div class="campo"><label>Note</label><textarea id="attr-note" rows="2"></textarea></div>
            <button type="submit" class="bottone-primario">Salva</button>
          </form>
        </div>
      </div>
    `;

    document.getElementById('filtro-stato').addEventListener('change', carica);
    if (puoGestire) {
      document.getElementById('bottone-nuova').addEventListener('click', () => apriModale());
      document.getElementById('chiudi-modale').addEventListener('click', chiudiModale);
      document.getElementById('overlay-modale').addEventListener('click', (e) => { if (e.target.id === 'overlay-modale') chiudiModale(); });
      document.getElementById('modulo-attrezzatura').addEventListener('submit', salva);
    }
  }

  function apriModale(a) {
    document.getElementById('errore-modale').innerHTML = '';
    document.getElementById('titolo-modale').textContent = a ? 'Modifica attrezzatura' : 'Nuova attrezzatura';
    document.getElementById('attr-id').value = a ? a.id : '';
    document.getElementById('attr-nome').value = a ? a.nome : '';
    document.getElementById('attr-tipo').value = a ? (a.tipo || '') : '';
    document.getElementById('attr-serie').value = a ? (a.numero_serie || '') : '';
    document.getElementById('attr-stato').value = a ? a.stato : 'disponibile';
    document.getElementById('attr-note').value = a ? (a.note || '') : '';
    document.getElementById('overlay-modale').classList.add('aperto');
  }

  function chiudiModale() { document.getElementById('overlay-modale').classList.remove('aperto'); }

  async function salva(evento) {
    evento.preventDefault();
    const id = document.getElementById('attr-id').value;
    const corpo = {
      nome: document.getElementById('attr-nome').value.trim(),
      tipo: document.getElementById('attr-tipo').value || null,
      numero_serie: document.getElementById('attr-serie').value || null,
      stato: document.getElementById('attr-stato').value,
      note: document.getElementById('attr-note').value || null
    };
    try {
      if (id) await api.put(`/attrezzature/${id}`, corpo);
      else await api.post('/attrezzature', corpo);
      chiudiModale();
      await carica();
    } catch (errore) {
      document.getElementById('errore-modale').innerHTML = `<div class="messaggio-errore">${errore.message}</div>`;
    }
  }

  async function elimina(id) {
    if (!confirm('Eliminare questa attrezzatura?')) return;
    try {
      await api.delete(`/attrezzature/${id}`);
      await carica();
    } catch (errore) { alert(errore.message); }
  }

  async function carica() {
    const stato = document.getElementById('filtro-stato').value;
    const parametri = new URLSearchParams();
    if (stato) parametri.set('stato', stato);

    const contenitoreTabella = document.getElementById('contenitore-tabella');
    contenitoreTabella.innerHTML = '<div class="stato-vuoto">Caricamento...</div>';
    try {
      attrezzature = (await api.get(`/attrezzature?${parametri.toString()}`)).attrezzature;
      renderTabella();
    } catch (errore) {
      Util.mostraErrore(contenitoreTabella, errore);
    }
  }

  function renderTabella() {
    const contenitoreTabella = document.getElementById('contenitore-tabella');
    if (attrezzature.length === 0) {
      contenitoreTabella.innerHTML = '<div class="stato-vuoto">Nessuna attrezzatura trovata</div>';
      return;
    }
    contenitoreTabella.innerHTML = `
      <table>
        <thead><tr><th>Nome</th><th>Tipo</th><th>Numero serie</th><th>Stato</th><th></th></tr></thead>
        <tbody>
          ${attrezzature.map((a) => `
            <tr>
              <td>${Layout.escapeHtml(a.nome)}</td>
              <td>${Layout.escapeHtml(a.tipo || '-')}</td>
              <td>${Layout.escapeHtml(a.numero_serie || '-')}</td>
              <td>${Util.badgeStatoAttrezzatura(a.stato)}</td>
              <td>
                ${puoGestire ? `
                  <button class="bottone-secondario bottone-piccolo" data-modifica="${a.id}">Modifica</button>
                  <button class="bottone-errore bottone-piccolo" data-elimina="${a.id}">Elimina</button>
                ` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    if (puoGestire) {
      contenitoreTabella.querySelectorAll('[data-modifica]').forEach((btn) => btn.addEventListener('click', () => apriModale(attrezzature.find((a) => a.id === Number(btn.dataset.modifica)))));
      contenitoreTabella.querySelectorAll('[data-elimina]').forEach((btn) => btn.addEventListener('click', () => elimina(btn.dataset.elimina)));
    }
  }

  renderStruttura();
  await carica();
})();
