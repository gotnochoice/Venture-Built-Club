const { getPool } = require('../../lib/db');
const { respondError, respondSuccess, applyCors } = require('../../lib/auth');
const { v4: uuidv4 } = require('uuid');

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return respondError(res, 405, 'Method not allowed');
  }

  try {
    const {
      fullName, email, phone, department, level,
      whoAreYou, whatBuilding, startupPull, persistentProblem, whatIsVentureBuilt,
      cvUrl, pitchDeckUrl,
      clubSkills, clubSkillsOther, builderSkills, builderSkillsOther,
      roleFit, roleFitOther, roleFitReason,
      meetingDays, meetingTime, canCommitHours, comfortablePitching
    } = req.body;

    if (!fullName || !email || !phone || !department || !level || !whoAreYou || !whatBuilding ||
        !persistentProblem || !whatIsVentureBuilt || !cvUrl || !roleFitReason) {
      return respondError(res, 400, 'Please fill in all required fields');
    }
    if (!Array.isArray(meetingDays) || meetingDays.length === 0) {
      return respondError(res, 400, 'Please select at least one day for the weekly meeting');
    }
    if (!meetingTime) {
      return respondError(res, 400, 'Please provide a meeting time');
    }

    const applicationId = uuidv4();
    const pool = getPool();

    await pool.query(
      `INSERT INTO applications (
        id, full_name, email, phone, department, level,
        who_are_you, what_building, startup_pull, persistent_problem, what_is_venture_built,
        cv_url, pitch_deck_url,
        club_skills, club_skills_other, builder_skills, builder_skills_other,
        role_fit, role_fit_other, role_fit_reason,
        meeting_days, meeting_time, can_commit_hours, comfortable_pitching
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12, $13,
        $14, $15, $16, $17,
        $18, $19, $20,
        $21, $22, $23, $24
      )`,
      [
        applicationId, fullName, email, phone, department, level,
        whoAreYou, whatBuilding, startupPull || null, persistentProblem, whatIsVentureBuilt,
        cvUrl, pitchDeckUrl || null,
        clubSkills || [], clubSkillsOther || null, builderSkills || [], builderSkillsOther || null,
        roleFit || null, roleFitOther || null, roleFitReason,
        meetingDays || [], meetingTime || null, canCommitHours ?? null, comfortablePitching ?? null
      ]
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
