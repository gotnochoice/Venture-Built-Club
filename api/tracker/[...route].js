// Backend for the /tracker page. One catch-all function (not a file
// per task action) so this stays a single Vercel function slot:
//
//   GET    /api/tracker/all                -> { tasks, milestones }
//   POST   /api/tracker/tasks              -> create a task
//   PATCH  /api/tracker/tasks?id=<uuid>    -> update a task (status, priority, full edit)
//   DELETE /api/tracker/tasks?id=<uuid>    -> delete a task
//
// This is a *required* catch-all ([...route].js) - Vercel's plain
// (non-Next.js) function router doesn't support the optional
// ([[...route]].js) form, so every path here must have a segment
// after /api/tracker/. The task id is passed as a query param rather
// than a further path segment (e.g. /tasks/:id) because PATCH/DELETE
// requests to a two-segment path were 404ing at the platform level
// in production while one-segment paths worked fine - keeping every
// route to exactly one fixed segment sidesteps that entirely.
//
// No login: the page is reached only by its unlisted URL, same trust
// model as the rest of this internal tool - see DEPLOYMENT.md.

const { parse: parseUrl } = require('url');
const { getPool } = require('../../lib/db');
const { respondError, respondSuccess, applyCors } = require('../../lib/auth');

const VALID_STATUS = ['todo', 'doing', 'blocked', 'done'];
const VALID_PRIORITY = ['normal', 'high'];

const TASK_COLUMNS = `
  id, title, role, to_char(due, 'YYYY-MM-DD') AS due, status, priority, owner, notes,
  created_at AS "createdAt", updated_at AS "updatedAt"
`;

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;

  const parsed = parseUrl(req.url, true);
  const pathname = (parsed.pathname || '')
    .replace(/^\/+/, '')
    .replace(/^api\//, '')
    .replace(/^tracker(\/|$)/, '')
    .replace(/\/+$/, '');
  const [resource] = pathname ? pathname.split('/') : [];
  const id = parsed.query.id || null;
  const pool = getPool();

  try {
    if (resource === 'all' && req.method === 'GET') {
      const [tasks, milestones] = await Promise.all([
        pool.query(`SELECT ${TASK_COLUMNS} FROM tracker_tasks ORDER BY due ASC`),
        pool.query(`SELECT id, label, to_char(date, 'YYYY-MM-DD') AS date, to_char(end_date, 'YYYY-MM-DD') AS end FROM tracker_milestones ORDER BY date ASC`),
      ]);
      return respondSuccess(res, 200, { tasks: tasks.rows, milestones: milestones.rows });
    }

    if (resource === 'tasks' && !id && req.method === 'POST') {
      const { title, role, due, status, priority, owner, notes } = req.body || {};
      if (!title || !role || !due) {
        return respondError(res, 400, 'title, role, and due are required');
      }
      if (status && !VALID_STATUS.includes(status)) return respondError(res, 400, 'Invalid status');
      if (priority && !VALID_PRIORITY.includes(priority)) return respondError(res, 400, 'Invalid priority');

      const result = await pool.query(
        `INSERT INTO tracker_tasks (title, role, due, status, priority, owner, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING ${TASK_COLUMNS}`,
        [title.trim(), role, due, status || 'todo', priority || 'normal', (owner || '').trim() || null, (notes || '').trim() || null]
      );
      return respondSuccess(res, 201, { task: result.rows[0] });
    }

    if (resource === 'tasks' && id && req.method === 'PATCH') {
      const { title, role, due, status, priority, owner, notes } = req.body || {};
      if (status && !VALID_STATUS.includes(status)) return respondError(res, 400, 'Invalid status');
      if (priority && !VALID_PRIORITY.includes(priority)) return respondError(res, 400, 'Invalid priority');

      const result = await pool.query(
        `UPDATE tracker_tasks SET
           title = COALESCE($1, title),
           role = COALESCE($2, role),
           due = COALESCE($3, due),
           status = COALESCE($4, status),
           priority = COALESCE($5, priority),
           owner = COALESCE($6, owner),
           notes = COALESCE($7, notes),
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $8
         RETURNING ${TASK_COLUMNS}`,
        [title ?? null, role ?? null, due ?? null, status ?? null, priority ?? null, owner ?? null, notes ?? null, id]
      );
      if (result.rows.length === 0) return respondError(res, 404, 'Task not found');
      return respondSuccess(res, 200, { task: result.rows[0] });
    }

    if (resource === 'tasks' && id && req.method === 'DELETE') {
      await pool.query('DELETE FROM tracker_tasks WHERE id = $1', [id]);
      return respondSuccess(res, 200, { message: 'Deleted' });
    }

    return respondError(res, 404, 'Not found');
  } catch (error) {
    console.error('[api/tracker]', error);
    return respondError(res, 500, 'Internal server error');
  }
};
