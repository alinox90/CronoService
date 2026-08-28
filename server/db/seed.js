// Popola il database con dati dimostrativi per la sezione FICR Palermo:
// discipline, utenti per ciascun ruolo, gare, disponibilita, convocazioni,
// attrezzature e risultati.
// Eseguire con: npm run seed
const bcrypt = require('bcryptjs');
const db = require('../config/database');

const PASSWORD_DEMO = 'CronoService2026!';

function pulisciTabelle() {
  // Ordine inverso rispetto alle dipendenze per rispettare i vincoli di chiave esterna
  const tabelle = [
    'notifiche', 'risultati', 'attrezzature_gare', 'convocazioni',
    'disponibilita', 'attrezzature', 'gare', 'utenti', 'discipline'
  ];
  for (const tabella of tabelle) {
    db.prepare(`DELETE FROM ${tabella}`).run();
    db.prepare(`DELETE FROM sqlite_sequence WHERE name = ?`).run(tabella);
  }
}

function seed() {
  const transazione = db.transaction(() => {
    pulisciTabelle();

    // --- Discipline ---
    const insDisciplina = db.prepare('INSERT INTO discipline (nome, descrizione) VALUES (?, ?)');
    const discAtletica = insDisciplina.run('Atletica Leggera', 'Corse su pista, salti e lanci').lastInsertRowid;
    const discCiclismo = insDisciplina.run('Ciclismo', 'Gare su strada, su pista, cronometro e mountain bike').lastInsertRowid;
    const discNuoto = insDisciplina.run('Nuoto', 'Gare in piscina e acque libere').lastInsertRowid;
    const discTriathlon = insDisciplina.run('Triathlon', 'Nuoto, ciclismo e corsa in un’unica competizione').lastInsertRowid;
    const discPodismo = insDisciplina.run('Podismo', 'Corse su strada e trail running').lastInsertRowid;
    const discRegolarita = insDisciplina.run('Regolarità Auto Storiche', 'Gare di regolarità per auto storiche e moderne').lastInsertRowid;
    const discKarting = insDisciplina.run('Karting', 'Gare di kart su pista').lastInsertRowid;
    const discMotociclismo = insDisciplina.run('Motociclismo', 'Gare su circuito e su strada').lastInsertRowid;
    const discSportInvernali = insDisciplina.run('Sport Invernali', 'Sci alpino, sci di fondo e snowboard').lastInsertRowid;

    // --- Utenti ---
    const hash = bcrypt.hashSync(PASSWORD_DEMO, 10);
    const insUtente = db.prepare(`
      INSERT INTO utenti (nome, cognome, email, password_hash, ruolo, telefono, indirizzo, comune, qualifica, anni_esperienza, lat, lng, attivo)
      VALUES (@nome, @cognome, @email, @password_hash, @ruolo, @telefono, @indirizzo, @comune, @qualifica, @anni_esperienza, @lat, @lng, 1)
    `);

    const idAdmin = insUtente.run({
      nome: 'Admin', cognome: 'Sistema', email: 'admin@cronoservice.it', password_hash: hash,
      ruolo: 'admin', telefono: '3200000000', indirizzo: 'Viale del Fante 1', comune: 'Palermo',
      qualifica: 'Amministratore', anni_esperienza: 5, lat: 38.1157, lng: 13.3613
    }).lastInsertRowid;

    const idPresidente = insUtente.run({
      nome: 'Giovanni', cognome: 'Ferrara', email: 'presidente@cronoservice.it', password_hash: hash,
      ruolo: 'presidente', telefono: '3200000001', indirizzo: 'Via Libertà 100', comune: 'Palermo',
      qualifica: 'Presidente Associazione', anni_esperienza: 20, lat: 38.1157, lng: 13.3613
    }).lastInsertRowid;

    const idDesignatore1 = insUtente.run({
      nome: 'Laura', cognome: 'Greco', email: 'laura.greco@cronoservice.it', password_hash: hash,
      ruolo: 'designatore', telefono: '3200000002', indirizzo: 'Via Roma 50', comune: 'Palermo',
      qualifica: 'Designatore Servizi', anni_esperienza: 12, lat: 38.1157, lng: 13.3613
    }).lastInsertRowid;

    const idDesignatore2 = insUtente.run({
      nome: 'Marco', cognome: 'Bianchi', email: 'marco.bianchi@cronoservice.it', password_hash: hash,
      ruolo: 'designatore', telefono: '3200000003', indirizzo: 'Via Maqueda 200', comune: 'Palermo',
      qualifica: 'Designatore Servizi', anni_esperienza: 9, lat: 38.1157, lng: 13.3613
    }).lastInsertRowid;

    // Cronometristi della sezione FICR Palermo, distribuiti nell'area cittadina
    // con coordinate leggermente diverse per rendere significativo l'algoritmo di distanza
    const cronometristiDati = [
      { nome: 'Paolo', cognome: 'Russo', lat: 38.1257, lng: 13.3513, indirizzo: 'Via Notarbartolo 12', qualifica: 'Cronometrista Livello 2', esperienza: 8 },
      { nome: 'Anna', cognome: 'Lombardo', lat: 38.1057, lng: 13.3713, indirizzo: 'Via Oreto 34', qualifica: 'Cronometrista Livello 1', esperienza: 3 },
      { nome: 'Salvatore', cognome: 'Messina', lat: 38.1357, lng: 13.3413, indirizzo: 'Via Cruillas 5', qualifica: 'Cronometrista Livello 3', esperienza: 15 },
      { nome: 'Chiara', cognome: 'Conti', lat: 38.0957, lng: 13.3813, indirizzo: 'Via Messina Marine 78', qualifica: 'Cronometrista Livello 2', esperienza: 6 },
      { nome: 'Davide', cognome: 'Ferrari', lat: 38.1457, lng: 13.3313, indirizzo: 'Via Sferracavallo 21', qualifica: 'Cronometrista Livello 1', esperienza: 2 },
      { nome: 'Elena', cognome: 'Moretti', lat: 38.0857, lng: 13.3213, indirizzo: 'Via Villagrazia 60', qualifica: 'Cronometrista Livello 3', esperienza: 11 },
      { nome: 'Luca', cognome: 'Ricci', lat: 38.1557, lng: 13.3913, indirizzo: 'Via Pitrè 9', qualifica: 'Cronometrista Livello 2', esperienza: 7 },
      { nome: 'Sara', cognome: 'Marino', lat: 38.0757, lng: 13.3113, indirizzo: 'Via Ernesto Basile 40', qualifica: 'Cronometrista Livello 1', esperienza: 1 },
      { nome: 'Matteo', cognome: 'Gallo', lat: 38.1657, lng: 13.4013, indirizzo: 'Via Tommaso Natale 15', qualifica: 'Cronometrista Livello 3', esperienza: 14 },
      { nome: 'Francesca', cognome: 'Costa', lat: 38.1157, lng: 13.3813, indirizzo: 'Via Sampolo 88', qualifica: 'Cronometrista Livello 2', esperienza: 5 }
    ];
    const idCronometristi = cronometristiDati.map((c, i) => insUtente.run({
      nome: c.nome, cognome: c.cognome, email: `${c.nome.toLowerCase()}.${c.cognome.toLowerCase()}@cronoservice.it`,
      password_hash: hash, ruolo: 'cronometrista', telefono: `320000${String(1010 + i)}`,
      indirizzo: c.indirizzo, comune: 'Palermo',
      qualifica: c.qualifica, anni_esperienza: c.esperienza, lat: c.lat, lng: c.lng
    }).lastInsertRowid);

    // --- Attrezzature ---
    const insAttrezzatura = db.prepare(`
      INSERT INTO attrezzature (nome, tipo, numero_serie, stato, note)
      VALUES (?, ?, ?, ?, ?)
    `);
    const attrezzatureDati = [
      ['Cronometro professionale REI2', 'Cronometro', 'PA-CR-001'],
      ['Cronometro professionale REI PRO', 'Cronometro', 'PA-CR-002'],
      ['Cronometro scrivente', 'Cronometro', 'PA-CR-003'],
      ['Fotocellula Microgate', 'Fotocellula', 'PA-FC-001'],
      ['Fotocellula di arrivo', 'Fotocellula', 'PA-FC-002'],
      ['Fotocellula di partenza', 'Fotocellula', 'PA-FC-003'],
      ['Pistola di partenza', 'Partenza', 'PA-PS-001'],
      ['Trasduttore per pistola', 'Trasduttore', 'PA-TR-001'],
      ['EncRadio 500', 'Trasmissione', 'PA-ER-001'],
      ['DecRadio', 'Trasmissione', 'PA-DR-001'],
      ['LinkGate', 'Trasmissione', 'PA-LG-001'],
      ['Radio portatile (x10)', 'Comunicazione', 'PA-RD-010'],
      ['Sistema FinishLynx', 'Fotofinish', 'PA-LX-001'],
      ['Telecamera EtherLynx', 'Fotofinish', 'PA-LX-002'],
      ['Videocamera IdentiLynx', 'Videocamera', 'PA-ID-001'],
      ['Treppiede per fotocamera', 'Supporto', 'PA-TP-001'],
      ['Sistema transponder (x50)', 'Transponder', 'PA-TR-050'],
      ['Antenna transponder', 'Transponder', 'PA-AN-001'],
      ['Tappeto di rilevamento RFID', 'Transponder', 'PA-RF-001'],
      ['Tabellone luminoso', 'Visualizzazione', 'PA-TB-001'],
      ['Monitor di gara', 'Visualizzazione', 'PA-MO-001'],
      ['Computer portatile', 'Elaborazione dati', 'PA-PC-001'],
      ['Computer da cronometraggio', 'Elaborazione dati', 'PA-PC-002'],
      ['Stampante portatile', 'Stampa', 'PA-ST-001'],
      ['Gruppo di continuità UPS', 'Alimentazione', 'PA-UP-001'],
      ['Batteria 12 V', 'Alimentazione', 'PA-BT-001'],
      ['Alimentatore 12 V', 'Alimentazione', 'PA-AL-001'],
      ['Router Wi-Fi', 'Rete', 'PA-RT-001'],
      ['Switch di rete', 'Rete', 'PA-SW-001'],
      ['Hub USB', 'Connettività', 'PA-HU-001'],
      ['Cavo Ethernet (x10)', 'Cablaggio', 'PA-CE-010'],
      ['Cavo seriale (x5)', 'Cablaggio', 'PA-CS-005'],
      ['Cavo alimentazione (x10)', 'Cablaggio', 'PA-CA-010'],
      ['Anemometro', 'Misurazione', 'PA-AN-002'],
      ['Microfono di partenza', 'Partenza', 'PA-MC-001'],
      ['Altoparlante portatile', 'Comunicazione', 'PA-SP-001'],
      ['Semaforo di partenza', 'Partenza', 'PA-SF-001'],
      ['Dispositivo luminoso di partenza', 'Partenza', 'PA-DL-001'],
      ['Valigia porta-attrezzature', 'Logistica', 'PA-VA-001'],
      ['Borsa porta-radio', 'Logistica', 'PA-BR-001'],
      ['Multipresa elettrica', 'Alimentazione', 'PA-MP-001'],
      ['Prolunga elettrica 25 m', 'Alimentazione', 'PA-PE-001']
    ];
    for (const [nome, tipo, numero_serie] of attrezzatureDati) {
      insAttrezzatura.run(nome, tipo, numero_serie, 'disponibile', null);
    }

    // --- Gare (passate e future), tutte nel territorio di Palermo ---
    const insGara = db.prepare(`
      INSERT INTO gare (nome, disciplina_id, data_gara, ora_gara, luogo, indirizzo, lat, lng, stato, cronometristi_richiesti, note, creato_da)
      VALUES (@nome, @disciplina_id, @data_gara, @ora_gara, @luogo, @indirizzo, @lat, @lng, @stato, @cronometristi_richiesti, @note, @creato_da)
    `);

    const garaPassata = insGara.run({
      nome: 'Trofeo Città di Palermo - Corsa su strada', disciplina_id: discPodismo,
      data_gara: '2026-06-14', ora_gara: '09:00', luogo: 'Foro Italico', indirizzo: 'Foro Italico, Palermo',
      lat: 38.1097, lng: 13.3663, stato: 'svolta', cronometristi_richiesti: 3,
      note: 'Manifestazione podistica cittadina, 10 km', creato_da: idDesignatore1
    }).lastInsertRowid;

    const garaFutura1 = insGara.run({
      nome: 'Gran Fondo Sicilia - Ciclismo su strada', disciplina_id: discCiclismo,
      data_gara: '2026-09-20', ora_gara: '08:30', luogo: 'Monreale', indirizzo: 'Piazza Duomo, Monreale',
      lat: 38.0819, lng: 13.2900, stato: 'confermata', cronometristi_richiesti: 4,
      note: 'Gara ciclistica regionale con partenza da Monreale', creato_da: idDesignatore1
    }).lastInsertRowid;

    const garaFutura2 = insGara.run({
      nome: 'Meeting Regionale Atletica Leggera', disciplina_id: discAtletica,
      data_gara: '2026-09-05', ora_gara: '15:00', luogo: 'Stadio della Favorita', indirizzo: 'Viale del Fante, Palermo',
      lat: 38.1607, lng: 13.3418, stato: 'pianificata', cronometristi_richiesti: 5,
      note: 'Meeting con gare su pista di velocita e mezzofondo', creato_da: idDesignatore2
    }).lastInsertRowid;

    const garaFutura3 = insGara.run({
      nome: 'Campionato Provinciale Nuoto', disciplina_id: discNuoto,
      data_gara: '2026-10-11', ora_gara: '10:00', luogo: 'Piscina Comunale', indirizzo: 'Via Paolo Gili, Palermo',
      lat: 38.1289, lng: 13.3556, stato: 'pianificata', cronometristi_richiesti: 2,
      note: null, creato_da: idDesignatore2
    }).lastInsertRowid;

    // --- Disponibilita dei cronometristi ---
    const insDisp = db.prepare(`
      INSERT INTO disponibilita (utente_id, data_inizio, data_fine, tipo, note)
      VALUES (?, ?, ?, ?, ?)
    `);
    insDisp.run(idCronometristi[0], '2026-09-18', '2026-09-22', 'disponibile', null);
    insDisp.run(idCronometristi[1], '2026-09-19', '2026-09-21', 'disponibile', null);
    insDisp.run(idCronometristi[2], '2026-09-20', '2026-09-20', 'non_disponibile', 'Impegno personale');
    insDisp.run(idCronometristi[3], '2026-09-01', '2026-09-10', 'disponibile', null);
    insDisp.run(idCronometristi[5], '2026-09-01', '2026-09-10', 'disponibile', null);
    insDisp.run(idCronometristi[9], '2026-09-15', '2026-09-25', 'disponibile', null);

    // --- Convocazioni ---
    const insConv = db.prepare(`
      INSERT INTO convocazioni (gara_id, utente_id, ruolo_servizio, stato, punteggio_assegnazione, data_risposta, note)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    // Convocazioni per la gara passata (svolta) - completate
    insConv.run(garaPassata, idCronometristi[0], 'Rilevazione arrivi', 'completata', 92.5, '2026-06-01 10:00:00', null);
    insConv.run(garaPassata, idCronometristi[1], 'Cronometraggio', 'completata', 88.0, '2026-06-01 11:00:00', null);
    insConv.run(garaPassata, idCronometristi[9], 'Supporto tecnico', 'completata', 81.2, '2026-06-02 09:00:00', null);
    // Convocazioni per la Gran Fondo (futura, confermata)
    insConv.run(garaFutura1, idCronometristi[0], 'Cronometraggio', 'confermata', 90.0, '2026-08-20 14:00:00', null);
    insConv.run(garaFutura1, idCronometristi[9], 'Rilevazione arrivi', 'proposta', 84.3, null, null);

    // --- Risultati per la gara svolta ---
    const insRisultato = db.prepare(`
      INSERT INTO risultati (gara_id, pettorale, atleta_nome, categoria, tempo, posizione, note)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insRisultato.run(garaPassata, '101', 'Mario Verdi', 'Senior M', '00:32:14', 1, null);
    insRisultato.run(garaPassata, '203', 'Giulia Neri', 'Senior F', '00:35:47', 1, null);
    insRisultato.run(garaPassata, '104', 'Antonio Bruno', 'Senior M', '00:32:59', 2, null);

    // --- Notifiche di esempio ---
    const insNotifica = db.prepare(`
      INSERT INTO notifiche (utente_id, titolo, messaggio, tipo, letto, link)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insNotifica.run(idCronometristi[0], 'Nuova convocazione', 'Sei stato convocato per "Gran Fondo Sicilia - Ciclismo su strada" il 20/09/2026.', 'convocazione', 0, `/pages/gara-dettaglio.html?id=${garaFutura1}`);
    insNotifica.run(idCronometristi[9], 'Convocazione da confermare', 'Conferma la tua disponibilita per "Gran Fondo Sicilia - Ciclismo su strada".', 'convocazione', 0, `/pages/gara-dettaglio.html?id=${garaFutura1}`);
    insNotifica.run(idDesignatore1, 'Promemoria gara imminente', 'La gara "Gran Fondo Sicilia - Ciclismo su strada" si avvicina: verifica le convocazioni.', 'promemoria', 0, `/pages/gara-dettaglio.html?id=${garaFutura1}`);
  });

  transazione();

  console.log('Database popolato con successo.');
  console.log('Credenziali demo (password per tutti gli utenti): ' + PASSWORD_DEMO);
  console.log('  admin@cronoservice.it            (Amministratore di sistema)');
  console.log('  presidente@cronoservice.it        (Presidente associazione)');
  console.log('  laura.greco@cronoservice.it       (Designatore servizi)');
  console.log('  marco.bianchi@cronoservice.it     (Designatore servizi)');
  console.log('  paolo.russo@cronoservice.it       (Cronometrista)');
  console.log('  ... e altri 9 cronometristi (vedi tabella utenti)');
}

seed();
