// Calcolo della distanza geografica tra due punti (formula dell'emisenoverso / haversine)
const RAGGIO_TERRESTRE_KM = 6371;

function toRadianti(gradi) {
  return (gradi * Math.PI) / 180;
}

// Restituisce la distanza in km tra due coordinate, oppure null se una coordinata manca
function calcolaDistanzaKm(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;

  const dLat = toRadianti(lat2 - lat1);
  const dLng = toRadianti(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadianti(lat1)) * Math.cos(toRadianti(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return RAGGIO_TERRESTRE_KM * c;
}

// Geocodifica indirizzo + comune in coordinate lat/lng tramite Nominatim (OpenStreetMap),
// servizio gratuito senza API key. Restituisce null se l'indirizzo non e' risolvibile
// o in caso di errore di rete (nessuna eccezione propagata al chiamante).
async function geocodifica(indirizzo, comune) {
  const query = [indirizzo, comune].filter(Boolean).join(', ').trim();
  if (!query) return null;

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=it&q=${encodeURIComponent(query)}`;
    const risposta = await fetch(url, {
      headers: { 'User-Agent': 'CronoService-TesiFICRPalermo/1.0 (progetto di tesi universitaria)' }
    });
    if (!risposta.ok) return null;

    const risultati = await risposta.json();
    if (!Array.isArray(risultati) || risultati.length === 0) return null;

    const lat = parseFloat(risultati[0].lat);
    const lng = parseFloat(risultati[0].lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

    return { lat, lng };
  } catch (errore) {
    return null;
  }
}

module.exports = { calcolaDistanzaKm, geocodifica };
