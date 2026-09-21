const { getPool } = require('../../../lib/db');
const { respondError, respondSuccess, applyCors, verifyToken } = require('../../../lib/auth');

const VALID_STAGES = ['applied', 'interview', 'accepted', 'rejected'];

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;

  if (req.method !== 'PATCH') {
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
    const { id, stage, internalNotes } = req.body;

    if (!id) {
      return respondError(res, 400, 'Application id is required');
    }
    if (stage && !VALID_STAGES.includes(stage)) {
      return respondError(res, 400, 'Invalid stage');
    }

    const pool = getPool();
    await pool.query(
      `UPDATE team_applications
       SET stage = COALESCE($1, stage),
           internal_notes = COALESCE($2, internal_notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [stage || null, internalNotes ?? null, id]
    );

    const result = await pool.query('SELECT * FROM team_applications WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return respondError(res, 404, 'Team application not found');
    }

    respondSuccess(res, 200, { message: 'Team application updated', application: result.rows[0] });
  } catch (error) {
    console.error(error);
    respondError(res, 500, 'Failed to update team application');
  }
};
