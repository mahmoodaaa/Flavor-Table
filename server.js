
// server.js
const express = require('express');
const app = express();
const path = require('path');

const recipesRoutes = require('./routes/recipes');
const authRoutes = require('./routes/auth');

require('dotenv').config();

app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ✅ Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Redirect / to login.html

// ✅ API routes
app.use('/api/recipes', recipesRoutes);
app.use('/api/auth', authRoutes);

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`App is listening on port ${PORT}`);
});
