const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

function verifyToken(req) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

function generateToken(data) {
  return jwt.sign(data, process.env.JWT_SECRET, { expiresIn: '7d' });
}

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function respondError(res, status, error) {
  res.status(status).json({ error });
}

function respondSuccess(res, status, data) {
  res.status(status).json(data);
}

// Allows the API to be called from any Vercel deployment URL for this
// project (production domain, preview deployments, git-branch aliases),
// not just one hardcoded origin. Returns true if the request was a CORS
// preflight (OPTIONS) that has already been fully handled - callers
// should return immediately in that case.
function applyCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

module.exports = { verifyToken, generateToken, hashPassword, verifyPassword, respondError, respondSuccess, applyCors };
