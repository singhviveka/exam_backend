export function errorHandler(err, req, res, next) {
    if (err?.status) {
      return res.status(err.status).json({ error: err.message, details: err.details || null });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
  