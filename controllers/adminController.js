const USUser = require("../models/USUser");
const SAUser = require("../models/SAUser");
const { asyncHandler } = require("../middleware/errorHandler");

const LOAN_FIELDS = [
  "accountBalance", "loanApproved", "monthlyPayback", "totalWithdrawn",
  "totalPaid", "loanStatus", "nextPaymentDate", "daysUntilPayment",
  "repaidPercent", "interestRate", "termRemaining", "creditUtil",
];

// ─────────────────────────────────────────────────────────────────────────────
//  LIST USERS
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /admin/users/us:
 *   get:
 *     summary: List all US applicants
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated list of US users
 */
const listUSUsers = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip  = (page - 1) * limit;

  const [users, total] = await Promise.all([
    USUser.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
    USUser.countDocuments(),
  ]);

  res.json({ users, total, page, pages: Math.ceil(total / limit) });
});

/**
 * @swagger
 * /admin/users/sa:
 *   get:
 *     summary: List all South African applicants
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
const listSAUsers = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip  = (page - 1) * limit;

  const [users, total] = await Promise.all([
    SAUser.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
    SAUser.countDocuments(),
  ]);

  res.json({ users, total, page, pages: Math.ceil(total / limit) });
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET SINGLE USER
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /admin/users/{country}/{id}:
 *   get:
 *     summary: Get a single user by country and ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: country
 *         required: true
 *         schema: { type: string, enum: [us, sa] }
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 */
const getUser = asyncHandler(async (req, res) => {
  const Model = req.params.country === "us" ? USUser : SAUser;
  const user  = await Model.findById(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ user });
});

// ─────────────────────────────────────────────────────────────────────────────
//  UPDATE USER LOAN DATA
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /admin/users/{country}/{id}:
 *   patch:
 *     summary: Update a user's loan data or active status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
const updateUser = asyncHandler(async (req, res) => {
  const Model = req.params.country === "us" ? USUser : SAUser;

  // Only allow loan fields and isActive — never allow password or role changes here
  const allowed = [...LOAN_FIELDS, "isActive"];
  const updates = {};
  for (const key of allowed) {
    if (key in req.body) updates[key] = req.body[key];
  }

  const user = await Model.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ user });
});

// ─────────────────────────────────────────────────────────────────────────────
//  DELETE USER
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /admin/users/{country}/{id}:
 *   delete:
 *     summary: Permanently delete a user account
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
const deleteUser = asyncHandler(async (req, res) => {
  const Model = req.params.country === "us" ? USUser : SAUser;
  const user  = await Model.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ success: true });
});

module.exports = { listUSUsers, listSAUsers, getUser, updateUser, deleteUser };
