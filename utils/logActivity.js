const ActivityLog = require("../models/ActivityLog");

const logActivity = async ({ type, action, user = "System", ip = "—", status = "info" }) => {
  try {
    await ActivityLog.create({ type, action, user, ip, status });
  } catch {
    // non-critical — never crash the request if logging fails
  }
};

module.exports = logActivity;
