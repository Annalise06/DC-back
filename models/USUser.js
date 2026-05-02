const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const usUserSchema = new mongoose.Schema(
  {
    firstName: {
      type:     String,
      required: [true, "First name is required"],
      trim:     true,
    },
    lastName: {
      type:     String,
      required: [true, "Last name is required"],
      trim:     true,
    },
    email: {
      type:      String,
      required:  [true, "Email is required"],
      unique:    true,
      lowercase: true,
      trim:      true,
    },
    phone: {
      type:     String,
      required: [true, "Phone number is required"],
      trim:     true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "non-binary", "prefer_not_to_say"],
    },
    dob: {
      type:     Date,
      required: [true, "Date of birth is required"],
    },
    ssn: {
      type: String,
    },
    address: {
      line1: { type: String, trim: true },
      line2: { type: String, trim: true },
      city:  { type: String, trim: true },
      state: { type: String, trim: true },
      zip:   { type: String, trim: true },
    },
    password: {
      type:     String,
      required: [true, "Password is required"],
    },
    refreshTokens: {
      type:    [String],
      default: [],
      select:  false,
    },
    accountBalance:   { type: Number, default: 0 },
    loanApproved:     { type: Number, default: 0 },
    monthlyPayback:   { type: Number, default: 0 },
    totalWithdrawn:   { type: Number, default: 0 },
    totalPaid:        { type: Number, default: 0 },
    loanStatus:       { type: String, enum: ["active", "pending", "none"], default: "none" },
    nextPaymentDate:  { type: Date,   default: null },
    daysUntilPayment: { type: Number, default: 0 },
    repaidPercent:    { type: Number, default: 0, min: 0, max: 100 },
    interestRate:     { type: String, default: "0%" },
    termRemaining:    { type: String, default: "0 months" },
    creditUtil:       { type: Number, default: 0, min: 0, max: 100 },
    role:     { type: String, enum: ["user", "admin"], default: "user" },
    country:  { type: String, default: "US", immutable: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

usUserSchema.index({ email: 1 });

usUserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

usUserSchema.methods.comparePassword = async function (plaintext) {
  return bcrypt.compare(plaintext, this.password);
};

usUserSchema.methods.toProfile = function () {
  return {
    id:               this._id,
    name:             `${this.firstName} ${this.lastName}`,
    email:            this.email,
    initials:         `${this.firstName[0]}${this.lastName[0]}`.toUpperCase(),
    role:             this.role === "admin" ? "Admin" : "Standard Member",
    country:          this.country,
    memberSince:      new Date(this.createdAt).toLocaleString("en-US", { month: "short", year: "numeric" }),
    accountBalance:   this.accountBalance,
    loanApproved:     this.loanApproved,
    monthlyPayback:   this.monthlyPayback,
    totalWithdrawn:   this.totalWithdrawn,
    totalPaid:        this.totalPaid,
    loanStatus:       this.loanStatus,
    nextPaymentDate:  this.nextPaymentDate
      ? new Date(this.nextPaymentDate).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })
      : null,
    daysUntilPayment: this.daysUntilPayment,
    repaidPercent:    this.repaidPercent,
    interestRate:     this.interestRate,
    termRemaining:    this.termRemaining,
    creditUtil:       this.creditUtil,
  };
};

usUserSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.refreshTokens;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("USUser", usUserSchema);
