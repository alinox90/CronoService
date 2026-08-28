// Pagina "Profilo": dati anagrafici propri, aggiornamento telefono/indirizzo
// (geocodificato in coordinate per l'algoritmo di assegnazione) e cambio password.
(async () => {
  const utente = await Layout.init('profilo', 'Il mio profilo');
  if (!utente) return;
  const contenuto = Layout.contenitore();

  let dettaglio;
  try {
    dettaglio = (await api.get(`/utenti/${utente.id}`)).utente;
  } catch (errore) {
    Util.mostraErrore(contenuto, errore);
    return;
  }

  contenuto.innerHTML = `
    <div class="card">
      <h2>Dati anagrafici</h2>
      <div class="riga-campi">
        <div><strong>Nome</strong><br>${Layout.escapeHtml(dettaglio.nome)} ${Layout.escapeHtml(dettaglio.cognome)}</div>
        <div><strong>Email</strong><br>${Layout.escapeHtml(dettaglio.email)}</div>
        <div><strong>Ruolo</strong><br>${Util.formattaRuolo(dettaglio.ruolo)}</div>
        <div><strong>Qualifica</strong><br>${Layout.escapeHtml(dettaglio.qualifica || '-')}</div>
        <div><strong>Anni di esperienza</strong><br>${dettaglio.anni_esperienza ?? 0}</div>
      </div>
      <p class="testo-secondario" style="margin-top:0.75rem;">Per modificare nome o ruolo contatta l'amministratore di sistema.</p>
    </div>

    <div class="card">
      <h2>Contatti e localizzazione</h2>
      <p class="testo-secondario">Indirizzo e comune vengono convertiti automaticamente in coordinate geografiche, utilizzate dall'algoritmo intelligente di assegnazione per calcolare la distanza dalle gare.</p>
      <div id="errore-profilo"></div>
      <div id="successo-profilo"></div>
      <form id="modulo-profilo">
        <div class="campo"><label>Telefono</label><input type="text" id="profilo-telefono" value="${Layout.escapeHtml(dettaglio.telefono || '')}"></div>
        <div class="riga-campi">
          <div class="campo"><label>Indirizzo</label><input type="text" id="profilo-indirizzo" value="${Layout.escapeHtml(dettaglio.indirizzo || '')}"></div>
          <div class="campo"><label>Comune</label><input type="text" id="profilo-comune" value="${Layout.escapeHtml(dettaglio.comune || '')}"></div>
        </div>
        <button type="submit" class="bottone-primario">Aggiorna</button>
      </form>
    </div>

    <div class="card">
      <h2>Cambia password</h2>
      <div id="errore-password"></div>
      <div id="successo-password"></div>
      <form id="modulo-password">
        <div class="campo"><label>Nuova password</label><input type="password" id="nuova-password" minlength="6" required></div>
        <button type="submit" class="bottone-primario">Aggiorna password</button>
      </form>
    </div>
  `;

  document.getElementById('modulo-profilo').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    document.getElementById('errore-profilo').innerHTML = '';
    document.getElementById('successo-profilo').innerHTML = '';
    const corpo = {
      telefono: document.getElementById('profilo-telefono').value || null,
      indirizzo: document.getElementById('profilo-indirizzo').value || null,
      comune: document.getElementById('profilo-comune').value || null
    };
    try {
      await api.put('/utenti/me/profilo', corpo);
      document.getElementById('successo-profilo').innerHTML = '<div class="messaggio-successo">Profilo aggiornato con successo.</div>';
    } catch (errore) {
      document.getElementById('errore-profilo').innerHTML = `<div class="messaggio-errore">${errore.message}</div>`;
    }
  });

  document.getElementById('modulo-password').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    document.getElementById('errore-password').innerHTML = '';
    document.getElementById('successo-password').innerHTML = '';
    const password = document.getElementById('nuova-password').value;
    try {
      await api.put(`/utenti/${utente.id}/password`, { password });
      document.getElementById('successo-password').innerHTML = '<div class="messaggio-successo">Password aggiornata con successo.</div>';
      document.getElementById('modulo-password').reset();
    } catch (errore) {
      document.getElementById('errore-password').innerHTML = `<div class="messaggio-errore">${errore.message}</div>`;
    }
  });
})();
