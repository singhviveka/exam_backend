export function requireEmail(req, res, next) {
    const email = req.headers['x-user-email'];
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'x-user-email header is required' });
    }
    req.userEmail = email.trim().toLowerCase();
    next();
  }
  