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
      firstName, lastName, email, organizationName, roleTitle,
      helpTypes, helpTypesOther,
      agreedToCommunications, agreedToDataStorage
    } = req.body;

    if (!firstName || !lastName || !email || !organizationName || !roleTitle) {
      return respondError(res, 400, 'Please fill in all required fields');
    }
    if (!Array.isArray(helpTypes) || helpTypes.length === 0) {
      return respondError(res, 400, 'Please select at least one way you would like to help');
    }
    if (!agreedToCommunications || !agreedToDataStorage) {
      return respondError(res, 400, 'Please agree to both consent checkboxes to continue');
    }

    const inquiryId = uuidv4();
    const pool = getPool();

    await pool.query(
      `INSERT INTO partner_inquiries (
        id, first_name, last_name, email, organization_name, role_title,
        help_types, help_types_other,
        agreed_to_communications, agreed_to_data_storage
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8,
        $9, $10
      )`,
      [
        inquiryId, firstName, lastName, email, organizationName, roleTitle,
        helpTypes, helpTypesOther || null,
        agreedToCommunications, agreedToDataStorage
      ]
    );

    respondSuccess(res, 201, {
      message: 'Inquiry submitted successfully',
      inquiryId
    });
  } catch (error) {
    console.error(error);
    respondError(res, 500, 'Failed to submit inquiry');
  }
};
