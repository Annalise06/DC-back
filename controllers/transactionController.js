const Transaction = require("../models/Transaction");
const { asyncHandler } = require("../middleware/errorHandler");

// ─────────────────────────────────────────────────────────────────────────────
//  GET USER TRANSACTIONS
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Get transaction history for the authenticated user
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [all, withdrawal, payment, loan, status] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         description: List of transactions
 */
const getTransactions = asyncHandler(async (req, res) => {
  const { id } = req.user;
  const type    = req.query.type;
  const page    = Math.max(1, parseInt(req.query.page)  || 1);
  const limit   = Math.min(100, parseInt(req.query.limit) || 50);
  const skip    = (page - 1) * limit;

  const filter = { userId: id };
  if (type && type !== "all") filter.type = type;

  const [rawTxs, total] = await Promise.all([
    Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Transaction.countDocuments(filter),
  ]);

  const transactions = rawTxs.map((tx, i) => ({
    id:     tx._id,
    type:   tx.type,
    desc:   tx.desc,
    date:   new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    amount: tx.amount,
    kind:   tx.kind,
  }));

  res.json({ transactions, total, page, pages: Math.ceil(total / limit) });
});

module.exports = { getTransactions };
