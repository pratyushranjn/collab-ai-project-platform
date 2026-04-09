const isProd = process.env.NODE_ENV === "production";
const COOKIE_NAME = "token";

const baseCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  path: "/",
};

const setTokenCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, {
    ...baseCookieOptions,
    maxAge: 24 * 60 * 60 * 1000,
  });
};

const clearTokenCookie = (res) => {
  res.clearCookie(COOKIE_NAME, baseCookieOptions);
};

const clearOAuthStateCookie = (res) => {
  res.clearCookie("oauth_state", baseCookieOptions);
};

const sendTokenResponse = (res, user, statusCode = 200, message = "") => {
  const token = generateToken(user);
  setTokenCookie(res, token);

  return res.status(statusCode).json({
    success: true,
    message,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

module.exports = {
  setTokenCookie,
  clearTokenCookie,
  clearOAuthStateCookie,
  sendTokenResponse,
};