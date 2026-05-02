const USUser          = require("../models/USUser");
const SAUser          = require("../models/SAUser");
const LoanApplication = require("../models/LoanApplication");
const Transaction     = require("../models/Transaction");
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

// ─────────────────────────────────────────────────────────────────────────────
//  LIST LOAN APPLICATIONS
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /admin/loans:
 *   get:
 *     summary: List all loan applications
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [all, pending, active, completed, rejected, defaulted] }
 */
const listLoans = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status && status !== "all" ? { status } : {};

  const loans = await LoanApplication.find(filter).sort({ createdAt: -1 });

  const formatted = loans.map(l => ({
    id:       l._id,
    user:     l.userName,
    email:    l.userEmail,
    amount:   l.amount,
    disbursed: l.disbursedAmount,
    status:   l.status,
    rate:     l.approvedInterestRate || "—",
    term:     l.approvedTerm || l.duration,
    started:  l.startedAt
      ? new Date(l.startedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
      : "—",
    nextDue:  l.nextDueDate
      ? new Date(l.nextDueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "—",
  }));

  res.json({ loans: formatted });
});

// ─────────────────────────────────────────────────────────────────────────────
//  APPROVE LOAN
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /admin/loans/{id}/approve:
 *   patch:
 *     summary: Approve a pending loan application
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
const approveLoan = asyncHandler(async (req, res) => {
  const loan = await LoanApplication.findById(req.params.id);
  if (!loan) return res.status(404).json({ error: "Loan application not found." });
  if (loan.status !== "pending") {
    return res.status(409).json({ error: "Only pending loans can be approved." });
  }

  const {
    interestRate = "8.5%",
    term,
    disbursedAmount,
    nextDueDate,
  } = req.body;

  const now       = new Date();
  const disburse  = disbursedAmount ? Number(disbursedAmount) : loan.amount;
  const approvedTerm = term || loan.duration;

  // Calculate next due date: first day of next month by default
  let dueDate = nextDueDate
    ? new Date(nextDueDate)
    : new Date(now.getFullYear(), now.getMonth() + 1, 1);

  loan.status               = "active";
  loan.disbursedAmount      = disburse;
  loan.approvedInterestRate = interestRate;
  loan.approvedTerm         = approvedTerm;
  loan.startedAt            = now;
  loan.nextDueDate          = dueDate;
  await loan.save();

  const Model = loan.country === "ZA" ? SAUser : USUser;
  await Model.findByIdAndUpdate(loan.userId, {
    $set: {
      loanStatus:      "active",
      loanApproved:    loan.amount,
      accountBalance:  disburse,
      totalWithdrawn:  disburse,
      interestRate,
      termRemaining:   approvedTerm,
      nextPaymentDate: dueDate,
    },
  });

  await Transaction.create({
    userId:  loan.userId,
    country: loan.country,
    type:    "loan",
    desc:    `Loan approved & disbursed — ${loan.purpose}`,
    amount:  disburse,
    kind:    "credit",
  });

  res.json({ message: "Loan approved.", loan: { id: loan._id, status: loan.status } });
});

// ─────────────────────────────────────────────────────────────────────────────
//  REJECT LOAN
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /admin/loans/{id}/reject:
 *   patch:
 *     summary: Reject a pending loan application
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
const rejectLoan = asyncHandler(async (req, res) => {
  const loan = await LoanApplication.findById(req.params.id);
  if (!loan) return res.status(404).json({ error: "Loan application not found." });
  if (loan.status !== "pending") {
    return res.status(409).json({ error: "Only pending loans can be rejected." });
  }

  loan.status = "rejected";
  await loan.save();

  const Model = loan.country === "ZA" ? SAUser : USUser;
  await Model.findByIdAndUpdate(loan.userId, { $set: { loanStatus: "none" } });

  await Transaction.create({
    userId:  loan.userId,
    country: loan.country,
    type:    "status",
    desc:    "Loan application rejected",
    amount:  null,
    kind:    "neutral",
  });

  res.json({ message: "Loan rejected.", loan: { id: loan._id, status: loan.status } });
});

// ─────────────────────────────────────────────────────────────────────────────
//  COMPLETE LOAN
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /admin/loans/{id}/complete:
 *   patch:
 *     summary: Mark an active loan as completed
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
const completeLoan = asyncHandler(async (req, res) => {
  const loan = await LoanApplication.findById(req.params.id);
  if (!loan) return res.status(404).json({ error: "Loan application not found." });
  if (loan.status !== "active") {
    return res.status(409).json({ error: "Only active loans can be marked complete." });
  }

  loan.status = "completed";
  await loan.save();

  const Model = loan.country === "ZA" ? SAUser : USUser;
  await Model.findByIdAndUpdate(loan.userId, {
    $set: {
      loanStatus:      "none",
      termRemaining:   "0 months",
      nextPaymentDate: null,
      daysUntilPayment: 0,
      repaidPercent:   100,
    },
  });

  await Transaction.create({
    userId:  loan.userId,
    country: loan.country,
    type:    "status",
    desc:    "Loan fully repaid — account closed",
    amount:  null,
    kind:    "neutral",
  });

  res.json({ message: "Loan marked complete.", loan: { id: loan._id, status: loan.status } });
});

module.exports = {
  listUSUsers, listSAUsers, getUser, updateUser, deleteUser,
  listLoans, approveLoan, rejectLoan, completeLoan,
};
