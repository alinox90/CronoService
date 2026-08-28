// Pagina "Gare": calendario gare con filtri e gestione (creazione/modifica) per designatore/admin
(async () => {
  const utente = await Layout.init('gare', 'Gare');
  if (!utente) return;
  const contenuto = Layout.contenitore();
  const puoGestire = ['admin', 'designatore'].includes(utente.ruolo);

  let discipline = [];
  let gare = [];

  try {
    discipline = (await api.get('/discipline')).discipline;
  } catch (errore) {
    Util.mostraErrore(contenuto, errore);
    return;
  }

  function opzioni(elementi, valoreSelezionato) {
    return elementi.map((e) => `<option value="${e.id}" ${String(e.id) === String(valoreSelezionato) ? 'selected' : ''}>${Layout.escapeHtml(e.nome)}</option>`).join('');
  }

  function renderStruttura() {
    contenuto.innerHTML = `
      <div class="barra-azioni">
        <div class="gruppo-filtri">
          <select id="filtro-disciplina"><option value="">Tutte le discipline</option>${opzioni(discipline)}</select>
          <select id="filtro-stato">
            <option value="">Tutti gli stati</option>
            <option value="pianificata">Pianificata</option>
            <option value="confermata">Confermata</option>
            <option value="svolta">Svolta</option>
            <option value="annullata">Annullata</option>
          </select>
        </div>
        ${puoGestire ? '<button class="bottone-accento" id="bottone-nuova-gara">+ Nuova gara</button>' : ''}
      </div>
      <div class="card">
        <div class="tabella-scroll" id="contenitore-tabella"></div>
      </div>

      <div class="overlay-modale" id="overlay-modale">
        <div class="modale">
          <div class="intestazione-modale">
            <h2 id="titolo-modale">Nuova gara</h2>
            <button id="chiudi-modale">&times;</button>
          </div>
          <div id="errore-modale"></div>
          <form id="modulo-gara">
            <input type="hidden" id="gara-id">
            <div class="campo">
              <label for="gara-nome">Nome gara</label>
              <input type="text" id="gara-nome" required>
            </div>
            <div class="riga-campi">
              <div class="campo">
                <label for="gara-disciplina">Disciplina</label>
                <select id="gara-disciplina"><option value="">-</option>${opzioni(discipline)}</select>
              </div>
            </div>
            <div class="riga-campi">
              <div class="campo">
                <label for="gara-data">Data</label>
                <input type="date" id="gara-data" required>
              </div>
              <div class="campo">
                <label for="gara-ora">Ora</label>
                <input type="time" id="gara-ora">
              </div>
            </div>
            <div class="riga-campi">
              <div class="campo">
                <label for="gara-luogo">Luogo</label>
                <input type="text" id="gara-luogo">
              </div>
              <div class="campo">
                <label for="gara-indirizzo">Indirizzo</label>
                <input type="text" id="gara-indirizzo">
              </div>
            </div>
            <div class="riga-campi">
              <div class="campo">
                <label for="gara-stato">Stato</label>
                <select id="gara-stato">
                  <option value="pianificata">Pianificata</option>
                  <option value="confermata">Confermata</option>
                  <option value="svolta">Svolta</option>
                  <option value="annullata">Annullata</option>
                </select>
              </div>
              <div class="campo">
                <label for="gara-cronometristi">Cronometristi richiesti</label>
                <input type="number" min="1" id="gara-cronometristi" value="1">
              </div>
            </div>
            <div class="campo">
              <label for="gara-note">Note</label>
              <textarea id="gara-note" rows="2"></textarea>
            </div>
            <button type="submit" class="bottone-primario">Salva</button>
          </form>
        </div>
      </div>
    `;

    document.getElementById('filtro-disciplina').addEventListener('change', caricaGare);
    document.getElementById('filtro-stato').addEventListener('change', caricaGare);

    if (puoGestire) {
      document.getElementById('bottone-nuova-gara').addEventListener('click', () => apriModale());
    }
    document.getElementById('chiudi-modale').addEventListener('click', chiudiModale);
    document.getElementById('overlay-modale').addEventListener('click', (e) => {
      if (e.target.id === 'overlay-modale') chiudiModale();
    });
    document.getElementById('modulo-gara').addEventListener('submit', salvaGara);
  }

  function apriModale(gara) {
    document.getElementById('errore-modale').innerHTML = '';
    document.getElementById('titolo-modale').textContent = gara ? 'Modifica gara' : 'Nuova gara';
    document.getElementById('gara-id').value = gara ? gara.id : '';
    document.getElementById('gara-nome').value = gara ? gara.nome : '';
    document.getElementById('gara-disciplina').value = gara ? (gara.disciplina_id || '') : '';
    document.getElementById('gara-data').value = gara ? gara.data_gara : '';
    document.getElementById('gara-ora').value = gara ? (gara.ora_gara || '') : '';
    document.getElementById('gara-luogo').value = gara ? (gara.luogo || '') : '';
    document.getElementById('gara-indirizzo').value = gara ? (gara.indirizzo || '') : '';
    document.getElementById('gara-stato').value = gara ? gara.stato : 'pianificata';
    document.getElementById('gara-cronometristi').value = gara ? gara.cronometristi_richiesti : 1;
    document.getElementById('gara-note').value = gara ? (gara.note || '') : '';
    document.getElementById('overlay-modale').classList.add('aperto');
  }

  function chiudiModale() {
    document.getElementById('overlay-modale').classList.remove('aperto');
  }

  async function salvaGara(evento) {
    evento.preventDefault();
    const id = document.getElementById('gara-id').value;
    const corpo = {
      nome: document.getElementById('gara-nome').value.trim(),
      disciplina_id: document.getElementById('gara-disciplina').value || null,
      data_gara: document.getElementById('gara-data').value,
      ora_gara: document.getElementById('gara-ora').value || null,
      luogo: document.getElementById('gara-luogo').value || null,
      indirizzo: document.getElementById('gara-indirizzo').value || null,
      stato: document.getElementById('gara-stato').value,
      cronometristi_richiesti: Number(document.getElementById('gara-cronometristi').value) || 1,
      note: document.getElementById('gara-note').value || null
    };

    try {
      if (id) {
        await api.put(`/gare/${id}`, corpo);
      } else {
        await api.post('/gare', corpo);
      }
      chiudiModale();
      await caricaGare();
    } catch (errore) {
      document.getElementById('errore-modale').innerHTML = `<div class="messaggio-errore">${errore.message}</div>`;
    }
  }

  async function eliminaGara(id) {
    if (!confirm('Eliminare definitivamente questa gara?')) return;
    try {
      await api.delete(`/gare/${id}`);
      await caricaGare();
    } catch (errore) {
      alert(errore.message);
    }
  }

  async function caricaGare() {
    const parametri = new URLSearchParams();
    const disciplina = document.getElementById('filtro-disciplina').value;
    const stato = document.getElementById('filtro-stato').value;
    if (disciplina) parametri.set('disciplina_id', disciplina);
    if (stato) parametri.set('stato', stato);

    const tabellaContenitore = document.getElementById('contenitore-tabella');
    tabellaContenitore.innerHTML = '<div class="stato-vuoto">Caricamento...</div>';

    try {
      const risposta = await api.get(`/gare?${parametri.toString()}`);
      gare = risposta.gare;
      renderTabella();
    } catch (errore) {
      Util.mostraErrore(tabellaContenitore, errore);
    }
  }

  function renderTabella() {
    const tabellaContenitore = document.getElementById('contenitore-tabella');
    if (gare.length === 0) {
      tabellaContenitore.innerHTML = '<div class="stato-vuoto">Nessuna gara trovata con i filtri selezionati</div>';
      return;
    }
    tabellaContenitore.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Gara</th><th>Data</th><th>Disciplina</th><th>Stato</th><th>Cronometristi</th><th></th>
          </tr>
        </thead>
        <tbody>
          ${gare.map((g) => `
            <tr>
              <td><a href="/pages/gara-dettaglio.html?id=${g.id}">${Layout.escapeHtml(g.nome)}</a></td>
              <td>${Util.formattaData(g.data_gara)} ${g.ora_gara ? g.ora_gara : ''}</td>
              <td>${Layout.escapeHtml(g.disciplina_nome || '-')}</td>
              <td>${Util.badgeStatoGara(g.stato)}</td>
              <td>${g.cronometristi_assegnati} / ${g.cronometristi_richiesti}</td>
              <td>
                ${puoGestire ? `
                  <button class="bottone-secondario bottone-piccolo" data-azione="modifica" data-id="${g.id}">Modifica</button>
                  <button class="bottone-errore bottone-piccolo" data-azione="elimina" data-id="${g.id}">Elimina</button>
                ` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    tabellaContenitore.querySelectorAll('[data-azione="modifica"]').forEach((btn) => {
      btn.addEventListener('click', () => apriModale(gare.find((g) => g.id === Number(btn.dataset.id))));
    });
    tabellaContenitore.querySelectorAll('[data-azione="elimina"]').forEach((btn) => {
      btn.addEventListener('click', () => eliminaGara(btn.dataset.id));
    });
  }

  renderStruttura();
  await caricaGare();
})();
