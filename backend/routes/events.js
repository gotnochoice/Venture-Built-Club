const express = require('express');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

module.exports = (pool) => {
  const router = express.Router();

  // List events (upcoming or past)
  router.get('/', async (req, res) => {
    try {
      const { pillar, type, status = 'upcoming', page = 1, limit = 20 } = req.query;
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

      if (type) {
        sql += ` AND event_type = $${params.length + 1}`;
        params.push(type);
      }

      sql += ` ORDER BY start_date ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await pool.query(sql, params);

      res.json({
        data: result.rows,
        pagination: { page: parseInt(page), limit: parseInt(limit) }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  });

  // Get single event
  router.get('/:eventId', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM events WHERE id = $1', [req.params.eventId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Event not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch event' });
    }
  });

  // Create event (admin only)
  router.post('/', verifyToken, verifyAdmin, async (req, res) => {
    try {
      const { title, description, eventType, pillar, startDate, endDate, location, isOnline, meetingLink, capacity } = req.body;

      const eventId = uuidv4();
      await pool.query(
        `INSERT INTO events (id, title, description, event_type, pillar, start_date, end_date, location, is_online, meeting_link, capacity, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [eventId, title, description, eventType, pillar, startDate, endDate, location, isOnline, meetingLink, capacity, req.user.id]
      );

      const result = await pool.query('SELECT * FROM events WHERE id = $1', [eventId]);
      res.status(201).json({ message: 'Event created', event: result.rows[0] });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create event' });
    }
  });

  // RSVP to event
  router.post('/:eventId/rsvp', verifyToken, async (req, res) => {
    try {
      const { status = 'registered' } = req.body;
      const userId = req.user.id;
      const eventId = req.params.eventId;

      const rsvpId = uuidv4();
      await pool.query(
        `INSERT INTO event_rsvps (id, event_id, user_id, status) VALUES ($1, $2, $3, $4)
         ON CONFLICT (event_id, user_id) DO UPDATE SET status = $4, created_at = CURRENT_TIMESTAMP`,
        [rsvpId, eventId, userId, status]
      );

      res.json({ message: 'RSVP successful' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to RSVP' });
    }
  });

  // Get event attendees
  router.get('/:eventId/attendees', async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT u.id, u.first_name, u.last_name, er.status
         FROM event_rsvps er
         JOIN users u ON er.user_id = u.id
         WHERE er.event_id = $1`,
        [req.params.eventId]
      );

      res.json({ data: result.rows });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch attendees' });
    }
  });

  return router;
};
