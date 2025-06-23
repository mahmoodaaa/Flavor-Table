const express = require('express');
const axios = require('axios');
const router = express.Router();
require('dotenv').config();

// Helper to format recipe data
const formatRecipe = (recipe) => ({
    id: recipe.id,
    title: recipe.title,
    image: recipe.image,
    usedIngredients: recipe.usedIngredients?.map(ing => ing.name) || [],
    missedIngredients: recipe.missedIngredients?.map(ing => ing.name) || [],
    likes: recipe.likes || 0,
    readyInMinutes: recipe.readyInMinutes || 30,
    sourceUrl: recipe.sourceUrl
});

// Error handler
const handleApiError = (error, res) => {
    console.error('API Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch recipes. Please try again later.' });
};

// Search by ingredients
router.get('/search', async (req, res) => {
    try {
        
        const ingredients = req.query.ingredients;
        console.log(ingredients);
        if (!ingredients || ingredients.trim() === '') {
            return res.status(400).json({ error: 'Ingredients query is required' });
        }

        const response = await axios.get('https://api.spoonacular.com/recipes/findByIngredients', {
            params: {
                ingredients,
                number: 10,
                apiKey: process.env.APIKEY
            }
        });

        const recipes = response.data.map(formatRecipe);
        if (recipes.length === 0) {
            return res.status(404).json({ error: 'No recipes found' });
        }

        res.json({ recipes });
    } catch (error) {
        handleApiError(error, res);
    }
});

// Get recipe by ID
router.get('/recipes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const response = await axios.get(`https://api.spoonacular.com/recipes/${id}/information`, {
            params: { apiKey: process.env.APIKEY }
        });

        const recipe = formatRecipe(response.data);
        res.json(recipe);
    } catch (error) {
        handleApiError(error, res);
    }
});

// Get random recipe
router.get('/random', async (req, res) => {
    try {
        console.log(process.env.APIKEY);
        if (!process.env.APIKEY) {
            return res.status(500).json({ error: 'API key not configured' });
        }

        const response = await axios.get('https://api.spoonacular.com/recipes/random', {
            params: {
                number: 1,
                apiKey: process.env.APIKEY
            },
            timeout: 5000
        });

        if (!response.data.recipes || response.data.recipes.length === 0) {
            return res.status(404).json({ error: 'No recipes found' });
        }

        const recipe = formatRecipe(response.data.recipes[0]);
        res.json({ recipe });
    } catch (error) {
        console.error('Error fetching random recipe:', error);
        if (error.response) {
            console.error('API Response:', error.response.data);
            return res.status(error.response.status).json({ 
                error: error.response.data?.error || 'Failed to fetch recipe' 
            });
        }
        return res.status(500).json({ error: 'Failed to fetch recipe. Please try again later.' });
    }
});

module.exports = router;