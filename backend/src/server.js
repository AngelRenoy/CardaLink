const express = require('express');
const cors = require('cors');
require('dotenv').config();


const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const farmerRoutes = require('./routes/farmerRoutes');
const traderRoutes = require('./routes/traderRoutes');
const { authRateLimiter } = require('./middleware/rateLimiterMiddleware');
const { sendError } = require('./utils/responseHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Basic Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5173',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logging in Development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[CardaLink API] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// Health Check Route
app.get('/api/health', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({
      status: 'UP',
      system: 'CardaLink API',
      timestamp: result.rows[0].now,
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    res.status(500).json({ status: 'DOWN', error: error.message });
  }
});

// Protected & Public IAM API Routes
app.use('/api/auth', authRateLimiter, authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/farmer', farmerRoutes);
app.use('/api/trader', traderRoutes);


// 404 Handler
app.use((req, res) => {
  sendError(res, 404, `Route ${req.originalUrl} not found`);
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Global Server Error:', err);
  sendError(res, 500, 'Internal server error occurred');
});

// Start Server
app.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`CardaLink Backend API Server running on port ${PORT}`);
  console.log(`Allowed Origins: ${allowedOrigins.join(', ')}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`====================================================`);
});
