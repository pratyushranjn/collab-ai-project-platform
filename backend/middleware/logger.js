const morgan = require("morgan");
const Log = require("../models/Log");

function normalizeIp(ip) {
  if (!ip) return null;

  if (ip === "::1") return "127.0.0.1";              // Localhost IPv6
  if (ip.startsWith("::ffff:")) return ip.slice(7); // IPv6-mapped IPv4
  return ip;
}


// Custom Morgan middleware: only log to DB in production, otherwise do nothing
const morganMiddleware = (process.env.NODE_ENV === "production")
  ? morgan(function (tokens, req, res) {
      const logEntry = {
        method: tokens.method(req, res),
        url: tokens.url(req, res),
        status: Number(tokens.status(req, res)),
        responseTime: Number(tokens["response-time"](req, res)),
        ip: normalizeIp(req.ip || req.socket.remoteAddress),
        userAgent: req.get("User-Agent"),
        userId: req.user ? req.user.id : null,
        userEmail: req.user ? req.user.email : null,
        role: req.user ? req.user.role : null,
      };
      Log.create(logEntry).catch((err) => {
        console.error("Log save error:", err.message);
      });
      return null; // Morgan expects a string, return null to suppress output
    })
  : (req, res, next) => next();

module.exports = morganMiddleware;
