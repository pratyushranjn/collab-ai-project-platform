const Log = require("../models/Log");

function normalizeIp(ip) {
  if (!ip) return null;

  if (ip === "::1") return "127.0.0.1";
  if (ip.startsWith("::ffff:")) return ip.slice(7);

  return ip;
}

const loggerMiddleware =
  process.env.NODE_ENV === "production"
    ? (req, res, next) => {
        const start = Date.now();

        res.on("finish", async () => {
          try {
            await Log.create({
              method: req.method,
              url: req.originalUrl,
              status: res.statusCode,
              responseTime: Date.now() - start,
              ip: normalizeIp(req.ip || req.socket.remoteAddress),
              userAgent: req.get("User-Agent"),
              userId: req.user?.id || null,
              userEmail: req.user?.email || null,
              role: req.user?.role || null,
            });
          } catch (err) {
            console.error("Log save error:", err.message);
          }
        });

        next();
      }
    : (req, res, next) => next();

module.exports = loggerMiddleware;