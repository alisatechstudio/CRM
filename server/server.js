require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectToMongo } = require('./mongoConnection');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Ensure MongoDB is connected before handling API requests
app.use('/api', async (req, res, next) => {
  try {
    const conn = await connectToMongo();
    if (!conn) {
      return res.status(500).json({ 
        error: 'MongoDB connection string not found. Please verify that MONGODB_URI is available in Vercel environment variables.'
      });
    }
    next();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    res.status(500).json({ 
      error: 'MongoDB connection failed. Please verify your MongoDB credentials and network access.', 
      details: err.message 
    });
  }
}, routes);

// Serve client build if available
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

// Fallback for SPA routing
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('মিজান স্টেশনারি (Mijan Stationary) CRM API is active on port ' + PORT);
    }
  });
});

// In serverless environments (like Vercel), requests are handled by api/index.js.
// In traditional Node environments, listen on PORT.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`মিজান স্টেশনারি CRM Server running at http://localhost:${PORT} with MongoDB`);
  });
}

module.exports = app;
