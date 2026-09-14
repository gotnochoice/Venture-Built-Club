const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

module.exports = (pool) => {
  const router = express.Router();

  // Send co-builder request - Co-Builders/eHub pillar
  router.post('/request', verifyToken, async (req, res) => {
    try {
      const { receiverId, requestType, message } = req.body;
      const requesterId = req.user.id;

      if (requesterId === receiverId) {
        return res.status(400).json({ error: 'Cannot send request to yourself' });
      }

      const requestId = uuidv4();
      await pool.query(
        `INSERT INTO co_builder_requests (id, requester_id, receiver_id, request_type, message, status)
         VALUES ($1, $2, $3, $4, $5, 'pending')`,
        [requestId, requesterId, receiverId, requestType, message]
      );

      res.status(201).json({ message: 'Request sent', requestId });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to send request' });
    }
  });

  // Get requests for current user
  router.get('/my-requests', verifyToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const { status = 'pending' } = req.query;

      let sql = `
        SELECT cr.id, cr.requester_id, cr.receiver_id, cr.request_type, cr.message, cr.status, cr.created_at,
               u.first_name, u.last_name, p.skills, p.what_building
        FROM co_builder_requests cr
        JOIN users u ON cr.requester_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE cr.receiver_id = $1
      `;

      const params = [userId];

      if (status && status !== 'all') {
        sql += ` AND cr.status = $${params.length + 1}`;
        params.push(status);
      }

      sql += ` ORDER BY cr.created_at DESC`;

      const result = await pool.query(sql, params);

      res.json({ data: result.rows });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch requests' });
    }
  });

  // Accept/reject request
  router.patch('/request/:requestId', verifyToken, async (req, res) => {
    try {
      const { status } = req.body;
      const requestId = req.params.requestId;

      if (!['accepted', 'rejected', 'completed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      await pool.query(
        `UPDATE co_builder_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [status, requestId]
      );

      res.json({ message: `Request ${status}` });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update request' });
    }
  });

  // Get outgoing requests
  router.get('/sent-requests', verifyToken, async (req, res) => {
    try {
      const userId = req.user.id;

      const result = await pool.query(
        `SELECT cr.id, cr.receiver_id, cr.request_type, cr.message, cr.status, cr.created_at,
                u.first_name, u.last_name, p.skills, p.what_building
         FROM co_builder_requests cr
         JOIN users u ON cr.receiver_id = u.id
         LEFT JOIN profiles p ON u.id = p.user_id
         WHERE cr.requester_id = $1
         ORDER BY cr.created_at DESC`,
        [userId]
      );

      res.json({ data: result.rows });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch requests' });
    }
  });

  return router;
};
