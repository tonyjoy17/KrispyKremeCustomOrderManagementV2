const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const requireFactory = (req, res, next) => {
  if (!req.user?.isFactory && !req.user?.isAdmin) {
    return res.status(403).json({ message: 'Factory access required' });
  }
  next();
};

const requireRetail = (req, res, next) => {
  if (req.user?.isFactory) {
    return res.status(403).json({ message: 'Retail store access required' });
  }
  next();
};

module.exports = { authenticate, requireFactory, requireRetail };
