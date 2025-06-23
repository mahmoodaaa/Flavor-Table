// Initialize API base URL
const API_BASE_URL = '/api/recipes';

// DOM Elements


const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const recipesContainer = document.getElementById('recipes-container');
const randomBtn = document.getElementById('random-btn');
const randomRecipeContainer = document.getElementById('random-recipe');
const recipeModal = document.getElementById('recipe-modal');
const modalContent = document.getElementById('modal-content');
const favoritesContainer = document.getElementById('favorites-list');


// Error handling
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <p>${message}</p>
        <button>Dismiss</button>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Remove error message after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);

    // Remove when clicked
    errorDiv.querySelector('button').addEventListener('click', () => {
        errorDiv.remove();
    });
}

// Loading state
function showLoadingState(container) {
    const loading = document.createElement('div');
    loading.className = 'loading';
    loading.innerHTML = `
        <div class="spinner"></div>
        <p>Loading...</p>
    `;
    container.innerHTML = '';
    container.appendChild(loading);
}

// Format recipe data
function formatRecipe(recipe) {
    return {
        id: recipe.id,
        title: recipe.title,
        image: recipe.image,
        readyInMinutes: recipe.readyInMinutes,
        instructions: recipe.instructions,
        ingredients: recipe.extendedIngredients?.map(ing => ing.name) || [],
        usedIngredients: recipe.usedIngredients?.map(ing => ing.name) || [],
        missedIngredients: recipe.missedIngredients?.map(ing => ing.name) || []
    };
}

// Create recipe card
function createRecipeCard(recipe) {
    return `
        <div class="recipe-card">
            <img src="${recipe.image || 'https://via.placeholder.com/300x200?text=No+Image'}" 
                 alt="${recipe.title}" 
                 class="recipe-image">
            <div class="recipe-info">
                <h3>${recipe.title}</h3>
                <p>Ready in ${recipe.readyInMinutes || 30} minutes</p>
                <div class="recipe-actions">
                    <button class="view-btn" onclick="openRecipeDetails(${recipe.id})">View Details</button>
                    <button class="save-btn" onclick="saveRecipe(${JSON.stringify(recipe).replace(/"/g, '&quot;')})">Save</button>
                </div>
            </div>
        </div>
    `;
}

