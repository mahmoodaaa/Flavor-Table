// ✅ app.js (Updated)
const API_BASE_URL = '/api/recipes';

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const recipesContainer = document.getElementById('recipes-container');
const randomBtn = document.getElementById('random-btn');
const randomRecipeContainer = document.getElementById('random-recipe');
const recipeModal = document.getElementById('recipe-modal');
const modalContent = document.getElementById('modal-content');
const favoritesContainer = document.querySelector('.favorites-container');

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <p>${message}</p>
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
        ingredients: recipe.extendedIngredients?.map(i => i.name) || [],
        usedIngredients: recipe.usedIngredients?.map(i => i.name) || [],
        missedIngredients: recipe.missedIngredients?.map(i => i.name) || []
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
            </div>
        </div>
    `;
    updateRecipeCardButtons(recipe.id);
    return card.outerHTML;
}

function updateRecipeCardButtons(recipeId) {
    document.querySelectorAll(`.recipe-card[data-id='${recipeId}']`).forEach(card => {
        const saveBtn = card.querySelector('.save-btn');
        const removeBtn = card.querySelector('.remove-btn');
        const isFavorite = isInFavorites(recipeId);
        if (saveBtn && removeBtn) {
            saveBtn.style.display = isFavorite ? 'none' : 'inline-block';
            removeBtn.style.display = isFavorite ? 'inline-block' : 'none';
        }
    });
}

function isInFavorites(id) {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    return favorites.some(f => f.id === id);
}

function saveRecipe(recipe) {
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (!favorites.find(f => f.id === recipe.id)) {
        favorites.push(recipe);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        showError('Saved to favorites!');
        updateFavoritesList();
    } else {
        showError('Already in favorites!');
    }
    updateRecipeCardButtons(recipe.id);
}

function removeFromFavorites(id) {
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    favorites = favorites.filter(f => f.id !== id);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoritesList();
    updateRecipeCardButtons(id);
    showError('Removed from favorites');
}

function updateFavoritesList() {
    if (!favoritesContainer) return;
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (favorites.length === 0) {
        favoritesContainer.innerHTML = '<p>No favorites yet</p>';
    } else {
        favoritesContainer.innerHTML = favorites.map(createRecipeCard).join('');
    }
}

async function searchRecipes(ingredients) {
    if (!ingredients.trim()) return showError('Enter ingredients');
    showLoadingState(recipesContainer);
    const response = await fetch(`${API_BASE_URL}/search?ingredients=${encodeURIComponent(ingredients)}`);
    const data = await response.json();
    if (response.ok) {
        if (!data.recipes.length) {
            recipesContainer.innerHTML = '<p>No recipes found</p>';
        } else {
            recipesContainer.innerHTML = data.recipes.map(formatRecipe).map(createRecipeCard).join('');
        }
    } else {
        showError(data.error || 'Search failed');
    }
}

async function getRandomRecipe() {
    showLoadingState(randomRecipeContainer);
    const res = await fetch(`${API_BASE_URL}/random`);
    const data = await res.json();
    if (res.ok) {
        const recipe = formatRecipe(data.recipe);
        randomRecipeContainer.innerHTML = createRecipeCard(recipe);
    } else {
        showError(data.error || 'Failed to fetch');
    }
}

async function openRecipeDetails(id) {
    showLoadingState(modalContent);
    const res = await fetch(`${API_BASE_URL}/details/${id}`);
    const data = await res.json();
    if (res.ok) {
        modalContent.innerHTML = `
            <h2>${data.title}</h2>
            <img src="${data.image}" alt="${data.title}" />
            <h3>Ingredients:</h3>
            <ul>${data.ingredients.map(i => `<li>${i}</li>`).join('')}</ul>
            <h3>Instructions:</h3>
            <p>${data.instructions}</p>
        `;
        recipeModal.style.display = 'block';
    } else {
        showError(data.error || 'Details failed');
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
    const closeModal = document.querySelector('.close-modal');
    if (closeModal) {
        closeModal.addEventListener('click', () => recipeModal.style.display = 'none');
    }
    window.addEventListener('click', e => {
        if (e.target === recipeModal) recipeModal.style.display = 'none';
    });
});
