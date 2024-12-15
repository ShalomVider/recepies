const searchInput = document.getElementById('search_input');
const searchButton = document.getElementById('search_button');
const recipeContainer = document.querySelector('.list_of_recipes');
const favorites = [];

async function fetchRecipes(query) {
    const apiKey = '3845e7a2e2d5429abea7b139ee17acd8';
    const apiUrl = `https://api.spoonacular.com/recipes/complexSearch?query=${query}&number=15&apiKey=${apiKey}`;
    
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Error fetching recipes');
        
        const data = await response.json();
        displayRecipes(data.results);
    } catch (error) {
        console.error('Error:', error);
        recipeContainer.innerHTML = '<p>Sorry, we couldn’t fetch recipes. Please try again later.</p>';
    }
}

function displayRecipes(recipes){
    recipeContainer.innerHTML = '';

    if(recipes.length === 0){
        recipeContainer.innerHTML = '<p>No recipes found. Please try a different search.</p>';
        return;
    }

    recipes.forEach(recipe => {
        const recipeCard = document.createElement('div');
        recipeCard.classList.add('recipe-card');
        recipeCard.setAttribute('data-id', recipe.id);
        recipeCard.innerHTML = `
        <img src="${recipe.image}" alt="${recipe.title}">
        <h3>${recipe.title}<h3>
        `;
        recipeContainer.appendChild(recipeCard);
        
    });
}

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchButton.click();
    }
});

searchButton.addEventListener('click',() =>{
    const query = searchInput.value.trim();
    
    if(query){
        fetchRecipes(query);
    }else if (!query) {
        recipeContainer.innerHTML = '<p>Please enter a recipe name to search.</p>';
        searchInput.focus();
        return;
    }
    
})

async function fetchRecipeDetails(id, savedServings = null) {
    const apiKey = '3845e7a2e2d5429abea7b139ee17acd8';
    const apiUrl = `https://api.spoonacular.com/recipes/${id}/information?apiKey=${apiKey}`;
    
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Error fetching recipe details');
        
        const data = await response.json();
        displayRecipeDetails(data, savedServings || data.servings);
    } catch (error) {
        console.error('Error:', error);
    }
}

function displayRecipeDetails(recipe, currentServings) {
    const recipeDisplay = document.querySelector('.recipe_display');

    function updateIngredients() {
        const ingredientsHtml = recipe.extendedIngredients.map(ing => {
            const adjustedAmount = (ing.amount / recipe.servings) * currentServings;
            return `
                <div class="ingredient-item">
                    <img src="Photos/checked.png" alt="✔" class="ingredient-icon">
                    <span>${adjustedAmount.toFixed(2)} ${ing.unit || ''} ${ing.name}</span>
                </div>`;
        }).join('');
        
        document.querySelector('.ingredients-grid').innerHTML = ingredientsHtml;
    }

    // רינדור ראשוני של פרטי המתכון
    recipeDisplay.innerHTML = `
    <h1>${recipe.title}</h1> <!-- כותרת המתכון -->
    <img src="${recipe.image}" alt="${recipe.title}" class="recipe-main-image"> <!-- תמונת המתכון --> 
    <div class="recipe-info">
        <div class="time-info">
            <img src="Photos/clock.png" alt="Clock" class="icon">
            <span class="time-text">${recipe.readyInMinutes} minutes</span>
        </div>
        <div class="servings-info">
            <img src="Photos/man.png" alt="Man" class="icon"> 
            <span>Servings:</span>
            <span id="current-servings">${currentServings}</span>
            <button class="servings-control minus">-</button>
            <button class="servings-control plus">+</button>
        </div>
        <button class="favorite-button" data-id="${recipe.id}" data-title="${recipe.title}" data-image="${recipe.image}" data-servings="${currentServings}">&#x2665;</button>
    </div>
    <h3>Ingredients:</h3>
    <div class="ingredients-grid"></div>
    <button id="add-to-shopping-list">
        <img src="Photos/add-to-cart.png" alt="Add to Cart" class="cart-icon">
        Add to Shopping List
    </button>
    <button id="directions-button" class="directions-button">Directions</button>
`;


    // עדכון רכיבי המתכון
    updateIngredients();

    // מאזינים לכפתורי הפלוס והמינוס
    document.querySelector('.servings-control.plus').addEventListener('click', () => {
        currentServings++;
        document.getElementById('current-servings').textContent = currentServings;
        updateIngredients();
    });

    document.querySelector('.servings-control.minus').addEventListener('click', () => {
        if (currentServings > 1) {
            currentServings--;
            document.getElementById('current-servings').textContent = currentServings;
            updateIngredients();
        }
    });

    // כפתור Directions
    document.getElementById('directions-button').addEventListener('click', () => {
        if (recipe.sourceUrl) {
            window.open(recipe.sourceUrl, '_blank'); // פותח טאב חדש עם ההוראות
        } else {
            alert('Directions are not available for this recipe.');
        }
    });

    // הוספת מתכון למועדפים
    document.querySelector('.favorite-button').addEventListener('click', (event) => {
        const button = event.target;
        const id = button.dataset.id;
        const title = button.dataset.title;
        const image = button.dataset.image;
        const servings = parseInt(button.dataset.servings, 10); // ודא שהמספר נשמר נכון
    
        if (!favorites.some(fav => fav.id === id)) {
            addToFavorites({ id, title, image }, servings);
        } else {
            alert(`${title} is already in your favorites!`);
        }
    });
    

    // הוספת מצרכים לרשימת הקניות
    document.getElementById('add-to-shopping-list').addEventListener('click', () => {
        addToShoppingList(recipe.extendedIngredients, currentServings, recipe.servings);
    });
}

