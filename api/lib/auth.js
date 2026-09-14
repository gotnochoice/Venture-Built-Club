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

module.exports = { verifyToken, generateToken, hashPassword, verifyPassword, respondError, respondSuccess };
