const USUser          = require("../models/USUser");
const SAUser          = require("../models/SAUser");
const LoanApplication = require("../models/LoanApplication");
const Transaction     = require("../models/Transaction");
const { asyncHandler } = require("../middleware/errorHandler");

// ─────────────────────────────────────────────────────────────────────────────
//  APPLY FOR LOAN
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /loans/apply:
 *   post:
 *     summary: Submit a loan application
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, purpose, duration, employment, jobTitle, income, bankName, accountNumber]
 *             properties:
 *               amount:        { type: number }
 *               purpose:       { type: string }
 *               duration:      { type: string }
 *               payDate:       { type: string, format: date }
 *               employment:    { type: string }
 *               jobTitle:      { type: string }
 *               income:        { type: number }
 *               creditScore:   { type: number }
 *               notes:         { type: string }
 *               bankName:      { type: string }
 *               accountNumber: { type: string }
 *               routingNumber: { type: string }
 *     responses:
 *       201:
 *         description: Application submitted
 *       400:
 *         description: Validation error
 *       409:
 *         description: Existing pending/active loan
 */
const applyForLoan = asyncHandler(async (req, res) => {
  const { id, country } = req.user;

  const Model = country === "ZA" ? SAUser : USUser;
  const user  = await Model.findById(id);
  if (!user) return res.status(404).json({ error: "User not found." });

  if (user.loanStatus === "pending") {
    return res.status(409).json({ error: "You already have a pending loan application." });
  }
  if (user.loanStatus === "active") {
    return res.status(409).json({ error: "You already have an active loan." });
  }

  const {
    amount, purpose, duration, payDate,
    employment, jobTitle, income, creditScore, notes,
    bankName, accountNumber, routingNumber,
    cashAppTag, cashAppPhone,
  } = req.body;

  if (!amount || !purpose || !duration || !employment || !jobTitle || !income || !bankName || !accountNumber) {
    return res.status(400).json({ error: "Please fill in all required fields." });
  }

  const application = await LoanApplication.create({
    userId:    id,
    country,
    userName:  `${user.firstName} ${user.lastName}`,
    userEmail: user.email,
    amount:      Number(amount),
    purpose,
    duration,
    payDate:     payDate ? new Date(payDate) : undefined,
    employment,
    jobTitle,
    income:      Number(income),
    creditScore: creditScore ? Number(creditScore) : undefined,
    notes:       notes || "",
    bankName,
    accountNumber,
    routingNumber:  routingNumber  || undefined,
    cashAppTag:     cashAppTag     || undefined,
    cashAppPhone:   cashAppPhone   || undefined,
  });

  await user.updateOne({ loanStatus: "pending" });

  await Transaction.create({
    userId:  id,
    country,
    type:    "status",
    desc:    `Loan application submitted — ${purpose}`,
    amount:  null,
    kind:    "neutral",
  });

  res.status(201).json({
    message:     "Application submitted successfully.",
    application: { id: application._id, status: application.status, amount: application.amount },
  });
});

module.exports = { applyForLoan };
