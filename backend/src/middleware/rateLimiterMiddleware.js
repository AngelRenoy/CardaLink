const { sendError } = require('../utils/responseHandler');

const requestCounts = new Map();
const WINDOW_MS = 15 * 60 * 1000; // 15 minute window
const MAX_REQUESTS = 100; // Max 100 authentication requests per window per IP

// Clean up stale IP records every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of requestCounts.entries()) {
    if (now - record.startTime > WINDOW_MS) {
      requestCounts.delete(ip);
    }
  }
}, 30 * 60 * 1000);

const authRateLimiter = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
  const now = Date.now();

  let record = requestCounts.get(ip);
  if (!record || now - record.startTime > WINDOW_MS) {
    record = { count: 1, startTime: now };
    requestCounts.set(ip, record);
    return next();
  }

  record.count += 1;
  if (record.count > MAX_REQUESTS) {
    return sendError(res, 429, 'Too many authentication attempts. Please try again later.');
  }

  next();
};

module.exports = { authRateLimiter };
