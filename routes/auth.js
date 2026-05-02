const express = require("express");
const router  = express.Router();

const {
  usSignup, saSignup,
  usLogin,  saLogin,
  refreshToken,
  logout,
  getMe,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

router.post("/us/signup", usSignup);
router.post("/us/login",  usLogin);
router.post("/sa/signup", saSignup);
router.post("/sa/login",  saLogin);

router.post("/refresh", refreshToken);
router.post("/logout",  logout);
router.get("/me",       protect, getMe);

module.exports = router;
