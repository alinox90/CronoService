// Logica della pagina di login: invia le credenziali e reindirizza alla dashboard
(async () => {
  // Se esiste gia' una sessione attiva, vai direttamente alla dashboard
  try {
    await api.get('/auth/me');
    window.location.href = '/pages/dashboard.html';
    return;
  } catch (errore) {
    // Nessuna sessione attiva: resta sulla pagina di login
  }

  const modulo = document.getElementById('modulo-login');
  const areaErrore = document.getElementById('area-errore');
  const bottoneSubmit = document.getElementById('bottone-submit');

  modulo.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    areaErrore.innerHTML = '';
    bottoneSubmit.disabled = true;
    bottoneSubmit.textContent = 'Accesso in corso...';

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      await api.post('/auth/login', { email, password });
      window.location.href = '/pages/dashboard.html';
    } catch (errore) {
      areaErrore.innerHTML = `<div class="messaggio-errore">${errore.message}</div>`;
      bottoneSubmit.disabled = false;
      bottoneSubmit.textContent = 'Accedi';
    }
  });
})();
