const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId:  { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    country: { type: String, required: true },
    type:    { type: String, enum: ["withdrawal", "payment", "loan", "status"], required: true },
    desc:    { type: String, required: true },
    amount:  { type: Number, default: null },
    kind:    { type: String, enum: ["credit", "debit", "neutral"], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
