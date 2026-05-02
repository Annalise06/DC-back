/**
 * DC Loans — Express Server Entry Point
 *
 * Startup order:
 *  1. Load environment variables
 *  2. Connect to MongoDB
 *  3. Configure Express middleware (security, logging, parsing)
 *  4. Mount routes
 *  5. Mount Swagger docs
 *  6. Mount error handlers
 *  7. Start listening
 */

require("dotenv").config(); // Must be first — loads .env before any other module reads env vars

const express      = require("express");
const cors         = require("cors");
const helmet       = require("helmet");
const morgan       = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit    = require("express-rate-limit");
const swaggerUi    = require("swagger-ui-express");

const connectDB    = require("./config/db");
const swaggerSpec  = require("./config/swagger");
const authRoutes   = require("./routes/auth");
const adminRoutes  = require("./routes/admin");
const { errorHandler, notFound } = require("./middleware/errorHandler");

// ── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

const app = express();

// ── Security headers (helmet sets sane HTTP headers to prevent common attacks) ─
app.use(helmet({
  // Allow swagger UI to load its own CSS/JS
  contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
}));

// ── CORS — only allow requests from the configured frontend URL ───────────────
app.use(cors({
  origin:      process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true, // Required for cookies (refresh token) to be sent cross-origin
  methods:     ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
}));

// ── Request body parsing ──────────────────────────────────────────────────────
app.use(express.json());            // Parse application/json bodies
app.use(express.urlencoded({ extended: true })); // Parse form bodies
app.use(cookieParser());            // Parse cookies (needed to read the refresh token cookie)

// ── HTTP request logging ──────────────────────────────────────────────────────
// Use "dev" format in development (colourful), "combined" in production (Apache-style)
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ── Rate limiting on auth routes ──────────────────────────────────────────────
// Prevents brute-force attacks on login/signup endpoints.
// Configured via RATE_LIMIT_MAX in .env (default: 20 requests per 15 min per IP).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      parseInt(process.env.RATE_LIMIT_MAX) || 20,
  message:  { error: "Too many requests from this IP. Please try again in 15 minutes." },
  standardHeaders: true,  // Return rate limit info in RateLimit-* headers
  legacyHeaders:   false, // Disable the deprecated X-RateLimit-* headers
});

// ── Health check — used by load balancers / uptime monitors ──────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Swagger API documentation ─────────────────────────────────────────────────
// Available at: http://localhost:5000/api-docs
// In production you may want to gate this behind the `protect + requireRole("admin")` middleware
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "DC Loans API Docs",
    customCss: ".swagger-ui .topbar { background-color: #080F14; }",
    swaggerOptions: {
      persistAuthorization: true, // Keeps the Bearer token filled in between page refreshes
    },
  })
);

// Expose the raw OpenAPI JSON (useful for importing into Postman)
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth",  authLimiter, authRoutes);
app.use("/api/admin", adminRoutes);

// ── 404 handler — catches unknown routes ─────────────────────────────────────
app.use(notFound);

// ── Global error handler — catches all errors passed via next(err) ────────────
app.use(errorHandler);

// ── Start the server ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 DC Loans API running on port ${PORT}`);
  console.log(`📚 Swagger docs: http://localhost:${PORT}/api-docs`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = app; // Export for testing
