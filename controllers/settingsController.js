const SiteSettings         = require("../models/SiteSettings");
const { asyncHandler }     = require("../middleware/errorHandler");

const ALLOWED_FIELDS = ["maintenance", "applications", "withdrawals", "registration", "emailNotifs", "smsAlerts", "announcement"];

// Fetch the single settings doc, creating it with defaults if it doesn't exist yet
const getOrCreate = () =>
  SiteSettings.findOneAndUpdate({}, { $setOnInsert: {} }, { upsert: true, new: true });

// GET /api/admin/settings  (admin token required)
const getAdminSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreate();
  res.json(settings);
});

// PATCH /api/admin/settings  (admin token required)
const updateSettings = asyncHandler(async (req, res) => {
  const update = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in req.body) update[key] = req.body[key];
  }
  if (!Object.keys(update).length) {
    return res.status(400).json({ error: "No valid fields provided." });
  }
  const settings = await SiteSettings.findOneAndUpdate(
    {},
    { $set: update },
    { upsert: true, new: true }
  );
  res.json(settings);
});

// GET /api/settings  (public — no auth)
const getPublicSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreate();
  res.json({
    maintenance:  settings.maintenance,
    applications: settings.applications,
    withdrawals:  settings.withdrawals,
    registration: settings.registration,
  });
});

module.exports = { getAdminSettings, updateSettings, getPublicSettings };
