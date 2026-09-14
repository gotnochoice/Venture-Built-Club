const { getPool } = require('../lib/db');
const { respondError, respondSuccess, applyCors } = require('../lib/auth');

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    return respondError(res, 405, 'Method not allowed');
  }

  try {
    const { pillar, status = 'upcoming', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let sql = 'SELECT * FROM events WHERE 1=1';
    const params = [];

    if (status === 'upcoming') {
      sql += ` AND start_date > NOW()`;
    } else if (status === 'past') {
      sql += ` AND start_date <= NOW()`;
    }

    if (pillar) {
      sql += ` AND pillar = $${params.length + 1}`;
      params.push(pillar);
    }

    sql += ` ORDER BY start_date ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const pool = getPool();
    const result = await pool.query(sql, params);

    respondSuccess(res, 200, {
      data: result.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (error) {
    console.error(error);
    respondError(res, 500, 'Failed to fetch events');
  }
};