recipeContainer.addEventListener('click', (event) => {
    const target = event.target;
    const recipeCard = target.closest('.recipe-card');
    if (!recipeCard) return;

    const id = recipeCard.dataset.id;
    if (id) {
        fetchRecipeDetails(id);
    }
});

function addToShoppingList(ingredients, currentServings, originalServings) {
    const shoppingList = document.getElementById('shopping-list-items');

    // בדיקה אם רשימת הקניות כבר מכילה פריטים
    if (shoppingList.children.length > 0) {
        const userChoice = confirm("There is an existing shopping list. Do you want to add to the existing list?");
        
        if (userChoice) {
            // הוספת המצרכים החדשים לרשימה הקיימת
            ingredients.forEach((ing) => {
                const existingItem = Array.from(shoppingList.children).find(item =>
                    item.querySelector('span').textContent.trim() === ing.name
                );

                if (existingItem) {
                    // עדכון כמות עבור פריט קיים
                    const amountDisplay = existingItem.querySelector('.amount-display');
                    const [currentAmount, unit] = amountDisplay.textContent.split(' ');
                    const adjustedAmount = (ing.amount / originalServings) * currentServings;
                    const newAmount = parseFloat(currentAmount) + adjustedAmount;
                    amountDisplay.textContent = `${newAmount.toFixed(2)} ${unit}`;
                } else {
                    // הוספת פריט חדש
                    const adjustedAmount = (ing.amount / originalServings) * currentServings;
                    shoppingList.innerHTML += `
                        <li class="shopping-list-item">
                            <span>${ing.name}</span>
                            <div class="amount-controls">
                                <button class="increase-amount">▲</button>
                                <span class="amount-display">${adjustedAmount.toFixed(2)} ${ing.unit || ''}</span>
                                <button class="decrease-amount">▼</button>
                            </div>
                            <button class="remove-item">🗑️</button>
                        </li>
                    `;
                }
            });
        } else {
            // יצירת רשימת קניות חדשה
            initializeNewShoppingList(ingredients, currentServings, originalServings);
        }
    } else {
        // יצירת רשימת קניות חדשה
        initializeNewShoppingList(ingredients, currentServings, originalServings);
    }

    // הוספת פונקציונליות לחצנים
    initializeShoppingListControls();
}

function initializeNewShoppingList(ingredients, currentServings, originalServings) {
    const shoppingList = document.getElementById('shopping-list-items');

    shoppingList.innerHTML = ingredients.map((ing) => {
        const adjustedAmount = (ing.amount / originalServings) * currentServings;
        return `
            <li class="shopping-list-item" data-base-amount="${(ing.amount / originalServings).toFixed(2)}">
                <span>${ing.name}</span>
                <div class="amount-controls">
                    <button class="increase-amount">▲</button>
                    <span class="amount-display">${adjustedAmount.toFixed(2)} ${ing.unit || ''}</span>
                    <button class="decrease-amount">▼</button>
                </div>
                <button class="remove-item">🗑️</button>
            </li>
        `;
    }).join('');

    initializeShoppingListControls(); // קריאה לפונקציה כדי לקשור אירועים
}


