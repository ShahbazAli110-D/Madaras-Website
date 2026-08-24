const { verifyAuthToken } = require('../utils/auth');

const getBearerToken = (authorizationHeader = '') => {
  if (typeof authorizationHeader !== 'string') {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
};

const requireAuth = (allowedRoles = []) => (req, res, next) => {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ error: 'Authentication token is required.' });
  }

  const payload = verifyAuthToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
    return res.status(403).json({ error: 'You do not have permission to access this resource.' });
  }

  req.auth = payload;
  return next();
};

module.exports = {
  requireAdmin: requireAuth(['head', 'admin']),
  requireHead: requireAuth(['head', 'admin']),
  requireAuth,
  requireTeacher: requireAuth(['teacher']),
};
