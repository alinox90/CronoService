// Pagina "Amministrazione": gestione delle discipline sportive.
// Riservata all'amministratore di sistema.
(async () => {
  const utente = await Layout.init('amministrazione', 'Amministrazione');
  if (!utente) return;
  const contenuto = Layout.contenitore();

  if (utente.ruolo !== 'admin') {
    contenuto.innerHTML = '<div class="messaggio-errore">Questa sezione è riservata all\'amministratore di sistema.</div>';
    return;
  }

  let discipline = [];

  contenuto.innerHTML = `
    <div class="card">
      <div class="barra-azioni">
        <h2 style="margin:0;">Discipline sportive</h2>
        <button class="bottone-accento" id="bottone-nuova-disciplina">+ Nuova disciplina</button>
      </div>
      <div class="tabella-scroll" id="tabella-discipline"></div>
    </div>

    <div class="overlay-modale" id="overlay-disciplina">
      <div class="modale">
        <div class="intestazione-modale"><h2 id="titolo-disciplina">Nuova disciplina</h2><button id="chiudi-disciplina">&times;</button></div>
        <div id="errore-disciplina"></div>
        <form id="modulo-disciplina">
          <input type="hidden" id="disciplina-id">
          <div class="campo"><label>Nome</label><input type="text" id="disciplina-nome" required></div>
          <div class="campo"><label>Descrizione</label><textarea id="disciplina-descrizione" rows="2"></textarea></div>
          <button type="submit" class="bottone-primario">Salva</button>
        </form>
      </div>
    </div>
  `;

  // --- Discipline ---
  document.getElementById('bottone-nuova-disciplina').addEventListener('click', () => apriModaleDisciplina());
  document.getElementById('chiudi-disciplina').addEventListener('click', () => document.getElementById('overlay-disciplina').classList.remove('aperto'));
  document.getElementById('overlay-disciplina').addEventListener('click', (e) => { if (e.target.id === 'overlay-disciplina') e.currentTarget.classList.remove('aperto'); });
  document.getElementById('modulo-disciplina').addEventListener('submit', salvaDisciplina);

  function apriModaleDisciplina(d) {
    document.getElementById('errore-disciplina').innerHTML = '';
    document.getElementById('titolo-disciplina').textContent = d ? 'Modifica disciplina' : 'Nuova disciplina';
    document.getElementById('disciplina-id').value = d ? d.id : '';
    document.getElementById('disciplina-nome').value = d ? d.nome : '';
    document.getElementById('disciplina-descrizione').value = d ? (d.descrizione || '') : '';
    document.getElementById('overlay-disciplina').classList.add('aperto');
  }

  async function salvaDisciplina(evento) {
    evento.preventDefault();
    const id = document.getElementById('disciplina-id').value;
    const corpo = {
      nome: document.getElementById('disciplina-nome').value.trim(),
      descrizione: document.getElementById('disciplina-descrizione').value || null
    };
    try {
      if (id) await api.put(`/discipline/${id}`, corpo);
      else await api.post('/discipline', corpo);
      document.getElementById('overlay-disciplina').classList.remove('aperto');
      await caricaDiscipline();
    } catch (errore) {
      document.getElementById('errore-disciplina').innerHTML = `<div class="messaggio-errore">${errore.message}</div>`;
    }
  }

  async function eliminaDisciplina(id) {
    if (!confirm('Eliminare questa disciplina?')) return;
    try { await api.delete(`/discipline/${id}`); await caricaDiscipline(); } catch (errore) { alert(errore.message); }
  }

  async function caricaDiscipline() {
    const contenitore = document.getElementById('tabella-discipline');
    contenitore.innerHTML = '<div class="stato-vuoto">Caricamento...</div>';
    try {
      discipline = (await api.get('/discipline')).discipline;
      contenitore.innerHTML = discipline.length === 0 ? '<div class="stato-vuoto">Nessuna disciplina presente</div>' : `
        <table>
          <thead><tr><th>Nome</th><th>Descrizione</th><th></th></tr></thead>
          <tbody>
            ${discipline.map((d) => `
              <tr>
                <td>${Layout.escapeHtml(d.nome)}</td>
                <td>${Layout.escapeHtml(d.descrizione || '-')}</td>
                <td>
                  <button class="bottone-secondario bottone-piccolo" data-modifica-disciplina="${d.id}">Modifica</button>
                  <button class="bottone-errore bottone-piccolo" data-elimina-disciplina="${d.id}">Elimina</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      contenitore.querySelectorAll('[data-modifica-disciplina]').forEach((btn) => btn.addEventListener('click', () => apriModaleDisciplina(discipline.find((d) => d.id === Number(btn.dataset.modificaDisciplina)))));
      contenitore.querySelectorAll('[data-elimina-disciplina]').forEach((btn) => btn.addEventListener('click', () => eliminaDisciplina(btn.dataset.eliminaDisciplina)));
    } catch (errore) {
      Util.mostraErrore(contenitore, errore);
    }
  }

  await caricaDiscipline();
})();
