const express = require('express');
const { verifyToken } = require('../middleware/auth');

module.exports = (pool) => {
  const router = express.Router();

  // Search members - Knowledge Gap + Co-Builders pillar
  router.get('/search', async (req, res) => {
    try {
      const { query, department, yearLevel, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      let sql = `
        SELECT u.id, u.first_name, u.last_name, u.email,
               p.department, p.year_level, p.skills, p.what_building,
               p.looking_for, p.profile_image_url
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE 1=1
      `;

      const params = [];

      if (query) {
        sql += ` AND (u.first_name ILIKE $${params.length + 1} OR u.last_name ILIKE $${params.length + 1})`;
        params.push(`%${query}%`);
      }

      if (department) {
        sql += ` AND p.department = $${params.length + 1}`;
        params.push(department);
      }

      if (yearLevel) {
        sql += ` AND p.year_level = $${params.length + 1}`;
        params.push(yearLevel);
      }

      sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await pool.query(sql, params);

      // Get total count
      let countSql = 'SELECT COUNT(*) FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE 1=1';
      const countParams = [];

      if (query) {
        countSql += ` AND (u.first_name ILIKE $${countParams.length + 1} OR u.last_name ILIKE $${countParams.length + 1})`;
        countParams.push(`%${query}%`);
      }
      if (department) {
        countSql += ` AND p.department = $${countParams.length + 1}`;
        countParams.push(department);
      }
      if (yearLevel) {
        countSql += ` AND p.year_level = $${countParams.length + 1}`;
        countParams.push(yearLevel);
      }

      const countResult = await pool.query(countSql, countParams);
      const total = parseInt(countResult.rows[0].count);

      res.json({
        data: result.rows,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Search failed' });
    }
  });

  // Get member by ID
  router.get('/:userId', async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT u.id, u.first_name, u.last_name, u.email,
                p.department, p.year_level, p.skills, p.what_building,
                p.looking_for, p.bio, p.profile_image_url
         FROM users u
         LEFT JOIN profiles p ON u.id = p.user_id
         WHERE u.id = $1`,
        [req.params.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Member not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch member' });
    }
  });

  return router;
};
