const express = require('express');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

module.exports = (pool) => {
  const router = express.Router();

  // Dashboard stats
  router.get('/dashboard', verifyToken, verifyAdmin, async (req, res) => {
    try {
      const stats = await Promise.all([
        pool.query('SELECT COUNT(*) as total FROM users'),
        pool.query('SELECT COUNT(*) as total FROM events WHERE start_date > NOW()'),
        pool.query('SELECT COUNT(*) as total FROM event_rsvps WHERE status = \'registered\''),
        pool.query('SELECT COUNT(*) as total FROM co_builder_requests WHERE status = \'pending\'')
      ]);

      res.json({
        totalMembers: parseInt(stats[0].rows[0].total),
        upcomingEvents: parseInt(stats[1].rows[0].total),
        activeRsvps: parseInt(stats[2].rows[0].total),
        pendingCoBuilderRequests: parseInt(stats[3].rows[0].total)
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  });

  // List all users (admin only)
  router.get('/users', verifyToken, verifyAdmin, async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const result = await pool.query(
        `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.created_at,
                p.department, p.year_level
         FROM users u
         LEFT JOIN profiles p ON u.id = p.user_id
         ORDER BY u.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      res.json({ data: result.rows });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // Log admin action
  router.post('/log', verifyToken, verifyAdmin, async (req, res) => {
    try {
      const { action, resourceType, resourceId, details } = req.body;

      const logId = uuidv4();
      await pool.query(
        `INSERT INTO admin_logs (id, admin_id, action, resource_type, resource_id, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [logId, req.user.id, action, resourceType, resourceId, JSON.stringify(details)]
      );

      res.status(201).json({ message: 'Action logged' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to log action' });
    }
  });

  // Get all events (admin view with more details)
  router.get('/events', verifyToken, verifyAdmin, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT e.*, u.first_name, u.last_name,
                COUNT(DISTINCT er.user_id) as rsvp_count
         FROM events e
         LEFT JOIN users u ON e.created_by = u.id
         LEFT JOIN event_rsvps er ON e.id = er.event_id
         GROUP BY e.id, u.first_name, u.last_name
         ORDER BY e.start_date DESC`
      );

      res.json({ data: result.rows });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  });

  // Create progress items (curriculum)
  router.post('/progress-items', verifyToken, verifyAdmin, async (req, res) => {
    try {
      const { title, description, category, orderIndex } = req.body;

      const itemId = uuidv4();
      await pool.query(
        `INSERT INTO progress_items (id, title, description, category, order_index)
         VALUES ($1, $2, $3, $4, $5)`,
        [itemId, title, description, category, orderIndex]
      );

      res.status(201).json({ message: 'Progress item created', itemId });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create progress item' });
    }
  });

  // Get all progress items
  router.get('/progress-items', verifyToken, verifyAdmin, async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT * FROM progress_items ORDER BY order_index ASC'
      );

      res.json({ data: result.rows });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch progress items' });
    }
  });

  return router;
};
