// Dettaglio di una gara: informazioni generali, convocazioni (con algoritmo
// intelligente di assegnazione), attrezzature assegnate e risultati.
(async () => {
  const utente = await Layout.init('gare', 'Dettaglio gara');
  if (!utente) return;
  const contenuto = Layout.contenitore();
  const puoGestire = ['admin', 'designatore'].includes(utente.ruolo);

  const idGara = new URLSearchParams(window.location.search).get('id');
  if (!idGara) {
    contenuto.innerHTML = '<div class="messaggio-errore">Nessuna gara specificata.</div>';
    return;
  }

  let gara, convocazioni, attrezzatureAssegnate;

  async function caricaTutto() {
    const dati = await api.get(`/gare/${idGara}/dettaglio`);
    gara = dati.gara;
    convocazioni = dati.convocazioni;
    attrezzatureAssegnate = dati.attrezzature;
  }

  function renderTestata() {
    return `
      <div class="card">
        <div class="barra-azioni">
          <div>
            <h2 style="margin-bottom:0.2rem;">${Layout.escapeHtml(gara.nome)} ${Util.badgeStatoGara(gara.stato)}</h2>
            <div class="testo-secondario">${Layout.escapeHtml(gara.disciplina_nome || 'Disciplina non specificata')}</div>
          </div>
          <a class="bottone bottone-secondario" href="/pages/gare.html">&larr; Torna al calendario</a>
        </div>
        <div class="riga-campi" style="margin-top:1rem;">
          <div><strong>Data</strong><br>${Util.formattaData(gara.data_gara)} ${gara.ora_gara || ''}</div>
          <div><strong>Luogo</strong><br>${Layout.escapeHtml(gara.luogo || '-')}</div>
          <div><strong>Indirizzo</strong><br>${Layout.escapeHtml(gara.indirizzo || '-')}</div>
          <div><strong>Cronometristi</strong><br>${gara.cronometristi_assegnati || convocazioni.length} / ${gara.cronometristi_richiesti}</div>
        </div>
        ${gara.note ? `<p style="margin-top:1rem;" class="testo-secondario">${Layout.escapeHtml(gara.note)}</p>` : ''}
      </div>
    `;
  }

  function renderTabs() {
    return `
      <div class="tabs">
        <button class="tab-bottone attivo" data-tab="convocazioni">Convocazioni</button>
        <button class="tab-bottone" data-tab="attrezzature">Apparecchiature</button>
      </div>
      <div class="tab-contenuto attivo" id="tab-convocazioni"></div>
      <div class="tab-contenuto" id="tab-attrezzature"></div>
    `;
  }

  // --- TAB CONVOCAZIONI ---
  function renderConvocazioni() {
    const contenitore = document.getElementById('tab-convocazioni');
    contenitore.innerHTML = `
      <div class="card">
        <div class="barra-azioni">
          <h3 style="margin:0;">Cronometristi convocati</h3>
          ${puoGestire ? '<button class="bottone-accento" id="bottone-suggerimenti">🎯 Suggerisci cronometristi</button>' : ''}
        </div>
        <div class="tabella-scroll">
          ${convocazioni.length === 0 ? '<div class="stato-vuoto">Nessuna convocazione ancora effettuata</div>' : `
            <table>
              <thead><tr><th>Cronometrista</th><th>Ruolo</th><th>Punteggio</th><th>Stato</th><th></th></tr></thead>
              <tbody>
                ${convocazioni.map((c) => `
                  <tr>
                    <td>${Layout.escapeHtml(c.utente_nome)} ${Layout.escapeHtml(c.utente_cognome)}</td>
                    <td>${Layout.escapeHtml(c.ruolo_servizio || '-')}</td>
                    <td>${c.punteggio_assegnazione != null ? c.punteggio_assegnazione : '-'}</td>
                    <td>${Util.badgeStatoConvocazione(c.stato)}</td>
                    <td>${renderAzioniConvocazione(c)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      </div>
      <div class="card" id="riquadro-suggerimenti" style="display:none;"></div>
    `;

    if (puoGestire) {
      document.getElementById('bottone-suggerimenti').addEventListener('click', mostraSuggerimenti);
    }
    contenitore.querySelectorAll('[data-azione-conv]').forEach((btn) => {
      btn.addEventListener('click', () => gestisciAzioneConvocazione(btn.dataset.id, btn.dataset.azioneConv));
    });
  }

  function renderAzioniConvocazione(c) {
    const azioni = [];
    const eProprietario = c.utente_id === utente.id;
    if (eProprietario && c.stato === 'proposta') {
      azioni.push(`<button class="bottone-successo bottone-piccolo" data-id="${c.id}" data-azione-conv="confermata">Conferma</button>`);
      azioni.push(`<button class="bottone-errore bottone-piccolo" data-id="${c.id}" data-azione-conv="rifiutata">Rifiuta</button>`);
    }
    if (puoGestire) {
      azioni.push(`<button class="bottone-secondario bottone-piccolo" data-id="${c.id}" data-azione-conv="elimina">Rimuovi</button>`);
    }
    return azioni.join(' ');
  }

  async function gestisciAzioneConvocazione(id, azione) {
    try {
      if (azione === 'elimina') {
        if (!confirm('Rimuovere questa convocazione?')) return;
        await api.delete(`/convocazioni/${id}`);
      } else {
        await api.put(`/convocazioni/${id}`, { stato: azione });
      }
      await caricaTutto();
      renderConvocazioni();
    } catch (errore) {
      alert(errore.message);
    }
  }

  async function mostraSuggerimenti() {
    const riquadro = document.getElementById('riquadro-suggerimenti');
    riquadro.style.display = 'block';
    riquadro.innerHTML = '<div class="stato-vuoto">Calcolo dei suggerimenti in corso...</div>';
    try {
      const risposta = await api.get(`/gare/${idGara}/suggerimenti`);
      const idGiaConvocati = new Set(convocazioni.map((c) => c.utente_id));
      const suggerimenti = risposta.suggerimenti;

      riquadro.innerHTML = `
        <h3>Suggerimenti dell'algoritmo di assegnazione</h3>
        <p class="testo-secondario">Punteggio calcolato in base a disponibilità, distanza geografica, esperienza ed equa distribuzione dei servizi. La decisione finale resta al designatore.</p>
        <div class="tabella-scroll">
          <table>
            <thead><tr><th>Cronometrista</th><th>Punteggio</th><th>Esperienza</th><th>Servizi recenti</th><th>Note</th><th></th></tr></thead>
            <tbody>
              ${suggerimenti.map((s) => `
                <tr style="${s.idoneo ? '' : 'opacity:0.55;'}">
                  <td>${Layout.escapeHtml(s.utente.nome)} ${Layout.escapeHtml(s.utente.cognome)}<br><span class="testo-secondario">${Layout.escapeHtml(s.utente.qualifica || '')}</span></td>
                  <td><strong>${s.punteggioTotale}</strong></td>
                  <td>${s.utente.anni_esperienza} anni</td>
                  <td>${s.serviziRecenti}</td>
                  <td>${s.idoneo ? (s.disponibilitaDichiarata ? '<span class="badge badge-successo">Disponibile</span>' : '') : `<span class="badge badge-errore">${Layout.escapeHtml(s.motiviEsclusione.join('; '))}</span>`}</td>
                  <td>
                    ${s.idoneo && !idGiaConvocati.has(s.utente.id) ? `<button class="bottone-primario bottone-piccolo" data-convoca="${s.utente.id}" data-punteggio="${s.punteggioTotale}">Convoca</button>` : ''}
                    ${idGiaConvocati.has(s.utente.id) ? '<span class="testo-secondario">Già convocato</span>' : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      riquadro.querySelectorAll('[data-convoca]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          try {
            await api.post(`/gare/${idGara}/convocazioni`, {
              utente_id: Number(btn.dataset.convoca),
              punteggio_assegnazione: Number(btn.dataset.punteggio)
            });
            await caricaTutto();
            renderConvocazioni();
            mostraSuggerimenti();
          } catch (errore) {
            alert(errore.message);
          }
        });
      });
    } catch (errore) {
      riquadro.innerHTML = `<div class="messaggio-errore">${errore.message}</div>`;
    }
  }

  // --- TAB ATTREZZATURE ---
  async function renderAttrezzature() {
    const contenitore = document.getElementById('tab-attrezzature');
    contenitore.innerHTML = `
      <div class="card">
        <h3>Apparecchiature assegnate</h3>
        ${attrezzatureAssegnate.length === 0 ? '<div class="stato-vuoto">Nessuna apparecchiatura assegnata</div>' : `
          <div class="tabella-scroll">
            <table>
              <thead><tr><th>Nome</th><th>Tipo</th><th>Numero serie</th><th>Assegnata il</th><th>Restituita il</th><th></th></tr></thead>
              <tbody>
                ${attrezzatureAssegnate.map((a) => `
                  <tr>
                    <td>${Layout.escapeHtml(a.nome)}</td>
                    <td>${Layout.escapeHtml(a.tipo || '-')}</td>
                    <td>${Layout.escapeHtml(a.numero_serie || '-')}</td>
                    <td>${Util.formattaDataOra(a.data_assegnazione)}</td>
                    <td>${a.data_restituzione ? Util.formattaDataOra(a.data_restituzione) : '-'}</td>
                    <td>${puoGestire && !a.data_restituzione ? `<button class="bottone-secondario bottone-piccolo" data-restituisci="${a.id}">Restituisci</button>` : ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
        ${puoGestire ? `
          <div class="barra-azioni" style="margin-top:1rem;">
            <div class="gruppo-filtri">
              <select id="seleziona-attrezzatura" style="min-width:260px;"><option value="">Caricamento apparecchiature disponibili...</option></select>
              <button class="bottone-primario" id="bottone-assegna-attrezzatura">Assegna alla gara</button>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    if (puoGestire) {
      contenitore.querySelectorAll('[data-restituisci]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          try {
            await api.put(`/attrezzature/assegnazioni/${btn.dataset.restituisci}/restituisci`, {});
            await caricaTutto();
            renderAttrezzature();
          } catch (errore) { alert(errore.message); }
        });
      });

      try {
        const disponibiliResp = await api.get('/attrezzature?stato=disponibile');
        const select = document.getElementById('seleziona-attrezzatura');
        select.innerHTML = disponibiliResp.attrezzature.length
          ? disponibiliResp.attrezzature.map((a) => `<option value="${a.id}">${Layout.escapeHtml(a.nome)} (${Layout.escapeHtml(a.numero_serie || 'n/d')})</option>`).join('')
          : '<option value="">Nessuna apparecchiatura disponibile</option>';
      } catch (errore) { /* ignora */ }

      document.getElementById('bottone-assegna-attrezzatura').addEventListener('click', async () => {
        const attrezzaturaId = document.getElementById('seleziona-attrezzatura').value;
        if (!attrezzaturaId) return;
        try {
          await api.post('/attrezzature/assegna', { attrezzatura_id: Number(attrezzaturaId), gara_id: Number(idGara) });
          await caricaTutto();
          renderAttrezzature();
        } catch (errore) { alert(errore.message); }
      });
    }
  }

  function collegaTabs() {
    document.querySelectorAll('.tab-bottone').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-bottone').forEach((b) => b.classList.remove('attivo'));
        document.querySelectorAll('.tab-contenuto').forEach((c) => c.classList.remove('attivo'));
        btn.classList.add('attivo');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('attivo');
      });
    });
  }

  try {
    await caricaTutto();
    contenuto.innerHTML = renderTestata() + renderTabs();
    collegaTabs();
    renderConvocazioni();
    renderAttrezzature();
  } catch (errore) {
    Util.mostraErrore(contenuto, errore);
  }
})();
