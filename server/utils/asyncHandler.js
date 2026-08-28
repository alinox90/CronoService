// Wrapper per evitare try/catch ripetuti nelle route handler asincrone:
// cattura automaticamente le eccezioni e le inoltra all'errorHandler centrale
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
