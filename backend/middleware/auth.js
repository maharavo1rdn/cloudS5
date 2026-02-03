import jwt from 'jsonwebtoken';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('🔐 Auth middleware - Token présent:', !!token);

  if (!token) {
    console.log('❌ Token manquant');
    return res.status(401).json({ message: 'Token manquant' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('❌ Token invalide:', err.message);
      return res.status(403).json({ message: 'Token invalide' });
    }
    console.log('✅ User authentifié:', user.email, 'level:', user.level);
    req.user = user;
    next();
  });
};

export default authenticateToken;