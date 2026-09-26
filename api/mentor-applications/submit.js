const { getPool } = require('../../lib/db');
const { respondError, respondSuccess, applyCors } = require('../../lib/auth');
const { sendCopyEmail } = require('../../lib/mailer');
const { v4: uuidv4 } = require('uuid');

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return respondError(res, 405, 'Method not allowed');
  }

  try {
    const {
      fullName, email, phone, currentRole, linkedin,
      builtOrBacked, helpTypes, helpTypesOther, whyMentor, availability
    } = req.body;

    if (!fullName || !email || !currentRole || !builtOrBacked || !whyMentor ||
        !Array.isArray(helpTypes) || helpTypes.length === 0) {
      return respondError(res, 400, 'Please fill in all required fields');
    }

    const applicationId = uuidv4();
    const pool = getPool();

    await pool.query(
      `INSERT INTO mentor_applications (
        id, full_name, email, phone, role_title, linkedin_url,
        built_or_backed, help_types, help_types_other, why_mentor, availability
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11
      )`,
      [
        applicationId, fullName, email, phone || null, currentRole, linkedin || null,
        builtOrBacked, helpTypes, helpTypesOther || null, whyMentor, availability || null
      ]
    );

    try {
      await sendCopyEmail({
        subject: `New Mentor Application: ${fullName}`,
        html: `
          <h2>New Mentor Application</h2>
          <p><strong>Name:</strong> ${fullName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || '—'}</p>
          <p><strong>Current Role:</strong> ${currentRole}</p>
          <p><strong>LinkedIn:</strong> ${linkedin || '—'}</p>
          <p><strong>What They've Built/Backed:</strong><br>${builtOrBacked}</p>
          <p><strong>How They Can Help:</strong> ${helpTypes.join(', ')}${helpTypesOther ? ' · ' + helpTypesOther : ''}</p>
          <p><strong>Why Mentor:</strong><br>${whyMentor}</p>
          <p><strong>Availability:</strong> ${availability || '—'}</p>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send notification email', emailError);
    }

    respondSuccess(res, 201, {
      message: 'Mentor application submitted successfully',
      applicationId
    });
  } catch (error) {
    console.error(error);
    respondError(res, 500, 'Failed to submit application');
  }
};
