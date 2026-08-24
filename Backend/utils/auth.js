const crypto = require('crypto');

const DEFAULT_TOKEN_TTL_SECONDS = 60 * 60 * 8;
const DEFAULT_PASSWORD_RESET_TOKEN_TTL_SECONDS = 60 * 30;
const AUTH_SECRET = process.env.AUTH_SECRET || 'madarsa-development-secret-change-me';

const createPasswordHash = (plainTextPassword) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(String(plainTextPassword), salt, 64).toString('hex');

  return `${salt}:${derivedKey}`;
};

const verifyPassword = (plainTextPassword, storedHash = '') => {
  if (typeof storedHash !== 'string' || !storedHash.includes(':')) {
    return false;
  }

  const [salt, originalHash] = storedHash.split(':');
  const derivedKey = crypto.scryptSync(String(plainTextPassword), salt, 64).toString('hex');
  const originalBuffer = Buffer.from(originalHash, 'hex');
  const derivedBuffer = Buffer.from(derivedKey, 'hex');

  if (originalBuffer.length !== derivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(originalBuffer, derivedBuffer);
};

const encodeSegment = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');

const signValue = (value) =>
  crypto.createHmac('sha256', AUTH_SECRET).update(value).digest('base64url');

const createAuthToken = (payload, ttlSeconds = DEFAULT_TOKEN_TTL_SECONDS) => {
  const issuedAt = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: issuedAt,
    exp: issuedAt + ttlSeconds,
  };

  const encodedPayload = encodeSegment(tokenPayload);
  const signature = signValue(encodedPayload);

  return `${encodedPayload}.${signature}`;
};

const createPasswordResetToken = () => crypto.randomBytes(32).toString('hex');

const hashPasswordResetToken = (token) =>
  crypto.createHash('sha256').update(String(token)).digest('hex');

const verifyAuthToken = (token = '') => {
  if (typeof token !== 'string' || !token.includes('.')) {
    return null;
  }

  const [encodedPayload, signature] = token.split('.');

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signValue(encodedPayload);

  if (
    Buffer.from(signature).length !== Buffer.from(expectedSignature).length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));

    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
};

module.exports = {
  AUTH_SECRET,
  DEFAULT_TOKEN_TTL_SECONDS,
  DEFAULT_PASSWORD_RESET_TOKEN_TTL_SECONDS,
  createAuthToken,
  createPasswordHash,
  createPasswordResetToken,
  hashPasswordResetToken,
  verifyAuthToken,
  verifyPassword,
};
