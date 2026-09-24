const { getPool } = require('../../lib/db');
const { respondError, respondSuccess, applyCors } = require('../../lib/auth');
const { sendCopyEmail } = require('../../lib/mailer');
const { v4: uuidv4 } = require('uuid');

const VALID_ROLES = ['Head of Programs', 'Head of Talent', 'Head of Growth', 'Head of Finance/Operations'];

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return respondError(res, 405, 'Method not allowed');
  }

  try {
    const {
      fullName, email, phone, department, level, referredBy, linkedin,
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
        id, full_name, email, phone, department, level, referred_by, linkedin_url,
        role, led_before, why_role, first_month_plan, additional_info,
        cv_url
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13,
        $14
      )`,
      [
        applicationId, fullName, email, phone, department, level, referredBy || null, linkedin || null,
        role, ledBefore, whyRole, firstMonthPlan, additionalInfo || null,
        cvUrl
      ]
    );

    try {
      await sendCopyEmail({
        subject: `New Team Application: ${fullName} — ${role}`,
        html: `
          <h2>New Team Application</h2>
          <p><strong>Name:</strong> ${fullName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Department:</strong> ${department} · ${level}</p>
          <p><strong>Referred By:</strong> ${referredBy || '—'}</p>
          <p><strong>LinkedIn:</strong> ${linkedin || '—'}</p>
          <p><strong>Role Applied For:</strong> ${role}</p>
          <p><strong>Led Before:</strong><br>${ledBefore}</p>
          <p><strong>Why This Role:</strong><br>${whyRole}</p>
          <p><strong>First Month Plan:</strong><br>${firstMonthPlan}</p>
          <p><strong>Additional Info:</strong><br>${additionalInfo || '—'}</p>
          <p><strong>CV:</strong> <a href="${cvUrl}">${cvUrl}</a></p>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send notification email', emailError);
    }

    respondSuccess(res, 201, {
      message: 'Team application submitted successfully',
      applicationId
    });
  } catch (error) {
    console.error(error);
    respondError(res, 500, 'Failed to submit application');
  }
};
