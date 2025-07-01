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
            <p>Ready in ${recipe.readyInMinutes || recipe.readyIn || 30} minutes</p>
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
        const response = await fetch(`${API_BASE_URL}/all`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        return data.some(recipe => recipe.id === id);
    } catch (error) {
        showError('Error checking favorites', error);
        return false;
    }
}


async function saveRecipe(recipe) {
    try {
        if (favoritesContainer) showLoadingState(favoritesContainer);

        const payload = {
            id: recipe.id,
            title: recipe.title || 'Untitled Recipe',
            image: recipe.image || '',
            instructions: recipe.instructions || 'No instructions provided.',
            ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
            readyIn: recipe.readyInMinutes || recipe.readyIn || 30
        };

        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => {});
            throw new Error(errorData?.error || 'Failed to save recipe');
        }

        if (favoritesContainer) await updateFavoritesList();
        showError('Recipe saved to favorites!');
    } catch (error) {
        console.error('saveRecipe error:', error);
        showError('Failed to save recipe', error);
    }
}


async function removeFromFavorites(id) {
    try {
        if (favoritesContainer) {
            showLoadingState(favoritesContainer);
        }
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => {});
            throw new Error(errorData?.error || 'Failed to remove recipe');
        }
        if (favoritesContainer) {
            await updateFavoritesList();
        }
        showError('Recipe removed from favorites');
    } catch (error) {
        showError('Failed to remove recipe', error);
    }
}

// ... editing functions remain unchanged ...

async function updateFavoritesList() {
    if (!favoritesContainer) return;
    try {
        showLoadingState(favoritesContainer);
        const response = await fetch(`${API_BASE_URL}/all`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => {});
            throw new Error(errorData?.error || 'Failed to load favorites');
        }
        const recipes = await response.json();

        favoritesContainer.innerHTML = `
            <h1>My Favorites</h1>
            <div id="favorites-list">${recipes.map(createRecipeCard).join('')}</div>
        `;
    } catch (error) {
        showError('Failed to load favorites', error);
    }
}


async function searchRecipes(ingredients) {
    if (!ingredients.trim()) return showError('Please enter ingredients to search');
    showLoadingState(recipesContainer);
    try {
        const params = new URLSearchParams({ ingredients });
        const response = await fetch(`${API_BASE_URL}/search?${params.toString()}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => {});
            if (errorData?.error === 'Invalid or missing Spoonacular API key') {
                showError('API Key Error', 'The Spoonacular API key is missing or invalid. Please contact the administrator to set up a valid API key.');
                return;
            }
            throw new Error(errorData?.error || 'Search failed');
        }
        const data = await response.json();
        if (!data.results || data.results.length === 0) {
            recipesContainer.innerHTML = '<p>No recipes found. Try different ingredients.</p>';
            return;
        }
        const recipes = data.results.map(formatRecipe);
        recipesContainer.innerHTML = recipes.map(createRecipeCard).join('');
    } catch (error) {
        showError('Search failed', error);
    }
}

async function getRandomRecipe() {
    showLoadingState(randomRecipeContainer);
    try {
        const response = await fetch(`${API_BASE_URL}/random`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => {});
            if (errorData?.error === 'Invalid or missing Spoonacular API key') {
                showError('API Key Error', 'The Spoonacular API key is missing or invalid. Please contact the administrator to set up a valid API key.');
                randomRecipeContainer.innerHTML = '<p>API key is missing or invalid. Please contact the administrator.</p>';
                return;
            }
            throw new Error(errorData?.error || 'Failed to fetch random recipe');
        }
        const data = await response.json();
        const recipe = formatRecipe(data.recipe);
        randomRecipeContainer.innerHTML = createRecipeCard(recipe);
    } catch (error) {
        showError('Failed to fetch random recipe', error);
        randomRecipeContainer.innerHTML = '<p>Failed to fetch random recipe. Please try again.</p>';
    }
}

async function openRecipeDetails(id) {
    showLoadingState(modalContent);
    try {
        const response = await fetch(`${API_BASE_URL}/details/${id}`);
        if (!response.ok) throw new Error('Failed to load recipe details');
        const data = await response.json();
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
