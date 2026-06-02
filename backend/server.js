const express = require('express');
const cors = require('cors');
const mergeRouter = require('./routes/merge');
const splitRouter = require('./routes/split');
const configRouter = require('./routes/config');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
}));

app.use(express.json());

app.use('/api', configRouter);
app.use('/api', mergeRouter);
app.use('/api', splitRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'PDF Merger API is running' });
});

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
