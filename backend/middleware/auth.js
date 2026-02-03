import jwt from 'jsonwebtoken';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('[authenticateToken] URL:', req.url);
  console.log('[authenticateToken] Has token:', !!token);

  if (!token) {
    return res.status(401).json({ message: 'Token manquant' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('[authenticateToken] Token invalid:', err.message);
      return res.status(403).json({ message: 'Token invalide' });
    }
    console.log('[authenticateToken] User decoded:', user);
    req.user = user;
    next();
  });
};

export default authenticateToken;