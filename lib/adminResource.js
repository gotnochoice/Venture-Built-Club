const { getPool } = require('./db');
const { respondError, respondSuccess, applyCors, verifyToken } = require('./auth');

const VALID_STAGES = ['applied', 'interview', 'accepted', 'rejected'];

// Shared GET (list) / PATCH (update stage + internal notes) handler for the
// admin recruitment boards. `table` is always a hardcoded caller-supplied
// name, never user input, so interpolating it into the SQL is safe.
function createResourceHandler(table) {
  return async (req, res) => {
    if (applyCors(req, res)) return;

    const user = verifyToken(req);
    if (!user) {
      return respondError(res, 401, 'Unauthorized');
    }
    if (user.role !== 'admin') {
      return respondError(res, 403, 'Admin access required');
    }

    if (req.method === 'GET') {
      try {
        const { stage } = req.query;
        const pool = getPool();

        let sql = `SELECT * FROM ${table} WHERE 1=1`;
        const params = [];
        if (stage) {
          sql += ` AND stage = $${params.length + 1}`;
          params.push(stage);
        }
        sql += ' ORDER BY created_at DESC';

        const result = await pool.query(sql, params);
        return respondSuccess(res, 200, { data: result.rows });
      } catch (error) {
        console.error(error);
        return respondError(res, 500, `Failed to fetch ${table}`);
      }
    }

    if (req.method === 'PATCH') {
      try {
        const { id, stage, internalNotes } = req.body;

        if (!id) {
          return respondError(res, 400, 'Application id is required');
        }
        if (stage && !VALID_STAGES.includes(stage)) {
          return respondError(res, 400, 'Invalid stage');
        }

        const pool = getPool();
        await pool.query(
          `UPDATE ${table}
           SET stage = COALESCE($1, stage),
               internal_notes = COALESCE($2, internal_notes),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [stage || null, internalNotes ?? null, id]
        );

        const result = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
        if (result.rows.length === 0) {
          return respondError(res, 404, 'Not found');
        }

        return respondSuccess(res, 200, { message: 'Updated', application: result.rows[0] });
      } catch (error) {
        console.error(error);
        return respondError(res, 500, `Failed to update ${table}`);
      }
    }

    return respondError(res, 405, 'Method not allowed');
  };
}

module.exports = { createResourceHandler };
