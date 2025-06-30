// ✅ app.js (Updated based on latest recipes.js and HTML pages)
const API_BASE_URL = '/api/recipes';
const axios = require('axios');

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const recipesContainer = document.getElementById('recipes-container');
const randomBtn = document.getElementById('random-btn');
const randomRecipeContainer = document.getElementById('random-recipe');
const recipeModal = document.getElementById('recipe-modal');
const modalContent = document.getElementById('modal-content');
const favoritesContainer = document.querySelector('.favorites-container');

async function showError(message, error = null) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <p>${message}</p>
        ${error ? `<p class="error-details">${error.message}</p>` : ''}
        <button>Dismiss</button>
    `;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
    errorDiv.querySelector('button').addEventListener('click', () => errorDiv.remove());
}

function showLoadingState(container) {
    container.innerHTML = `<div class="loading"><div class="spinner"></div><p>Loading...</p></div>`;
}

function formatRecipe(recipe) {
    return {
        id: recipe.id,
        title: recipe.title,
        image: recipe.image,
        readyInMinutes: recipe.readyInMinutes,
        instructions: recipe.instructions,
        ingredients: recipe.extendedIngredients?.map(i => i.original) || [],
        usedIngredients: recipe.usedIngredients?.map(i => i.original) || [],
        missedIngredients: recipe.missedIngredients?.map(i => i.original) || []
    };
}

function createRecipeCard(recipe) {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    card.setAttribute('data-id', recipe.id);
    card.innerHTML = `
        <img src="${recipe.image || 'https://via.placeholder.com/300x200?text=No+Image'}" alt="${recipe.title}" class="recipe-image">
        <div class="recipe-info">
            <h3>${recipe.title}</h3>
            <p>Ready in ${recipe.readyInMinutes || 30} minutes</p>
            <div class="recipe-actions">
                <button class="view-btn" onclick="openRecipeDetails(${recipe.id})">View Details</button>
                <button class="save-btn" onclick='saveRecipe(${JSON.stringify(recipe)})'>Save</button>
                <button class="remove-btn" onclick='removeFromFavorites(${recipe.id})' style='display: none;'>Remove</button>
                <button class="edit-btn" onclick='openEditForm(${recipe.id})' style='display: none;'>Edit</button>
            </div>
        </div>
    `;
    updateRecipeCardButtons(recipe.id);
    return card.outerHTML;
}

async function updateRecipeCardButtons(recipeId) {
    const isFavorite = await isInFavorites(recipeId);
    document.querySelectorAll(`.recipe-card[data-id='${recipeId}']`).forEach(card => {
        const saveBtn = card.querySelector('.save-btn');
        const removeBtn = card.querySelector('.remove-btn');
        const editBtn = card.querySelector('.edit-btn');

        if (saveBtn && removeBtn && editBtn) {
            saveBtn.style.display = isFavorite ? 'none' : 'inline-block';
            removeBtn.style.display = isFavorite ? 'inline-block' : 'none';
            editBtn.style.display = isFavorite ? 'inline-block' : 'none';
        }
    });
}

async function isInFavorites(id) {
    try {
        const response = await axios.get(`${API_BASE_URL}/all`);
        return response.data.some(recipe => recipe.id === id);
    } catch (error) {
        showError('Error checking favorites', error);
        return false;
    }
}

async function saveRecipe(recipe) {
    try {
        showLoadingState(favoritesContainer);
        const response = await axios.post(API_BASE_URL, {
            id: recipe.id,
            title: recipe.title,
            image: recipe.image,
            instructions: recipe.instructions,
            ingredients: recipe.ingredients,
            readyIn: recipe.readyInMinutes
        });

        updateFavoritesList();
        showError('Saved to favorites!');
    } catch (error) {
        showError('Failed to save recipe', error);
    }
}

async function removeFromFavorites(id) {
    try {
        showLoadingState(favoritesContainer);
        await axios.delete(`${API_BASE_URL}/${id}`);
        updateFavoritesList();
        showError('Removed from favorites');
    } catch (error) {
        showError('Failed to remove recipe', error);
    }
}

// ✨ Editing functionality...
// ... [same as previous logic for openEditForm, createEditModal, populateEditForm, handleEditSubmit, addIngredient, removeIngredient, closeModal] ...

async function updateFavoritesList() {
    if (!favoritesContainer) return;
    try {
        showLoadingState(favoritesContainer);
        const response = await axios.get(`${API_BASE_URL}/all`);
        const recipes = response.data;

        favoritesContainer.innerHTML = `
            <h1>My Favorites</h1>
            <div id="favorites-list">${recipes.map(createRecipeCard).join('')}</div>
        `;
    } catch (error) {
        showError('Failed to load favorites', error);
    }
}

async function searchRecipes(ingredients) {
    if (!ingredients.trim()) return showError('Enter ingredients');
    showLoadingState(recipesContainer);
    try {
        const response = await axios.get(`${API_BASE_URL}/search`, {
            params: { ingredients }
        });
        const recipes = response.data.recipes.map(formatRecipe);
        recipesContainer.innerHTML = recipes.map(createRecipeCard).join('');
    } catch (error) {
        showError('Search failed', error);
    }
}

async function getRandomRecipe() {
    showLoadingState(randomRecipeContainer);
    try {
        const response = await axios.get(`${API_BASE_URL}/random`);
        const recipe = formatRecipe(response.data.recipe);
        randomRecipeContainer.innerHTML = createRecipeCard(recipe);
    } catch (error) {
        showError('Failed to fetch random recipe', error);
    }
}

async function openRecipeDetails(id) {
    showLoadingState(modalContent);
    try {
        const response = await axios.get(`${API_BASE_URL}/details/${id}`);
        const data = response.data;
        modalContent.innerHTML = `
            <h2>${data.title}</h2>
            <img src="${data.image}" alt="${data.title}" />
            <h3>Ingredients:</h3>
            <ul>${data.ingredients.map(i => `<li>${i}</li>`).join('')}</ul>
            <h3>Instructions:</h3>
            <p>${data.instructions}</p>
        `;
        recipeModal.style.display = 'block';
    } catch (error) {
        showError('Failed to load recipe details', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateFavoritesList();
    if (searchForm) {
        searchForm.addEventListener('submit', e => {
            e.preventDefault();
            searchRecipes(searchInput.value);
        });
    }
    if (randomBtn) randomBtn.addEventListener('click', getRandomRecipe);
    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => recipeModal.style.display = 'none');
    }
    window.addEventListener('click', e => {
        if (e.target === recipeModal) recipeModal.style.display = 'none';
    });
});