const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: 'JWT secret is not configured' });
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
