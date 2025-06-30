// routes/recipes.js
const express = require('express');
const router = express.Router();
const pg = require('pg');
const axios = require('axios');
require('dotenv').config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

const API_KEY = process.env.SPOONACULAR_API_KEY;
const BASE_URL = 'https://api.spoonacular.com/recipes';

// CREATE new recipe
router.post('/', async (req, res) => {
  const { title, image, instructions, ingredients, readyIn } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO recipes (title, image, instructions, ingredients, readyIn) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, image, instructions, ingredients, readyIn]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create error:', err.message);
    res.status(500).json({ error: 'Failed to create recipe' });
  }
});

// READ all recipes
router.get('/all', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM recipes');
    res.json(result.rows);
  } catch (err) {
    console.error('Read error:', err.message);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

// UPDATE recipe
router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const { title, image, instructions, ingredients, readyIn } = req.body;
  try {
    const result = await pool.query(
      'UPDATE recipes SET title=$1, image=$2, instructions=$3, ingredients=$4, readyIn=$5 WHERE id=$6 RETURNING *',
      [title, image, instructions, ingredients, readyIn, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update error:', err.message);
    res.status(500).json({ error: 'Failed to update recipe' });
  }
});

// DELETE recipe
router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await pool.query('DELETE FROM recipes WHERE id=$1', [id]);
    res.status(204).end();
  } catch (err) {
    console.error('Delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
});

// RANDOM recipe from Spoonacular
router.get('/random', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/random`, {
      params: { number: 1, apiKey: API_KEY }
    });
    const recipe = response.data.recipes[0];
    res.json({ recipe });
  } catch (error) {
    console.error('Random error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch random recipe' });
  }
});

// Recipe DETAILS by ID
router.get('/details/:id', async (req, res) => {
  const recipeId = req.params.id;
  try {
    const response = await axios.get(`${BASE_URL}/${recipeId}/information`, {
      params: { apiKey: API_KEY }
    });

    const r = response.data;
    res.json({
      id: r.id,
      title: r.title,
      image: r.image,
      readyInMinutes: r.readyInMinutes,
      instructions: r.instructions || 'No instructions found',
      ingredients: r.extendedIngredients.map(i => i.original)
    });
  } catch (error) {
    console.error('Details error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch recipe details' });
  }
});

// SEARCH recipes from Spoonacular
router.get('/search', async (req, res) => {
  const ingredients = req.query.ingredients;
  try {
    const response = await axios.get(`${BASE_URL}/findByIngredients`, {
      params: {
        ingredients,
        number: 10,
        apiKey: API_KEY
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Search error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to search recipes' });
  }
});

module.exports = router;