function initializeShoppingListControls() {
    const shoppingList = document.getElementById('shopping-list-items');

    shoppingList.querySelectorAll('.shopping-list-item').forEach(item => {
        const amountDisplay = item.querySelector('.amount-display');
        const baseAmount = parseFloat(item.getAttribute('data-base-amount')); // הכמות הבסיסית

        // מאזין להוספת כמות
        item.querySelector('.increase-amount').addEventListener('click', () => {
            const [currentAmount, unit] = amountDisplay.textContent.split(' ');
            const newAmount = parseFloat(currentAmount) + baseAmount;
            amountDisplay.textContent = `${newAmount.toFixed(2)} ${unit}`;
        });

        // מאזין להורדת כמות
        item.querySelector('.decrease-amount').addEventListener('click', () => {
            const [currentAmount, unit] = amountDisplay.textContent.split(' ');
            const newAmount = Math.max(baseAmount, parseFloat(currentAmount) - baseAmount);
            amountDisplay.textContent = `${newAmount.toFixed(2)} ${unit}`;
        });

        // מאזין למחיקת פריט
        item.querySelector('.remove-item').addEventListener('click', () => {
            item.remove(); // הסרה של הפריט מהרשימה
        });
    });
}

// מאזין לכפתור שליחת רשימת קניות
document.getElementById('send-email-button').addEventListener('click', () => {
    // הצגת החלון הקופץ
    document.getElementById('email-popup').classList.remove('hidden');
});

// מאזין לכפתור ביטול בחלון הקופץ
document.getElementById('cancel-email').addEventListener('click', () => {
    // הסתרת החלון הקופץ
    document.getElementById('email-popup').classList.add('hidden');
});

function addToFavorites(recipe, currentServings) {
    const exists = favorites.some((fav) => fav.id === recipe.id);
    if (!exists) {
        favorites.push({
            id: recipe.id,
            title: recipe.title,
            image: recipe.image,
            servings: currentServings,
        });
        updateFavoritesDropdown();
        alert(`${recipe.title} has been added to your favorites!`); // הודעה
    } else {
        alert(`${recipe.title} is already in your favorites!`);
    }
}

function updateFavoritesDropdown() {
    const dropdown = document.querySelector('.favorites-dropdown');
    dropdown.innerHTML = ''; // איפוס התוכן הקיים

    if (favorites.length === 0) {
        dropdown.innerHTML = '<p>No favorites yet</p>';
        return;
    }

    favorites.forEach((fav) => {
        const favoriteItem = document.createElement('div');
        favoriteItem.classList.add('favorite-item');
        favoriteItem.innerHTML = `
            <img src="${fav.image}" alt="${fav.title}" class="favorite-image">
            <span class="favorite-title">${fav.title}</span>
            <button class="remove-favorite-button" data-id="${fav.id}">🗑️</button>
        `;
        dropdown.appendChild(favoriteItem);
    });

    // מאזינים לכפתורי מחיקת מתכונים מהמועדפים
    document.querySelectorAll('.remove-favorite-button').forEach((button) => {
        button.addEventListener('click', (event) => {
            const id = event.target.getAttribute('data-id');
            removeFavorite(id);
        });
    });
}



function removeFavorite(id) {
    const index = favorites.findIndex((fav) => fav.id === id);
    if (index !== -1) {
        favorites.splice(index, 1); // הסרה מהמועדפים
        updateFavoritesDropdown();
    }
}

// פתיחת וסגירת תיבת המועדפים
const favoritesButton = document.querySelector('.favorites-button');
const favoritesDropdown = document.querySelector('.favorites-dropdown');

// פתיחה וסגירה של תיבת המועדפים בלחיצה
favoritesButton.addEventListener('click', () => {
    const isVisible = favoritesDropdown.style.display === 'block';
    favoritesDropdown.style.display = isVisible ? 'none' : 'block';
});

// סגירה של התיבה בלחיצה מחוץ לה
document.addEventListener('click', (event) => {
    if (!favoritesButton.contains(event.target) && !favoritesDropdown.contains(event.target)) {
        favoritesDropdown.style.display = 'none';
    }
});




// הצגת מתכון מהמועדפים בעמודה האמצעית
document.querySelector('.favorites-dropdown').addEventListener('click', (event) => {
    if (event.target.classList.contains('favorite-title')) {
        const title = event.target.textContent.trim();
        const recipe = favorites.find((fav) => fav.title === title);
        if (recipe) {
            fetchRecipeDetails(recipe.id); // פותח את המתכון בעמודה האמצעית
        }
    }
});

