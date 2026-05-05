const express = require("express");
const router  = express.Router();

const { applyForLoan }     = require("../controllers/loanController");
const { protect }          = require("../middleware/auth");
const { upload } = require("../config/cloudinary");

router.use(protect);

router.post("/apply", upload.array("documents", 5), applyForLoan);

module.exports = router;
