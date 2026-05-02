require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const Admin    = require("../models/Admin");

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const existing = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
  if (existing) {
    console.log(`Admin already exists: ${process.env.ADMIN_EMAIL}`);
    process.exit(0);
  }

  await Admin.create({
    email:    process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  });

  console.log(`Admin created: ${process.env.ADMIN_EMAIL}`);
  process.exit(0);
};

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
