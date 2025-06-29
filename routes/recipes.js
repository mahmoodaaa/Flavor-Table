// routes/recipes.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

const API_KEY = process.env.APIKEY;
const BASE_URL = 'https://api.spoonacular.com/recipes';

// Search by ingredients
router.get('/search', async (req, res) => {
    const ingredients = req.query.ingredients;

    if (!ingredients) {
        return res.status(400).json({ error: 'Missing ingredients' });
    }

    try {
        const response = await axios.get(`${BASE_URL}/findByIngredients`, {
            params: {
                ingredients,
                number: 10,
                apiKey: API_KEY
            }
        });

        const formatted = response.data.map(r => ({
            id: r.id,
            title: r.title,
            image: r.image,
            readyInMinutes: r.readyInMinutes || 30,
            usedIngredients: r.usedIngredients?.map(i => i.name),
            missedIngredients: r.missedIngredients?.map(i => i.name)
        }));

        res.json({ recipes: formatted });
    } catch (error) {
        console.error('Search error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch recipes' });
    }
});

// Random recipe
router.get('/random', async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/random`, {
            params: {
                number: 1,
                apiKey: API_KEY
            }
        });

        const recipe = response.data.recipes[0];

        res.json({ recipe });
    } catch (error) {
        console.error('Random error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch random recipe' });
    }
});

// Recipe details
router.get('/details/:id', async (req, res) => {
    const recipeId = req.params.id;

    try {
        const response = await axios.get(`${BASE_URL}/${recipeId}/information`, {
            params: {
                apiKey: API_KEY
            }
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

module.exports = router;