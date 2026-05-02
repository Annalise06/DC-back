const express = require("express");
const router  = express.Router();

const { getTransactions } = require("../controllers/transactionController");
const { protect }         = require("../middleware/auth");

router.use(protect);

router.get("/", getTransactions);

module.exports = router;
