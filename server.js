const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const scoreRoutes = require('./routes/scoreRoutes');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// (Other middlewares, CORS, bodyParser etc.)

const levelRoutes = require('./routes/levelRoutes');
app.use('/api/levels', levelRoutes);

// (Other existing routes)

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('Memory Maze API is running 🚀');
});

// ✅ Register your routes here
app.use('/api/scores', scoreRoutes);

// ❌ Then your 404 middleware
app.use((req, res, next) => {
  res.status(404).json({ message: '🔍 Route Not Found' });
});

// ✅ Then your global error handler
app.use(errorHandler);

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❗ Missing MONGO_URI in .env');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
  });

