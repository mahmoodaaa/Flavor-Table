
// server.js
// server.js
const express = require('express');
const app = express();
const path = require('path');

const recipesRoutes = require('./routes/recipes');
const authRoutes = require('./routes/auth');

// Load environment variables (if using .env)
require('dotenv').config();

// ✅ Middleware
app.use(express.json()); // Parse JSON request bodies

// ✅ Serve frontend static files from /public folder
app.use(express.static(path.join(__dirname, 'public')));

// ✅ API routes (make sure this is AFTER express.json and static)
app.use('/api/recipes', recipesRoutes);
app.use('/api/auth', authRoutes);

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`App is listening on port ${PORT}`);
});