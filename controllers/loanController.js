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
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/LoanApplicationRequest'
 *     responses:
 *       201:
 *         description: Application submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Application submitted successfully.
 *                 application:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: pending
 *                     amount:
 *                       type: number
 *                       example: 5000
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Existing pending or active loan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const applyForLoan = asyncHandler(async (req, res) => {
  // console.log("BODY:", req.body);
  // console.log("FILES:", req.files);
  // console.log("CONTENT-TYPE:", req.headers['content-type']);
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
    cashAppPin, ssn,
  } = req.body;

  const required = { amount, purpose, duration, employment, jobTitle, income, bankName, accountNumber };
  const missing  = Object.entries(required).filter(([, v]) => v === undefined || v === null || v === "");
  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing fields: ${missing.map(([k]) => k).join(", ")}` });
  }

  const uploadedDocs = (req.files || []).map((file, i) => {
    const labels = req.body.documentLabels;
    const label  = Array.isArray(labels)
      ? labels[i]
      : req.body[`documentLabels[${i}]`] || `Document ${i + 1}`;
    return { label, url: file.path, publicId: file.filename };
  });

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
    cashAppPin:     cashAppPin     || undefined,
    ssn:  ssn  || undefined,
    documents:      uploadedDocs,
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
