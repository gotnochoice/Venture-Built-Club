const { getPool } = require('../../lib/db');
const { respondError, respondSuccess, applyCors } = require('../../lib/auth');
const { v4: uuidv4 } = require('uuid');

const VALID_ROLES = ['Head of Programs', 'Head of Talent', 'Head of Growth', 'Head of Finance/Operations'];

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return respondError(res, 405, 'Method not allowed');
  }

  try {
    const {
      fullName, email, phone, department, level, referredBy,
      role, ledBefore, whyRole, firstMonthPlan, additionalInfo,
      cvUrl
    } = req.body;

    if (!fullName || !email || !phone || !department || !level ||
        !role || !ledBefore || !whyRole || !firstMonthPlan || !cvUrl) {
      return respondError(res, 400, 'Please fill in all required fields');
    }
    if (!VALID_ROLES.includes(role)) {
      return respondError(res, 400, 'Please select a valid role');
    }

    const applicationId = uuidv4();
    const pool = getPool();

    await pool.query(
      `INSERT INTO team_applications (
        id, full_name, email, phone, department, level, referred_by,
        role, led_before, why_role, first_month_plan, additional_info,
        cv_url
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12,
        $13
      )`,
      [
        applicationId, fullName, email, phone, department, level, referredBy || null,
        role, ledBefore, whyRole, firstMonthPlan, additionalInfo || null,
        cvUrl
      ]
    );

    respondSuccess(res, 201, {
      message: 'Team application submitted successfully',
      applicationId
    });
  } catch (error) {
    console.error(error);
    respondError(res, 500, 'Failed to submit application');
  }
};
