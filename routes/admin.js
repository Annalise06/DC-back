const express = require("express");
const router  = express.Router();

const { adminLogin }                                      = require("../controllers/authController");
const {
  listUSUsers, listSAUsers, getUser, updateUser, deleteUser,
  listLoans, approveLoan, rejectLoan, completeLoan,
} = require("../controllers/adminController");
const { getAdminSettings, updateSettings } = require("../controllers/settingsController");
const { protect, requireRole } = require("../middleware/auth");

// Admin auth (no token needed)
router.post("/auth/login", adminLogin);

// All routes below require a valid admin token
router.use(protect, requireRole("admin"));

router.get("/users/us",              listUSUsers);
router.get("/users/sa",              listSAUsers);
router.get("/users/:country/:id",    getUser);
router.patch("/users/:country/:id",  updateUser);
router.delete("/users/:country/:id", deleteUser);

router.get("/loans",                 listLoans);
router.patch("/loans/:id/approve",   approveLoan);
router.patch("/loans/:id/reject",    rejectLoan);
router.patch("/loans/:id/complete",  completeLoan);

router.get("/settings",              getAdminSettings);
router.patch("/settings",            updateSettings);

module.exports = router;
