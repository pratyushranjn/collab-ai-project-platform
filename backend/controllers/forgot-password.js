const User = require("../models/user");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");


const forgetPassword = async (req, res) => {
    try {
        if (!req.body.email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        const email = req.body.email.toLowerCase().trim();
        const user = await User.findOne({ email });

        // Prevent email enumeration
        if (!user) {
            return res.status(200).json({ message: "If email exists, link sent" });
        }

        // Block social login users
        if (!user.password) {
            return res.status(400).json({
                message: "Password reset not allowed for social login users"
            });
        }

        // Generate token
        const resetToken = user.getResetPasswordToken();
        await user.save();

        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

        const message = `
        <h3>Password Reset Request</h3>
        <p>Hello ${user.name},</p>
        <p>You requested a password reset. Click the link below:</p>
        <a href="${resetUrl}" target="_blank">${resetUrl}</a>
        <p>This link will expire in 10 minutes.</p>
    `;

        // Handle email failure separately
        try {
            await sendEmail({
                to: user.email,
                subject: "Password Reset Request",
                html: message,
            });
        } catch (err) {
            // Rollback token if email fails
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();

            return res.status(500).json({
                message: "Email could not be sent"
            });
        }

        return res.status(200).json({ message: "If email exists, link sent" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};


const resetPassword = async (req, res) => {
    try {
        const { token: resetToken } = req.params;
        
        const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired token"
            });
        }

        let { password, confirmPassword } = req.body;

        // Validation
        if (!password || !confirmPassword) {
            return res.status(400).json({
                message: "Password and confirm password are required"
            });
        }

        password = password.trim();
        confirmPassword = confirmPassword.trim();

        if (password !== confirmPassword) {
            return res.status(400).json({
                message: "Passwords do not match"
            });
        }

        const strongPassword = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

        if (!strongPassword.test(password)) {
            return res.status(400).json({
                message: "Password must contain at least 6 characters, including letters and numbers"
            });
        }


        // Update password and remove reset token (one-time use)
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        return res.status(200).json({
            message: "Password reset successful"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    forgetPassword,
    resetPassword
};
