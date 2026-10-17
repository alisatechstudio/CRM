require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Determine if MongoDB connection is configured (e.g. Vercel deployment or local MONGODB_URI)
const hasMongo = Boolean(process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL);

if (hasMongo) {
  const { connectToMongo } = require('./mongoConnection');
  const mongoRoutes = require('./mongoRoutes');

  // Middleware to ensure MongoDB connection in serverless / regular execution
  app.use('/api', async (req, res, next) => {
    try {
      await connectToMongo();
      next();
    } catch (err) {
      console.error('MongoDB connection error:', err);
      res.status(500).json({ error: 'Database connection failed', details: err.message });
    }
  }, mongoRoutes);
} else {
  // Offline / local SQLite fallback
  const routes = require('./routes');
  app.use('/api', routes);
}

// Serve client build if available
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

// Fallback for SPA
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('মিজান স্টেশনারি (Mijan Stationary) CRM API is active on port ' + PORT);
    }
  });
});

// In serverless environments (like Vercel), the platform handles requests via api/index.js.
// In traditional Node environments, listen on PORT.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`মিজান স্টেশনারি CRM Server running at http://localhost:${PORT} (${hasMongo ? 'MongoDB' : 'SQLite'})`);
  });
}

module.exports = app;
