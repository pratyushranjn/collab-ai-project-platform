const express = require('express');
const router = express.Router();
const crypto = require("crypto");
const User = require('../models/user');
const { forgetPassword, resetPassword } = require('../controllers/forgot-password');
const rateLimit = require("express-rate-limit");

const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many password reset requests. Try again later.",
});

router.get("/password/validate/:token", async (req, res) => {
    try {
        const { token } = req.params;
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() }
        });
        if (!user) {
            return res.status(400).json({ valid: false, message: "Invalid or expired token" });
        }
        return res.json({ valid: true });
    } catch (err) {
        return res.status(500).json({ valid: false, message: "Server error" });
    }
});

router.post("/forgot-password", forgotPasswordLimiter, forgetPassword);

router.patch('/password/reset/:token', resetPassword);

module.exports = router;