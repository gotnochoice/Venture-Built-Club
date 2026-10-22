const { createResourceHandler } = require('../../../lib/adminResource');

const cohortHandler = createResourceHandler('applications');
const clubHandler = createResourceHandler('club_applications');

// Same route, same function slot, serves both the Cohort and Club
// application boards - pass ?kind=club to get the Club one.
module.exports = async (req, res) => {
  const handler = req.query && req.query.kind === 'club' ? clubHandler : cohortHandler;
  return handler(req, res);
};
