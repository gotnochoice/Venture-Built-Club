const { getPool } = require('./db');
const { respondError, respondSuccess, applyCors, verifyToken } = require('./auth');

const VALID_STAGES = ['applied', 'interview', 'accepted', 'rejected'];

// Only the cohort `applications` table has score_* columns (added for the
// Score Sheet view) - club_applications doesn't, so the scored UPDATE below
// only runs for that table.

// Shared GET (list) / PATCH (update stage + internal notes) handler for the
// admin recruitment boards. `table` is always a hardcoded caller-supplied
// name, never user input, so interpolating it into the SQL is safe.
function createResourceHandler(table) {
  const supportsScoring = table === 'applications';
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
        const { id, stage, internalNotes, scoreIdea, scoreConviction, scoreCommitment, scoreBuilder, scoreNotes } = req.body;

        if (!id) {
          return respondError(res, 400, 'Application id is required');
        }
        if (stage && !VALID_STAGES.includes(stage)) {
          return respondError(res, 400, 'Invalid stage');
        }
        for (const [field, value] of Object.entries({ scoreIdea, scoreConviction, scoreCommitment, scoreBuilder })) {
          if (value != null && (value < 1 || value > 5)) {
            return respondError(res, 400, `${field} must be between 1 and 5`);
          }
        }

        const pool = getPool();
        // Yes / No / undecided decision for the cohort (cohort table only). Sent as
        // true, false or null; handled on its own because COALESCE can't set NULL.
        if (supportsScoring && Object.prototype.hasOwnProperty.call(req.body, 'cohortPick')) {
          const pick = req.body.cohortPick;
          if (pick !== true && pick !== false && pick !== null) {
            return respondError(res, 400, 'cohortPick must be true, false or null');
          }
          await pool.query(`UPDATE ${table} SET cohort_pick = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [pick, id]);
        }
        if (supportsScoring) {
          await pool.query(
            `UPDATE ${table}
             SET stage = COALESCE($1, stage),
                 internal_notes = COALESCE($2, internal_notes),
                 score_idea = COALESCE($3, score_idea),
                 score_conviction = COALESCE($4, score_conviction),
                 score_commitment = COALESCE($5, score_commitment),
                 score_builder = COALESCE($6, score_builder),
                 score_notes = COALESCE($7, score_notes),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $8`,
            [stage || null, internalNotes ?? null, scoreIdea ?? null, scoreConviction ?? null,
             scoreCommitment ?? null, scoreBuilder ?? null, scoreNotes ?? null, id]
          );
        } else {
          await pool.query(
            `UPDATE ${table}
             SET stage = COALESCE($1, stage),
                 internal_notes = COALESCE($2, internal_notes),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3`,
            [stage || null, internalNotes ?? null, id]
          );
        }

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
