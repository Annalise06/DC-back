const USUser = require("../models/USUser");
const SAUser = require("../models/SAUser");
const Admin  = require("../models/Admin");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashRefreshToken,
  compareRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
} = require("../services/tokenService");
const { asyncHandler } = require("../middleware/errorHandler");

const getModel = (country) => {
  if (country === "US") return USUser;
  if (country === "ZA") return SAUser;
  return null;
};

const issueTokens = async (user, res) => {
  const accessToken  = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  const hashedRefresh = await hashRefreshToken(refreshToken);

  const Model = user.role === "admin" ? Admin : getModel(user.country);
  await Model.findByIdAndUpdate(user._id, {
    $push: { refreshTokens: hashedRefresh },
  });

  setRefreshCookie(res, refreshToken);
  return accessToken;
};

// ─────────────────────────────────────────────────────────────────────────────
//  US SIGNUP
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /auth/us/signup:
 *   post:
 *     summary: Register a new US applicant
 *     tags: [Auth — US]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, phone, dob, password]
 *             properties:
 *               firstName:  { type: string, example: Marcus }
 *               lastName:   { type: string, example: Reid }
 *               email:      { type: string, example: marcus@example.com }
 *               phone:      { type: string, example: "+12125550100" }
 *               gender:     { type: string, enum: [male, female, non-binary, prefer_not_to_say] }
 *               dob:        { type: string, format: date, example: "1990-04-15" }
 *               password:   { type: string, example: "SecurePass1" }
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       409:
 *         description: Email already registered
 */
const usSignup = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, gender, dob, address, password } = req.body;

  const existing = await USUser.findOne({ email });
  if (existing) {
    return res.status(409).json({ error: "Email is already registered." });
  }

  const user = await USUser.create({
    firstName, lastName, email, phone, gender,
    dob: new Date(dob),
    address,
    password,
  });

  const accessToken = await issueTokens(user, res);
  res.status(201).json({ accessToken, user: user.toProfile() });
});

// ─────────────────────────────────────────────────────────────────────────────
//  SA SIGNUP
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /auth/sa/signup:
 *   post:
 *     summary: Register a new South African applicant
 *     tags: [Auth — SA]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, phone, dob, password]
 *             properties:
 *               firstName:  { type: string, example: Sipho }
 *               lastName:   { type: string, example: Dlamini }
 *               email:      { type: string, example: sipho@example.co.za }
 *               phone:      { type: string, example: "+27821234567" }
 *               rsaId:      { type: string, example: "9001015800085" }
 *               dob:        { type: string, format: date, example: "1990-01-01" }
 *               password:   { type: string, example: "SecurePass1" }
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       409:
 *         description: Email already registered
 */
const saSignup = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, rsaId, gender, dob, address, password } = req.body;

  const existing = await SAUser.findOne({ email });
  if (existing) {
    return res.status(409).json({ error: "Email is already registered." });
  }

  const user = await SAUser.create({
    firstName, lastName, email, phone, rsaId, gender,
    dob: new Date(dob),
    address,
    password,
  });

  const accessToken = await issueTokens(user, res);
  res.status(201).json({ accessToken, user: user.toProfile() });
});

// ─────────────────────────────────────────────────────────────────────────────
//  US LOGIN
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /auth/us/login:
 *   post:
 *     summary: Log in as a US applicant
 *     tags: [Auth — US]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, example: marcus@example.com }
 *               password: { type: string, example: "SecurePass1" }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 */
const usLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await USUser.findOne({ email }).select("+password");
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  if (!user.isActive) {
    return res.status(403).json({ error: "This account has been deactivated. Please contact support." });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const accessToken = await issueTokens(user, res);
  res.json({ accessToken, user: user.toProfile() });
});

// ─────────────────────────────────────────────────────────────────────────────
//  SA LOGIN
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /auth/sa/login:
 *   post:
 *     summary: Log in as a South African applicant
 *     tags: [Auth — SA]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, example: sipho@example.co.za }
 *               password: { type: string, example: "SecurePass1" }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 */
const saLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await SAUser.findOne({ email }).select("+password");
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  if (!user.isActive) {
    return res.status(403).json({ error: "This account has been deactivated. Please contact support." });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const accessToken = await issueTokens(user, res);
  res.json({ accessToken, user: user.toProfile() });
});

