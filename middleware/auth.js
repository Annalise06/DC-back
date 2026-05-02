const jwt = require("jsonwebtoken");
const { asyncHandler } = require("./errorHandler");

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided. Please log in." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded; // { id, role, country, iat, exp }
    next();
  } catch {
    return res.status(401).json({ error: "Token is invalid or expired." });
  }
});

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: "Forbidden: insufficient permissions." });
  }
  next();
};

module.exports = { protect, requireRole };
