const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./src/utils/logger');
const { connectDB, connectRedis } = require('./src/config/database');
const trackingRoutes = require('./src/routes/tracking');
const analyticsRoutes = require('./src/routes/analytics');
const campaignRoutes = require('./src/routes/campaigns');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
  message: { error: 'Too many requests' }
});
app.use(limiter);

// Routes
app.use('/', trackingRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/campaigns', campaignRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', time: new Date().toISOString() });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();

    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (err) {
    logger.error('Startup error:', err);
    process.exit(1);
  }
};

startServer();
