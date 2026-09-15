const { getPool } = require('../lib/db');
const { respondError, respondSuccess, applyCors } = require('../lib/auth');
const { v4: uuidv4 } = require('uuid');

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return respondError(res, 405, 'Method not allowed');
  }

  try {
    const {
      fullName, email, department, level,
      whoAreYou, whatBuilding, startupPull, persistentProblem, whatIsVentureBuilt, portfolioLinks
    } = req.body;

    if (!fullName || !email || !department || !level || !whoAreYou || !whatBuilding || !persistentProblem || !whatIsVentureBuilt) {
      return respondError(res, 400, 'Please fill in all required fields');
    }

    const applicationId = uuidv4();
    const pool = getPool();

    await pool.query(
      `INSERT INTO applications (id, full_name, email, department, level, who_are_you, what_building, startup_pull, persistent_problem, what_is_venture_built, portfolio_links)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [applicationId, fullName, email, department, level, whoAreYou, whatBuilding, startupPull || null, persistentProblem, whatIsVentureBuilt, portfolioLinks || null]
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
