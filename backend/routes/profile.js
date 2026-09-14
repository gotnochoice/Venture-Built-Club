const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

module.exports = (pool) => {
  const router = express.Router();

  // Get user profile
  router.get('/:userId', async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT u.id, u.email, u.first_name, u.last_name, u.role,
                p.department, p.year_level, p.skills, p.what_building,
                p.looking_for, p.bio, p.profile_image_url
         FROM users u
         LEFT JOIN profiles p ON u.id = p.user_id
         WHERE u.id = $1`,
        [req.params.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  // Update profile
  router.put('/update', verifyToken, async (req, res) => {
    try {
      const { department, yearLevel, skills, whatBuilding, lookingFor, bio, profileImageUrl } = req.body;
      const userId = req.user.id;

      await pool.query(
        `UPDATE profiles
         SET department = COALESCE($1, department),
             year_level = COALESCE($2, year_level),
             skills = COALESCE($3, skills),
             what_building = COALESCE($4, what_building),
             looking_for = COALESCE($5, looking_for),
             bio = COALESCE($6, bio),
             profile_image_url = COALESCE($7, profile_image_url),
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $8`,
        [department, yearLevel, skills ? `{${skills.join(',')}}` : null, whatBuilding, lookingFor, bio, profileImageUrl, userId]
      );

      const result = await pool.query(
        `SELECT u.id, u.email, u.first_name, u.last_name,
                p.department, p.year_level, p.skills, p.what_building,
                p.looking_for, p.bio, p.profile_image_url
         FROM users u
         LEFT JOIN profiles p ON u.id = p.user_id
         WHERE u.id = $1`,
        [userId]
      );

      res.json({ message: 'Profile updated', user: result.rows[0] });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  return router;
};
