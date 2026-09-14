const express = require('express');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

module.exports = (pool) => {
  const router = express.Router();

  // List resources - Knowledge Gap pillar
  router.get('/', async (req, res) => {
    try {
      const { pillar, resourceType, category, eventId, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      let sql = 'SELECT * FROM resources WHERE 1=1';
      const params = [];

      if (pillar) {
        sql += ` AND pillar = $${params.length + 1}`;
        params.push(pillar);
      }

      if (resourceType) {
        sql += ` AND resource_type = $${params.length + 1}`;
        params.push(resourceType);
      }

      if (category) {
        sql += ` AND category = $${params.length + 1}`;
        params.push(category);
      }

      if (eventId) {
        sql += ` AND event_id = $${params.length + 1}`;
        params.push(eventId);
      }

      sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await pool.query(sql, params);

      res.json({
        data: result.rows,
        pagination: { page: parseInt(page), limit: parseInt(limit) }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch resources' });
    }
  });

  // Get single resource
  router.get('/:resourceId', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM resources WHERE id = $1', [req.params.resourceId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch resource' });
    }
  });

  // Upload resource (admin only)
  router.post('/', verifyToken, verifyAdmin, async (req, res) => {
    try {
      const { title, description, resourceType, pillar, eventId, fileUrl, category } = req.body;

      const resourceId = uuidv4();
      await pool.query(
        `INSERT INTO resources (id, title, description, resource_type, pillar, event_id, file_url, category, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [resourceId, title, description, resourceType, pillar, eventId, fileUrl, category, req.user.id]
      );

      const result = await pool.query('SELECT * FROM resources WHERE id = $1', [resourceId]);
      res.status(201).json({ message: 'Resource uploaded', resource: result.rows[0] });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to upload resource' });
    }
  });

  return router;
};
