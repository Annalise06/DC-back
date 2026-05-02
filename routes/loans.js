const express = require("express");
const router  = express.Router();

const { applyForLoan }     = require("../controllers/loanController");
const { protect }          = require("../middleware/auth");

router.use(protect);

router.post("/apply", applyForLoan);

module.exports = router;
