const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    type:   { type: String, enum: ["auth", "loan", "withdrawal", "system", "error", "admin"], required: true },
    action: { type: String, required: true },
    user:   { type: String, default: "System" },
    ip:     { type: String, default: "—" },
    status: { type: String, enum: ["success", "pending", "failed", "info"], default: "info" },
  },
  { timestamps: true }
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