// Search recipes functionality
async function searchRecipes(ingredients) {
    try {
        if (!ingredients || ingredients.trim() === '') {
            showError('Please enter some ingredients to search');
            return;
        }

        console.log(`Searching for recipes with ingredients: ${ingredients}`);
        showLoadingState(recipesContainer);

        const response = await fetch(`/api/recipes/search?ingredients=${encodeURIComponent(ingredients)}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to search recipes');
        }

        if (data.recipes && data.recipes.length > 0) {
            recipesContainer.innerHTML = `
                <h2>Search Results</h2>
                <div class="recipes-grid">${data.recipes.map(recipe => createRecipeCard(recipe)).join('')}</div>
            `;
        } else {
            recipesContainer.innerHTML = `
                <div class="no-results">
                    <h3>No recipes found</h3>
                    <p>Try searching with different ingredients</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Search error:', error);
        recipesContainer.innerHTML = '';
        showError('Failed to search recipes. Please try again.');
    } finally {
        // Remove loading state
        const loading = recipesContainer.querySelector('.loading');
        if (loading) loading.remove();
    }
}

// Random recipe functionality
async function getRandomRecipe() {
    try {
        console.log('Fetching random recipe');
        showLoadingState(randomRecipeContainer);
        const response = await fetch(`/api/recipes/random`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch random recipe');
        }

        const recipe = data.recipe;
        randomRecipeContainer.innerHTML = `
            <div class="recipe-card">
                <img src="${recipe.image}" alt="${recipe.title}" />
                <h3>${recipe.title}</h3>
                <p>Ready in ${recipe.readyInMinutes} minutes</p>
                <div class="actions">
                    <button onclick="openRecipeDetails(${recipe.id})">View Details</button>
                    <button onclick="saveRecipe(${JSON.stringify({
                        id: recipe.id,
                        title: recipe.title,
                        image: recipe.image,
                        readyInMinutes: recipe.readyInMinutes
                    }).replace(/"/g, '&quot;')})">Save</button>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Random Recipe Error:', error);
        showError('Failed to fetch random recipe. Please try again.');
    } finally {
        const loading = document.querySelector('.loading');
        if (loading) loading.remove();
    }
}

// Recipe details modal
async function openRecipeDetails(id) {
    try {
        showLoadingState(modalContent);
        const response = await fetch(`${API_BASE_URL}/details/${id}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>${data.title}</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <img src="${data.image || 'https://via.placeholder.com/600x400?text=No+Image'}" 
                     alt="${data.title}" 
                     class="recipe-image">
                <div class="modal-info">
                    <h3>Ingredients:</h3>
                    <ul>
                        ${data.ingredients.map(ing => `<li>${ing}</li>`).join('')}
                    </ul>
                    <h3>Instructions:</h3>
                    <ol>
                        ${data.instructions.split('. ').map(step => `<li>${step}</li>`).join('')}
                    </ol>
                </div>
            </div>
        `;

        // Close modal when clicking the close button
        document.querySelector('.close-modal').addEventListener('click', () => {
            recipeModal.style.display = 'none';
        });

        // Close modal when clicking outside
        recipeModal.addEventListener('click', (e) => {
            if (e.target === recipeModal) {
                recipeModal.style.display = 'none';
            }
        });

        recipeModal.style.display = 'block';
    } catch (error) {
        console.error('Error fetching recipe details:', error);
        showError('Failed to load recipe details. Please try again.');
    } finally {
        const loading = document.querySelector('.loading');
        if (loading) loading.remove();
    }
}

// Favorites functionality
function updateFavoritesList() {
    if (!favoritesContainer) return;

    try {
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        if (favorites.length === 0) {
            favoritesContainer.innerHTML = `
                <div class="no-favorites">
                    <h2>Your Favorites</h2>
                    <p>No favorites yet. Save some recipes to see them here!</p>
                </div>
            `;
            return;
        }

        favoritesContainer.innerHTML = `
            <h2>Your Favorites</h2>
            <div class="favorites-grid">
                ${favorites.map(recipe => createRecipeCard(recipe)).join('')}
            </div>
        `;
    } catch (error) {
        console.error('Error updating favorites:', error);
        favoritesContainer.innerHTML = `
            <div class="error-message">
                <h2>Error</h2>
                <p>Failed to load favorites. Please try again later.</p>
            </div>
        `;
    }
}

function saveRecipe(recipeData) {
    try {
        const recipe = typeof recipeData === 'string' ? JSON.parse(recipeData) : recipeData;
        let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        
        const exists = favorites.some(fav => fav.id === recipe.id);
        
        if (!exists) {
            favorites.push(recipe);
            localStorage.setItem('favorites', JSON.stringify(favorites));
            showError('Recipe saved to favorites!');
        } else {
            showError('Recipe is already in favorites!');
        }
        updateFavoritesList();
    } catch (error) {
        console.error('Error saving recipe:', error);
        showError('Failed to save recipe');
    }
}

function removeFromFavorites(recipeId) {
    try {
        let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        favorites = favorites.filter(recipe => recipe.id !== recipeId);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        updateFavoritesList();
    } catch (error) {
        console.error('Error removing from favorites:', error);
        showError('Failed to remove recipe from favorites');
    }
}

// Initialize the app
function initializeApp() {
    // Search form submission
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const ingredients = searchInput.value.trim();
        if (!ingredients) {
            showError('Please enter some ingredients to search');
            return;
        }
        await searchRecipes(ingredients);
    });

    // Random recipe button click
    randomBtn.addEventListener('click', getRandomRecipe);

    // Initial load
    getRandomRecipe();
}
// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);
document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');

    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevent default form submission
            const ingredients = searchInput.value.trim();
            if (ingredients) {
                searchRecipes(ingredients); // ✅ Call your async function
            }
        });
    }


    if (randomBtn) {
        randomBtn.addEventListener('click', getRandomRecipe);
    }

    const navButtons = document.querySelectorAll('.nav-btn');
    const pages = document.querySelectorAll('.page');

    if (navButtons.length > 0 && pages.length > 0) {
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                navButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                const targetPage = button.getAttribute('data-page');
                pages.forEach(page => {
                    page.classList.remove('active');
                    if (page.id === `${targetPage}-page`) {
                        page.classList.add('active');
                    }
                });
            });
        });
    }
});