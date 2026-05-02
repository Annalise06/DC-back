const jwt    = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const generateAccessToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, country: user.country || null },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" }
  );

const generateRefreshToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, country: user.country || null },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
  );

const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET);

const hashRefreshToken   = (token) => bcrypt.hash(token, 10);
const compareRefreshToken = (token, hash) => bcrypt.compare(token, hash);

const setRefreshCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge:   7 * 24 * 60 * 60 * 1000,
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashRefreshToken,
  compareRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
};
