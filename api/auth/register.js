const { getPool } = require('../lib/db');
const { generateToken, hashPassword, respondError, respondSuccess, applyCors } = require('../lib/auth');
const { v4: uuidv4 } = require('uuid');

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return respondError(res, 405, 'Method not allowed');
  }

  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return respondError(res, 400, 'Email and password required');
    }

    const pool = getPool();
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    if (existingUser.rows.length > 0) {
      return respondError(res, 400, 'Email already registered');
    }

    const passwordHash = await hashPassword(password);
    const userId = uuidv4();

    await pool.query(
      'INSERT INTO users (id, email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4, $5)',
      [userId, email, passwordHash, firstName || '', lastName || '']
    );

    await pool.query(
      'INSERT INTO profiles (id, user_id) VALUES ($1, $2)',
      [uuidv4(), userId]
    );

    const token = generateToken({ id: userId, email });

    respondSuccess(res, 201, {
      message: 'User registered successfully',
      token,
      user: { id: userId, email, firstName, lastName }
    });
  } catch (error) {
    console.error(error);
    respondError(res, 500, `Registration failed: ${error.message}`);
  }
};
