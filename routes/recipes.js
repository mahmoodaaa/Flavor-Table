// routes/recipes.js
const express = require('express');
const router = express.Router();
const pg = require('pg');
const axios = require('axios');
require('dotenv').config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/flavor_table',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  onConnect: (client) => {
    console.log('Database connection established');
  },
  onError: (error, client) => {
    console.error('Error in database connection:', error);
  }
});

const API_KEY = process.env.SPOONACULAR_API_KEY;
const BASE_URL = 'https://api.spoonacular.com/recipes';

if (!API_KEY) {
  console.error('Spoonacular API key is not set in environment variables');
  throw new Error('Spoonacular API key is required. Please set SPOONACULAR_API_KEY in your .env file.');
}

// CREATE new recipe
router.post('/', async (req, res) => {
  try {
    const { title, image, instructions, ingredients, readyIn } = req.body;

    // Validate required fields
    if (!title) throw new Error('Title is required');
    if (!instructions) throw new Error('Instructions are required');

    // Ingredients should be stored as a JSON array string for better flexibility
    let ingredientsString;
    if (Array.isArray(ingredients)) {
      ingredientsString = JSON.stringify(ingredients);
    } else if (typeof ingredients === 'string' && ingredients.trim()) {
      // Assume JSON string or comma-separated string
      try {
        // Try parse if JSON string
        JSON.parse(ingredients);
        ingredientsString = ingredients;
      } catch {
        // Otherwise convert to JSON array string by splitting commas
        ingredientsString = JSON.stringify(ingredients.split(',').map(i => i.trim()));
      }
    } else {
      ingredientsString = JSON.stringify([]);
    }

    // Insert into DB
    const result = await pool.query(
      'INSERT INTO recipes (title, image, instructions, ingredients, readyIn) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, image, instructions, ingredientsString, readyIn || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create recipe error:', err);
    res.status(500).json({
      error: 'Failed to create recipe',
      details: err.message
    });
  }
});

// READ all recipes
// GET all saved recipes
router.get('/all', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM recipes');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching saved recipes:', error);
        res.status(500).json({ error: 'Failed to fetch saved recipes' });
    }
});
// UPDATE recipe
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { title, image, instructions, ingredients, readyIn } = req.body;

    let ingredientsString;
    if (Array.isArray(ingredients)) {
      ingredientsString = JSON.stringify(ingredients);
    } else if (typeof ingredients === 'string' && ingredients.trim()) {
      try {
        JSON.parse(ingredients);
        ingredientsString = ingredients;
      } catch {
        ingredientsString = JSON.stringify(ingredients.split(',').map(i => i.trim()));
      }
    } else {
      ingredientsString = JSON.stringify([]);
    }

    const result = await pool.query(
      'UPDATE recipes SET title=$1, image=$2, instructions=$3, ingredients=$4, readyIn=$5 WHERE id=$6 RETURNING *',
      [title, image, instructions, ingredientsString, readyIn || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    const updatedRecipe = result.rows[0];
    updatedRecipe.ingredients = updatedRecipe.ingredients ? JSON.parse(updatedRecipe.ingredients) : [];

    res.json(updatedRecipe);
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Failed to update recipe', details: err.message });
  }
});

// DELETE recipe
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await pool.query('DELETE FROM recipes WHERE id=$1', [id]);
    res.status(204).end();
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
});

// RANDOM recipe from Spoonacular
router.get('/random', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/random`, {
      params: {
        number: 1,
        apiKey: API_KEY,
        tags: 'vegetarian'
      }
    });
    const recipe = response.data.recipes[0];
    res.json({ recipe });
  } catch (error) {
    console.error('Random error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      res.status(401).json({
        error: 'Invalid or missing Spoonacular API key',
        details: 'Please ensure you have a valid Spoonacular API key set in your environment variables.'
      });
    } else {
      res.status(500).json({ error: 'Failed to fetch random recipe', details: error.response?.data });
    }
  }
});

// Recipe DETAILS by ID
router.get('/details/:id', async (req, res) => {
  const recipeId = req.params.id;
  try {
    const response = await axios.get(`${BASE_URL}/${recipeId}/information`, {
      params: { apiKey: API_KEY }
    });

    function formatRecipe(recipe) {
      return {
        id: recipe.id,
        title: recipe.title,
        image: recipe.image,
        readyInMinutes: recipe.readyInMinutes || recipe.readyIn,
        instructions: recipe.instructions,
        ingredients: recipe.extendedIngredients?.map(i => i.original) || [],
        usedIngredients: recipe.usedIngredients?.map(i => i.original) || [],
        missedIngredients: recipe.missedIngredients?.map(i => i.original) || []
      };
    }

    const r = response.data;
    res.json(formatRecipe(r));
  } catch (error) {
    console.error('Details error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch recipe details' });
  }
});

// SEARCH recipes from Spoonacular
router.get('/search', async (req, res) => {
  const ingredients = req.query.ingredients;
  try {
    const response = await axios.get(`${BASE_URL}/complexSearch`, {
      params: {
        query: ingredients,
        number: 10,
        apiKey: API_KEY
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Search error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      res.status(401).json({
        error: 'Invalid or missing Spoonacular API key',
        details: 'Please ensure you have a valid Spoonacular API key set in your environment variables.'
      });
    } else {
      res.status(500).json({ error: 'Failed to search recipes', details: error.response?.data });
    }
  }
});

module.exports = router;