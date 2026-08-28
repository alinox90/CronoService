// Costruisce la struttura comune delle pagine autenticate: sidebar, header,
// centro notifiche e verifica della sessione. Ogni pagina protetta deve
// includere api.js e layout.js e chiamare Layout.init('chiave-pagina', 'Titolo').
const Layout = (() => {
  const VOCI_MENU = [
    { chiave: 'dashboard', href: '/pages/dashboard.html', icona: '🏠', etichetta: 'Dashboard', ruoli: null },
    { chiave: 'gare', href: '/pages/gare.html', icona: '🏁', etichetta: 'Gare', ruoli: null },
    { chiave: 'convocazioni', href: '/pages/convocazioni.html', icona: '📋', etichetta: 'Convocazioni', ruoli: null },
    { chiave: 'utenti', href: '/pages/utenti.html', icona: '👥', etichetta: 'Cronometristi', ruoli: ['admin', 'presidente', 'designatore'] },
    { chiave: 'disponibilita', href: '/pages/disponibilita.html', icona: '🗓️', etichetta: 'Disponibilità', ruoli: null },
    { chiave: 'attrezzature', href: '/pages/attrezzature.html', icona: '🧰', etichetta: 'Apparecchiature', ruoli: null },
    { chiave: 'report', href: '/pages/report.html', icona: '📊', etichetta: 'Report', ruoli: ['admin', 'presidente', 'designatore'] },
    { chiave: 'amministrazione', href: '/pages/amministrazione.html', icona: '⚙️', etichetta: 'Amministrazione', ruoli: ['admin'] },
    { chiave: 'profilo', href: '/pages/profilo.html', icona: '👤', etichetta: 'Profilo', ruoli: null }
  ];

  let utenteCorrente = null;
  let timerNotifiche = null;

  function escapeHtml(testo) {
    const div = document.createElement('div');
    div.textContent = testo ?? '';
    return div.innerHTML;
  }

  function costruisciSidebar(paginaAttiva) {
    const voci = VOCI_MENU.filter((v) => !v.ruoli || v.ruoli.includes(utenteCorrente.ruolo));
    const html = voci.map((v) => `
      <a class="voce-menu ${v.chiave === paginaAttiva ? 'attiva' : ''}" href="${v.href}">
        <span>${v.icona}</span><span>${v.etichetta}</span>
      </a>
    `).join('');

    return `
      <aside class="app-sidebar" id="app-sidebar">
        <div class="logo">
          <div class="icona">⏱</div>
          <div class="titolo">Crono Service</div>
        </div>
        <nav>${html}</nav>
        <div class="info-utente">
          <div class="nome">${escapeHtml(utenteCorrente.nome)} ${escapeHtml(utenteCorrente.cognome)}</div>
          <div class="ruolo">${escapeHtml(formattaRuolo(utenteCorrente.ruolo))}</div>
          <button class="link-logout" id="bottone-logout">Esci</button>
        </div>
      </aside>
    `;
  }

  function formattaRuolo(ruolo) {
    const mappa = {
      admin: 'Amministratore di sistema',
      presidente: 'Presidente associazione',
      designatore: 'Designatore servizi',
      cronometrista: 'Cronometrista'
    };
    return mappa[ruolo] || ruolo;
  }

  function costruisciHeader(titoloPagina) {
    return `
      <header class="app-header">
        <h1>${escapeHtml(titoloPagina)}</h1>
        <div class="contenitore-notifiche">
          <button class="bottone-campanella" id="bottone-campanella" title="Notifiche">
            🔔
            <span class="badge-non-lette" id="badge-non-lette" style="display:none;">0</span>
          </button>
          <div class="dropdown-notifiche" id="dropdown-notifiche">
            <div class="intestazione">
              <span>Notifiche</span>
              <button id="bottone-segna-tutte">Segna tutte come lette</button>
            </div>
            <div id="lista-notifiche"><div class="notifiche-vuote">Caricamento...</div></div>
          </div>
        </div>
      </header>
    `;
  }

  async function caricaNotifiche() {
    try {
      const dati = await api.get('/notifiche');
      const badge = document.getElementById('badge-non-lette');
      if (dati.nonLette > 0) {
        badge.style.display = 'inline-block';
        badge.textContent = dati.nonLette > 9 ? '9+' : dati.nonLette;
      } else {
        badge.style.display = 'none';
      }

      const lista = document.getElementById('lista-notifiche');
      if (!dati.notifiche.length) {
        lista.innerHTML = '<div class="notifiche-vuote">Nessuna notifica</div>';
        return;
      }
      lista.innerHTML = dati.notifiche.map((n) => `
        <div class="voce-notifica ${n.letto ? '' : 'non-letta'}" data-id="${n.id}" data-link="${n.link || ''}">
          <div class="titolo-notifica">${escapeHtml(n.titolo)}</div>
          <div>${escapeHtml(n.messaggio)}</div>
          <div class="data-notifica">${new Date(n.creato_il.replace(' ', 'T')).toLocaleString('it-IT')}</div>
        </div>
      `).join('');

      lista.querySelectorAll('.voce-notifica').forEach((el) => {
        el.addEventListener('click', async () => {
          const id = el.dataset.id;
          const link = el.dataset.link;
          await api.put(`/notifiche/${id}/letta`, {});
          if (link) window.location.href = link;
          else caricaNotifiche();
        });
      });
    } catch (errore) {
      console.error('Errore nel caricamento delle notifiche:', errore);
    }
  }

  function collegaEventi() {
    document.getElementById('bottone-logout').addEventListener('click', async () => {
      await api.post('/auth/logout', undefined).catch(() => {});
      window.location.href = '/index.html';
    });

    const bottoneCampanella = document.getElementById('bottone-campanella');
    const dropdown = document.getElementById('dropdown-notifiche');
    bottoneCampanella.addEventListener('click', (evento) => {
      evento.stopPropagation();
      dropdown.classList.toggle('aperto');
      if (dropdown.classList.contains('aperto')) caricaNotifiche();
    });
    document.addEventListener('click', (evento) => {
      if (!dropdown.contains(evento.target) && evento.target !== bottoneCampanella) {
        dropdown.classList.remove('aperto');
      }
    });

    document.getElementById('bottone-segna-tutte').addEventListener('click', async (evento) => {
      evento.stopPropagation();
      await api.put('/notifiche/tutte/lette', {});
      caricaNotifiche();
    });
  }

  async function init(paginaAttiva, titoloPagina) {
    let sessione;
    try {
      sessione = await api.get('/auth/me');
    } catch (errore) {
      window.location.href = '/index.html';
      return null;
    }
    utenteCorrente = sessione.utente;

    document.body.insertAdjacentHTML('afterbegin', `
      <div class="app-shell">
        ${costruisciSidebar(paginaAttiva)}
        <div class="app-main">
          ${costruisciHeader(titoloPagina)}
          <main class="app-content" id="app-content"></main>
        </div>
      </div>
    `);

    collegaEventi();
    caricaNotifiche();
    timerNotifiche = setInterval(caricaNotifiche, 30000);

    return utenteCorrente;
  }

  function contenitore() {
    return document.getElementById('app-content');
  }

  return { init, contenitore, get utente() { return utenteCorrente; }, escapeHtml };
})();
