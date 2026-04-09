const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
    register,
    login,
    logout,
    getMe,
    generateToken
} = require("../controllers/AuthController");
const { setTokenCookie } = require("../utils/Cookie.helper");
const router = express.Router();
const axios = require("axios");
const User = require("../models/user");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const FRONTEND_URL = process.env.CLIENT_URL;

// Limit auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // max 10 requests per IP per window
    message: "Too many login attempts. Please try again later.",
});

// Apply only to login/register/google
router.use(
    [
        "/login",
        "/register",
        "/google",
        "/oauth2/redirect/google",
        "/github",
        "/github/callback",
    ],
    authLimiter,
);

// Step A (Authorization Request)
router.get("/google", (req, res) => {
    const state = crypto.randomBytes(32).toString("hex");

    // STORE STATE
    res.cookie("oauth_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });

    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: "code",
        scope: "profile email",
        state,
        prompt: "select_account",
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    res.redirect(url);
});

//  Step C → D
router.get("/oauth2/redirect/google", async (req, res) => {
    const { code, state } = req.query;
    const storedState = req.cookies.oauth_state;

    if (!state || state !== storedState) {
        return res.status(403).send("Invalid state");
    }
    res.clearCookie("oauth_state");

    try {
        // 1. Exchange code → token
        const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code,
            redirect_uri: REDIRECT_URI,
            grant_type: "authorization_code",
        });

        // Received From Google
        const access_token = tokenRes.data.access_token;

        // 2. Get user info
        const userRes = await axios.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            },
        );

        const googleUser = userRes.data;

        // 3. Check if user exists
        let user = await User.findOne({ email: googleUser.email });

        // create if not exists
        if (!user) {
            // 4. Create new User
            user = await User.create({
                name: googleUser.name,
                email: googleUser.email,
                role: "user",
                providers: {
                    google: { id: googleUser.id }
                }
            });
        } else {
            //  LINK GOOGLE ACCOUNT
            if (!user.providers?.google?.id) {
                // Safe Nested Updates
                user.set("providers.google.id", googleUser.id);
                await user.save();
            }
        }

        // 5. Generate JWT
        const token = generateToken(user);

        // 6. Set cookie
        setTokenCookie(res, token);

        // 7. Redirect to frontend
        res.redirect(`${FRONTEND_URL}/projects`);
    } catch (err) {
        console.log("Google auth callback error: ", err);
        res.redirect(FRONTEND_URL);
    }
});


router.get('/github', (req, res) => {
    const state = crypto.randomBytes(32).toString("hex");

    res.cookie("oauth_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });

    const params = new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID,
        scope: "user:email",
        state
    });

    const url = `https://github.com/login/oauth/authorize?${params.toString()}`;

    res.redirect(url);
});


router.get('/github/callback', async (req, res) => {
    const { code, state } = req.query;
    const storedState = req.cookies.oauth_state;

    if (!state || state !== storedState) {
        return res.status(403).send("Invalid state");
    }
    res.clearCookie("oauth_state");

    try {
        // 1. Exchange code → access_token
        const tokenRes = await axios.post("https://github.com/login/oauth/access_token",
            {
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code
            },
            {
                headers: {
                    Accept: "application/json"
                }
            }
        );

        const access_token = tokenRes.data.access_token;

        // 2. Get user profile
        const userRes = await axios.get(
            "https://api.github.com/user",
            {
                headers: {
                    Authorization: `Bearer ${access_token}`
                }
            }
        )

        // 3. Get email (IMPORTANT — GitHub may not return email in profile)
        const emailRes = await axios.get(
            "https://api.github.com/user/emails",
            {
                headers: {
                    Authorization: `Bearer ${access_token}`
                }
            }
        );

        const primaryEmail =
            emailRes.data.find((email) => email.primary && email.verified)?.email ||
            emailRes.data.find((email) => email.verified)?.email;

        if (!primaryEmail) {
            return res.redirect(`${FRONTEND_URL}/login?error=github-email-required`);
        }

        const githubUser = {
            name: userRes.data.name || userRes.data.login,
            email: primaryEmail
        };

        // 4. Check user
        let user = await User.findOne({ email: githubUser.email })

        // 5. Create user if not exists
        if (!user) {
            user = await User.create({
                name: githubUser.name,
                email: githubUser.email,
                role: "user",
                providers: {
                    github: { id: userRes.data.id }
                }
            })
        } else {
            if (!user.providers.github?.id) {
                user.set("providers.github.id", userRes.data.id);
                await user.save();
            }
        }

        // 6. Generate token
        const token = generateToken(user);

        // 7. Set cookie
        setTokenCookie(res, token);

        // 8. Redirect
        res.redirect(`${FRONTEND_URL}/projects`);

    } catch (err) {
        console.log("GitHub auth error:", err);
        res.redirect(FRONTEND_URL);
    }
})


router.post("/register", register);
router.post("/login", login);
router.post("/logout", protect, logout);

router.get("/me", protect, getMe);

module.exports = router;
