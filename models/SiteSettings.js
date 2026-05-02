const mongoose = require("mongoose");

const siteSettingsSchema = new mongoose.Schema(
  {
    maintenance:  { type: Boolean, default: false },
    applications: { type: Boolean, default: true  },
    withdrawals:  { type: Boolean, default: true  },
    registration: { type: Boolean, default: true  },
    emailNotifs:  { type: Boolean, default: true  },
    smsAlerts:    { type: Boolean, default: false },
    announcement: { type: String,  default: ""    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SiteSettings", siteSettingsSchema);
