const express = require('express');
const cors = require('cors');
const mergeRouter = require('./routes/merge');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
}));

app.use(express.json());

app.use('/api', mergeRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'PDF Merger API is running' });
});

app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 PDF Merger API running on http://localhost:${PORT}`);
  });
}

module.exports = app;
