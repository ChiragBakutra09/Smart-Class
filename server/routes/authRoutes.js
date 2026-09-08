const express = require("express");
const router = express.Router();
const { register, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", register);
router.get("/me", protect, getMe);

module.exports = router;
