// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');


const app = express();

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Routes
/*
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/randomRecipes.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'randomRecipes.html'));
});

app.get('/favorites.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'favorites.html'));
});
*/
// API Routes
const homeRouter = require('./routes/home');
const recipesRouter = require('./routes/recipes');

app.use('/', homeRouter);
app.use('/api/recipes', recipesRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!'
    });
});

// Handle 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.listen(process.env.PORT, () => {
    console.log(`Flavor-Table server listening on port.SDSDSDSD ${process.env.PORT},${process.env.APIKEY} `);
});