const { getPool } = require('../lib/db');
const { generateToken, verifyPassword, respondError, respondSuccess, applyCors } = require('../lib/auth');

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return respondError(res, 405, 'Method not allowed');
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return respondError(res, 400, 'Email and password required');
    }

    const pool = getPool();
    const result = await pool.query(
      'SELECT id, email, password_hash, first_name, last_name, role FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];

    if (!user) {
      return respondError(res, 401, 'Invalid credentials');
    }

    const passwordMatch = await verifyPassword(password, user.password_hash);
    if (!passwordMatch) {
      return respondError(res, 401, 'Invalid credentials');
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    respondSuccess(res, 200, {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    respondError(res, 500, 'Login failed');
  }
};
