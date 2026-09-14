const { getPool } = require('../../lib/db');
const { respondError, respondSuccess, applyCors, verifyToken } = require('../../lib/auth');

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    return respondError(res, 405, 'Method not allowed');
  }

  const user = verifyToken(req);
  if (!user) {
    return respondError(res, 401, 'Unauthorized');
  }
  if (user.role !== 'admin') {
    return respondError(res, 403, 'Admin access required');
  }

  try {
    const { stage } = req.query;
    const pool = getPool();

    let sql = 'SELECT * FROM applications WHERE 1=1';
    const params = [];

    if (stage) {
      sql += ` AND stage = $${params.length + 1}`;
      params.push(stage);
    }

    sql += ' ORDER BY created_at DESC';

    const result = await pool.query(sql, params);

    respondSuccess(res, 200, { data: result.rows });
  } catch (error) {
    console.error(error);
    respondError(res, 500, 'Failed to fetch applications');
  }
};