// ─────────────────────────────────────────────────────────────────────────────
//  REFRESH TOKEN
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Silently renew the access token using the refresh cookie
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200:
 *         description: New access token issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken: { type: string }
 *       401:
 *         description: Missing, invalid, or expired refresh token
 */
const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    return res.status(401).json({ error: "No refresh token found. Please log in." });
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    clearRefreshCookie(res);
    return res.status(401).json({ error: "Refresh token is invalid or expired. Please log in again." });
  }

  let user;
  if (decoded.role === "admin") {
    user = await Admin.findById(decoded.id).select("+refreshTokens");
  } else if (decoded.country === "US") {
    user = await USUser.findById(decoded.id).select("+refreshTokens");
  } else {
    user = await SAUser.findById(decoded.id).select("+refreshTokens");
  }

  if (!user) {
    clearRefreshCookie(res);
    return res.status(401).json({ error: "User not found. Please log in again." });
  }

  let matchIndex = -1;
  for (let i = 0; i < user.refreshTokens.length; i++) {
    const isMatch = await compareRefreshToken(token, user.refreshTokens[i]);
    if (isMatch) { matchIndex = i; break; }
  }

  if (matchIndex === -1) {
    user.refreshTokens = [];
    await user.save();
    clearRefreshCookie(res);
    return res.status(401).json({ error: "Refresh token reuse detected. All sessions have been invalidated." });
  }

  user.refreshTokens.splice(matchIndex, 1);

  const newAccessToken  = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);
  const hashedNew       = await hashRefreshToken(newRefreshToken);

  user.refreshTokens.push(hashedNew);
  await user.save();

  setRefreshCookie(res, newRefreshToken);
  res.json({ accessToken: newAccessToken });
});

// ─────────────────────────────────────────────────────────────────────────────
//  LOGOUT
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out and invalidate the current refresh token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    clearRefreshCookie(res);
    return res.json({ success: true });
  }

  try {
    const decoded = verifyRefreshToken(token);

    let user;
    if (decoded.role === "admin") {
      user = await Admin.findById(decoded.id).select("+refreshTokens");
    } else if (decoded.country === "US") {
      user = await USUser.findById(decoded.id).select("+refreshTokens");
    } else {
      user = await SAUser.findById(decoded.id).select("+refreshTokens");
    }

    if (user) {
      const remaining = [];
      for (const hash of user.refreshTokens) {
        const isMatch = await compareRefreshToken(token, hash);
        if (!isMatch) remaining.push(hash);
      }
      user.refreshTokens = remaining;
      await user.save();
    }
  } catch {
    // Token already expired — still clear the cookie
  }

  clearRefreshCookie(res);
  res.json({ success: true });
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET /ME
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get the currently authenticated user's profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Not authenticated
 */
const getMe = asyncHandler(async (req, res) => {
  const { id, role, country } = req.user;

  let user;
  if (role === "admin") {
    user = await Admin.findById(id);
  } else if (country === "US") {
    user = await USUser.findById(id);
  } else {
    user = await SAUser.findById(id);
  }

  if (!user) {
    return res.status(401).json({ error: "User not found." });
  }

  if (role === "admin") {
    return res.json({ user: { id: user._id, email: user.email, role: "admin" } });
  }

  res.json({ user: user.toProfile() });
});

// ─────────────────────────────────────────────────────────────────────────────
//  ADMIN LOGIN
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /admin/auth/login:
 *   post:
 *     summary: Log in as an admin
 *     tags: [Admin]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, example: admin@dcloans.com }
 *               password: { type: string, example: "AdminPass1" }
 *     responses:
 *       200:
 *         description: Admin login successful
 *       401:
 *         description: Invalid credentials
 */
const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email }).select("+password");
  if (!admin) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  if (!admin.isActive) {
    return res.status(403).json({ error: "Admin account is deactivated." });
  }

  const isMatch = await admin.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const accessToken = await issueTokens(admin, res);
  res.json({ accessToken, role: admin.role });
});

module.exports = {
  usSignup, saSignup,
  usLogin,  saLogin,
  refreshToken,
  logout,
  getMe,
  adminLogin,
};
