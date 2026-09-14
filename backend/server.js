require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'API is running' });
});

// Routes
app.use('/api/auth', require('./routes/auth')(pool));
app.use('/api/profile', require('./routes/profile')(pool));
app.use('/api/directory', require('./routes/directory')(pool));
app.use('/api/events', require('./routes/events')(pool));
app.use('/api/resources', require('./routes/resources')(pool));
app.use('/api/co-builders', require('./routes/coBuilders')(pool));
app.use('/api/admin', require('./routes/admin')(pool));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, pool };
