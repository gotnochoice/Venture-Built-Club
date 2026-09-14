const { getPool } = require('../lib/db');
const { respondError, respondSuccess, applyCors } = require('../lib/auth');
const { v4: uuidv4 } = require('uuid');

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return respondError(res, 405, 'Method not allowed');
  }

  try {
    const { fullName, email, phone, department, yearLevel, whatBuilding, conviction, teamInfo, portfolioLink } = req.body;

    if (!fullName || !email || !whatBuilding || !conviction) {
      return respondError(res, 400, 'Name, email, what you\'re building, and your conviction are required');
    }

    const applicationId = uuidv4();
    const pool = getPool();

    await pool.query(
      `INSERT INTO applications (id, full_name, email, phone, department, year_level, what_building, conviction, team_info, portfolio_link)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [applicationId, fullName, email, phone || null, department || null, yearLevel || null, whatBuilding, conviction, teamInfo || null, portfolioLink || null]
    );

    respondSuccess(res, 201, {
      message: 'Application submitted successfully',
      applicationId
    });
  } catch (error) {
    console.error(error);
    respondError(res, 500, 'Failed to submit application');
  }
};
