// server.js
const express = require('express');
const cors = require('cors');
const recipesRouter = require('./routes/recipes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const pg = require('pg');
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/api/recipes', recipesRouter);

// DB connection then start server
pool.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`App is listening on port .sssssssssss ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Could not connect to database', err);
  });