const express = require('express');
const cors = require('cors');
const mergeRouter = require('./routes/merge');
const splitRouter = require('./routes/split');
const configRouter = require('./routes/config');
const { getCorsOptions } = require('./config/cors');
const { apiRateLimiter, heavyRateLimiter } = require('./middleware/rateLimit');
const { heavyRequestTimeout, haltOnTimedout } = require('./middleware/requestTimeout');
const { heavyConcurrency } = require('./middleware/heavyConcurrency');

const app = express();
const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

const corsOptions = getCorsOptions();
if (corsOptions) {
  app.use(cors(corsOptions));
}

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'PDF Merger API is running' });
});

const heavyPipeline = [
  heavyRateLimiter,
  heavyRequestTimeout,
  haltOnTimedout,
  heavyConcurrency,
];

app.use('/api', apiRateLimiter);
app.use('/api/merge-pdf', heavyPipeline);
app.use('/api/split-pdf', heavyPipeline);
app.use('/api/preview-pdf', heavyPipeline);

app.use('/api', configRouter);
app.use('/api', mergeRouter);
app.use('/api', splitRouter);

app.use(async (err, req, res, _next) => {
  console.error(err.stack);
  const { sendError } = require('./lib/sendError');
  await sendError(res, 500, err.message || 'Internal server error');
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 PDF Merger API running on http://localhost:${PORT}`);
  });
}

module.exports = app;
