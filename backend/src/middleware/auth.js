const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401); // kein Token → 401

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT verify failed:', err.message);
      return res.sendStatus(403);         // ungültiger Token → 403
    }
    req.user = user;                      // Userdaten an Request anhängen
    next();                               // alles OK → weiter zum Controller
  });
}

module.exports = authenticateToken;
