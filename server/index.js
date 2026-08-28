// Punto di ingresso del server Crono Service
const app = require('./app');
const env = require('./config/env');

app.listen(env.port, () => {
  console.log(`Crono Service in ascolto su http://localhost:${env.port}`);
});
