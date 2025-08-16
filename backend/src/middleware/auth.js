import jwt from "jsonwebtoken";

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401); // no token → 401

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT verify failed:', err.message);
      return res.sendStatus(401);         // invalid/expired token → 401
    }
    req.user = user;                      // attach user data to request
    next();                               // all good → next
  });
}

export default authenticateToken;
