// Pagina "Cronometristi": anagrafica completa degli utenti. Lettura per
// admin/presidente/designatore, gestione completa (creazione/modifica/
// eliminazione/reset password) riservata all'amministratore di sistema.
(async () => {
  const utente = await Layout.init('utenti', 'Cronometristi e operatori');
  if (!utente) return;
  const contenuto = Layout.contenitore();
  const eAdmin = utente.ruolo === 'admin';

  let utenti = [];

  const RUOLI = [
    { valore: 'admin', etichetta: 'Amministratore di sistema' },
    { valore: 'presidente', etichetta: 'Presidente associazione' },
    { valore: 'designatore', etichetta: 'Designatore servizi' },
    { valore: 'cronometrista', etichetta: 'Cronometrista' }
  ];

  function opzioniRuoli(selezionato) {
    return RUOLI.map((r) => `<option value="${r.valore}" ${r.valore === selezionato ? 'selected' : ''}>${r.etichetta}</option>`).join('');
  }

  function renderStruttura() {
    contenuto.innerHTML = `
      <div class="barra-azioni">
        <div class="gruppo-filtri">
          <select id="filtro-ruolo">
            <option value="">Tutti i ruoli</option>
            ${RUOLI.map((r) => `<option value="${r.valore}">${r.etichetta}</option>`).join('')}
          </select>
        </div>
        ${eAdmin ? '<button class="bottone-accento" id="bottone-nuovo-utente">+ Nuovo utente</button>' : ''}
      </div>
      <div class="card"><div class="tabella-scroll" id="contenitore-tabella"></div></div>

      <div class="overlay-modale" id="overlay-modale">
        <div class="modale">
          <div class="intestazione-modale">
            <h2 id="titolo-modale">Nuovo utente</h2>
            <button id="chiudi-modale">&times;</button>
          </div>
          <div id="errore-modale"></div>
          <form id="modulo-utente">
            <input type="hidden" id="utente-id">
            <div class="riga-campi">
              <div class="campo"><label>Nome</label><input type="text" id="utente-nome" required></div>
              <div class="campo"><label>Cognome</label><input type="text" id="utente-cognome" required></div>
            </div>
            <div class="campo"><label>Email</label><input type="email" id="utente-email" required></div>
            <div class="campo" id="campo-password"><label>Password iniziale</label><input type="password" id="utente-password"></div>
            <div class="riga-campi">
              <div class="campo"><label>Ruolo</label><select id="utente-ruolo">${opzioniRuoli('cronometrista')}</select></div>
              <div class="campo"><label>Telefono</label><input type="text" id="utente-telefono"></div>
            </div>
            <div class="riga-campi">
              <div class="campo"><label>Qualifica</label><input type="text" id="utente-qualifica"></div>
              <div class="campo"><label>Anni esperienza</label><input type="number" min="0" id="utente-esperienza" value="0"></div>
            </div>
            <div class="campo"><label>Attivo</label>
              <select id="utente-attivo"><option value="1">Sì</option><option value="0">No</option></select>
            </div>
            <div class="riga-campi">
              <div class="campo"><label>Latitudine</label><input type="number" step="0.0001" id="utente-lat"></div>
              <div class="campo"><label>Longitudine</label><input type="number" step="0.0001" id="utente-lng"></div>
            </div>
            <p class="testo-secondario">Le coordinate sono utilizzate dall'algoritmo di assegnazione per calcolare la distanza dalle gare.</p>
            <button type="submit" class="bottone-primario">Salva</button>
          </form>
        </div>
      </div>
    `;

    document.getElementById('filtro-ruolo').addEventListener('change', carica);
    if (eAdmin) {
      document.getElementById('bottone-nuovo-utente').addEventListener('click', () => apriModale());
      document.getElementById('chiudi-modale').addEventListener('click', chiudiModale);
      document.getElementById('overlay-modale').addEventListener('click', (e) => { if (e.target.id === 'overlay-modale') chiudiModale(); });
      document.getElementById('modulo-utente').addEventListener('submit', salva);
    }
  }

  function apriModale(u) {
    document.getElementById('errore-modale').innerHTML = '';
    document.getElementById('titolo-modale').textContent = u ? 'Modifica utente' : 'Nuovo utente';
    document.getElementById('utente-id').value = u ? u.id : '';
    document.getElementById('utente-nome').value = u ? u.nome : '';
    document.getElementById('utente-cognome').value = u ? u.cognome : '';
    document.getElementById('utente-email').value = u ? u.email : '';
    document.getElementById('utente-password').value = '';
    document.getElementById('utente-password').required = !u;
    document.getElementById('campo-password').style.display = u ? 'none' : 'block';
    document.getElementById('utente-ruolo').value = u ? u.ruolo : 'cronometrista';
    document.getElementById('utente-telefono').value = u ? (u.telefono || '') : '';
    document.getElementById('utente-qualifica').value = u ? (u.qualifica || '') : '';
    document.getElementById('utente-esperienza').value = u ? u.anni_esperienza : 0;
    document.getElementById('utente-attivo').value = u ? String(u.attivo) : '1';
    document.getElementById('utente-lat').value = u ? (u.lat ?? '') : '';
    document.getElementById('utente-lng').value = u ? (u.lng ?? '') : '';
    document.getElementById('overlay-modale').classList.add('aperto');
  }

  function chiudiModale() { document.getElementById('overlay-modale').classList.remove('aperto'); }

  async function salva(evento) {
    evento.preventDefault();
    const id = document.getElementById('utente-id').value;
    const corpo = {
      nome: document.getElementById('utente-nome').value.trim(),
      cognome: document.getElementById('utente-cognome').value.trim(),
      email: document.getElementById('utente-email').value.trim(),
      ruolo: document.getElementById('utente-ruolo').value,
      telefono: document.getElementById('utente-telefono').value || null,
      qualifica: document.getElementById('utente-qualifica').value || null,
      anni_esperienza: Number(document.getElementById('utente-esperienza').value) || 0,
      attivo: Number(document.getElementById('utente-attivo').value),
      lat: document.getElementById('utente-lat').value ? Number(document.getElementById('utente-lat').value) : null,
      lng: document.getElementById('utente-lng').value ? Number(document.getElementById('utente-lng').value) : null
    };
    if (!id) corpo.password = document.getElementById('utente-password').value;

    try {
      if (id) await api.put(`/utenti/${id}`, corpo);
      else await api.post('/utenti', corpo);
      chiudiModale();
      await carica();
    } catch (errore) {
      document.getElementById('errore-modale').innerHTML = `<div class="messaggio-errore">${errore.message}</div>`;
    }
  }

  async function eliminaUtente(id) {
    if (!confirm('Eliminare definitivamente questo utente?')) return;
    try {
      await api.delete(`/utenti/${id}`);
      await carica();
    } catch (errore) { alert(errore.message); }
  }

  async function resettaPassword(id) {
    const nuova = prompt('Inserisci la nuova password (almeno 6 caratteri):');
    if (!nuova) return;
    try {
      await api.put(`/utenti/${id}/password`, { password: nuova });
      alert('Password aggiornata con successo.');
    } catch (errore) { alert(errore.message); }
  }

  async function carica() {
    const ruolo = document.getElementById('filtro-ruolo').value;
    const parametri = new URLSearchParams();
    if (ruolo) parametri.set('ruolo', ruolo);

    const contenitoreTabella = document.getElementById('contenitore-tabella');
    contenitoreTabella.innerHTML = '<div class="stato-vuoto">Caricamento...</div>';
    try {
      const risposta = await api.get(`/utenti?${parametri.toString()}`);
      utenti = risposta.utenti;
      renderTabella();
    } catch (errore) {
      Util.mostraErrore(contenitoreTabella, errore);
    }
  }

  function renderTabella() {
    const contenitoreTabella = document.getElementById('contenitore-tabella');
    if (utenti.length === 0) {
      contenitoreTabella.innerHTML = '<div class="stato-vuoto">Nessun utente trovato</div>';
      return;
    }
    contenitoreTabella.innerHTML = `
      <table>
        <thead><tr><th>Nome</th><th>Email</th><th>Ruolo</th><th>Esperienza</th><th>Stato</th><th></th></tr></thead>
        <tbody>
          ${utenti.map((u) => `
            <tr>
              <td>${Layout.escapeHtml(u.nome)} ${Layout.escapeHtml(u.cognome)}</td>
              <td>${Layout.escapeHtml(u.email)}</td>
              <td>${Util.formattaRuolo(u.ruolo)}</td>
              <td>${u.anni_esperienza} anni</td>
              <td>${u.attivo ? '<span class="badge badge-successo">Attivo</span>' : '<span class="badge badge-errore">Disattivo</span>'}</td>
              <td>
                ${eAdmin ? `
                  <button class="bottone-secondario bottone-piccolo" data-modifica="${u.id}">Modifica</button>
                  <button class="bottone-secondario bottone-piccolo" data-reset="${u.id}">Reset password</button>
                  <button class="bottone-errore bottone-piccolo" data-elimina="${u.id}">Elimina</button>
                ` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    if (eAdmin) {
      contenitoreTabella.querySelectorAll('[data-modifica]').forEach((btn) => btn.addEventListener('click', () => apriModale(utenti.find((u) => u.id === Number(btn.dataset.modifica)))));
      contenitoreTabella.querySelectorAll('[data-elimina]').forEach((btn) => btn.addEventListener('click', () => eliminaUtente(btn.dataset.elimina)));
      contenitoreTabella.querySelectorAll('[data-reset]').forEach((btn) => btn.addEventListener('click', () => resettaPassword(btn.dataset.reset)));
    }
  }

  renderStruttura();
  await carica();
})();
