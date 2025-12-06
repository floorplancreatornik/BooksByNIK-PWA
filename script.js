// ----------------------------------------------------
// CORE CONFIGURATION
// ----------------------------------------------------

// Live API Endpoint from Google Apps Script (Your URL)
const API_ENDPOINT = "https://script.google.com/macros/s/AKfycbwUuBJ6-uRR8z4bbpPJoY71JXmhVEGPDU6XSwQF333thFLiw_987JzP2bVzLwm2s0lq/exec";

// Local Storage Key for Shopping Cart
const CART_STORAGE_KEY = 'booksByNikCart';

// Global variables for data and DOM elements
const mainContent = document.getElementById('main-content');
let fullBookCatalog = []; 

// ----------------------------------------------------
// HELPER FUNCTIONS (CART STORAGE)
// ----------------------------------------------------

/**
 * Loads the cart array from Local Storage. Initializes to an empty array if none exists.
 */
function getCart() {
    try {
        const cartJson = localStorage.getItem(CART_STORAGE_KEY);
        return cartJson ? JSON.parse(cartJson) : [];
    } catch (e) {
        console.error("Error loading cart from local storage:", e);
        return [];
    }
}

/**
 * Saves the current cart array to Local Storage.
 */
function saveCart(cart) {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
        console.error("Error saving cart to local storage:", e);
    }
}

/**
 * Gets full book details from the in-memory catalog by ID.
 */
function getBookById(bookId) {
    return fullBookCatalog.find(book => book.BOOK_ID === bookId);
}

/**
 * Updates the visual count on the Cart navigation button.
 */
function updateCartUI() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Target the Cart button's span to update the count
    const cartCountElement = document.querySelector('#bottom-nav button:nth-child(2) .text-xs'); 
    if (cartCountElement) {
        cartCountElement.textContent = `Cart (${totalItems})`;
    }
}

// ----------------------------------------------------
// STEP 6: ADD TO CART LOGIC
// ----------------------------------------------------

/**
 * Adds or updates a book in the cart.
 */
function addToCart(bookId) {
    let cart = getCart();
    const existingItem = cart.find(item => item.id === bookId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id: bookId, quantity: 1 });
    }

    saveCart(cart);
    updateCartUI();
    console.log(`Added book ${bookId}. Current cart:`, cart);
}

// ----------------------------------------------------
// STEP 5: DATA FETCHING AND HOME PAGE RENDERING
// ----------------------------------------------------

/**
 * Creates the HTML structure for a single book card using Tailwind classes.
 */
function createBookCard(book) {
    const price = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(book.PRICE_INR);

    return `
        <div class="bg-white rounded-xl shadow-lg overflow-hidden transition transform hover:scale-[1.02] duration-300">
            <div class="relative w-full aspect-[3/4] overflow-hidden">
                <img src="${book.COVER_URL}" alt="${book.TITLE_EN}" class="w-full h-full object-cover shadow-xl">
                <div class="absolute top-4 right-4 bg-gray-900/40 backdrop-blur-sm text-white text-base font-semibold px-3 py-1 rounded-lg">
                    ${price}
                </div>
            </div>

            <div class="p-4 space-y-2">
                <h3 class="font-lora text-lg font-semibold leading-tight">${book.TITLE_EN}</h3>
                <p class="font-noto-sans-malayalam text-base text-gray-700">${book.TITLE_MAL}</p>
                <p class="font-inter text-sm text-gray-600 font-medium">By: ${book.AUTHOR}</p>
                <button 
                    class="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition duration-150 add-to-cart-btn" 
                    data-book-id="${book.BOOK_ID}">
                    Buy Now
                </button>
            </div>
        </div>
    `;
}

/**
 * Fetches the book data, saves it globally, and renders the catalog.
 */
async function fetchAndRenderCatalog() {
    // We assume the structure for loading-indicator and catalog-container exists in mainContent
    const loadingIndicator = document.getElementById('loading-indicator');
    const catalogContainer = document.getElementById('catalog-container');

    try {
        if (loadingIndicator) loadingIndicator.style.display = 'block';
        
        const response = await fetch(API_ENDPOINT);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const books = await response.json();
        fullBookCatalog = books; // <--- SAVE CATALOG GLOBALLY

        if (books.length === 0) {
            catalogContainer.innerHTML = '<p class="text-xl text-center text-gray-500 py-12">No books found in the catalog.</p>';
            return;
        }

        const catalogHTML = books.map(createBookCard).join('');
        catalogContainer.innerHTML = catalogHTML;

    } catch (error) {
        console.error("Failed to fetch catalog data:", error);
        catalogContainer.innerHTML = `
            <p class="text-xl text-red-600 text-center py-12">Error loading catalog. Check API and sheet structure.</p>
        `;
    } finally {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
}

// ----------------------------------------------------
// STEP 7: PAGE ROUTING AND CART PAGE RENDERING
// ----------------------------------------------------

/**
 * Renders the Home Page content and triggers data fetch.
 */
function renderHomePage() {
    // Re-insert the Home Page structure defined in index.html
    mainContent.innerHTML = `
        <header class="mb-8 pb-4 border-b border-gray-200">
            <h2 class="font-lora text-2xl md:text-3xl font-medium mb-1">NIK's Published Works</h2>
            <p class="font-inter text-gray-600">The collection, direct from the author to the reader.</p>
        </header>
        <div id="loading-indicator" class="text-center py-8" style="display: none;">
            <p class="font-inter text-lg text-gray-500">Loading your literary collection...</p>
        </div>
        <section id="catalog-container" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            </section>
    `;
    // Re-fetch data to populate the catalog container
    fetchAndRenderCatalog(); 
}


/**
 * Renders the Cart Page based on items in Local Storage.
 */
function renderCartPage() {
    const cart = getCart();
    let cartHTML = '';
    let subtotal = 0;

    // 1. Handle Empty Cart
    if (cart.length === 0) {
        cartHTML = `
            <div class="text-center py-16">
                <h3 class="font-lora text-3xl text-gray-700 mb-4">Your Cart is Empty</h3>
                <p class="text-lg text-gray-500">Add books from the Home page to start your order.</p>
                <button id="go-home-btn" class="mt-6 bg-black text-white py-3 px-8 rounded-lg font-semibold hover:bg-gray-800 transition duration-150">
                    Go to Home
                </button>
            </div>
        `;
    } 
    // 2. Handle Cart with Items
    else {
        const itemCardsHTML = cart.map(item => {
            const book = getBookById(item.id);
            if (!book) return ''; 
            
            const itemTotal = book.PRICE_INR * item.quantity;
            subtotal += itemTotal;

            const priceFormatted = new Intl.NumberFormat('en-IN', {style: 'currency', currency: 'INR'}).format(book.PRICE_INR);
            const totalFormatted = new Intl.NumberFormat('en-IN', {style: 'currency', currency: 'INR'}).format(itemTotal);

            return `
                <div class="flex items-center space-x-4 p-4 border-b border-gray-100 bg-white hover:bg-gray-50 transition rounded-lg shadow-sm">
                    <img src="${book.COVER_URL}" alt="${book.TITLE_EN}" class="w-16 h-auto aspect-[3/4] object-cover rounded shadow-md">
                    <div class="flex-grow">
                        <h4 class="font-lora text-lg font-semibold">${book.TITLE_EN}</h4>
                        <p class="text-sm text-gray-600">Qty: ${item.quantity} @ ${priceFormatted}</p>
                    </div>
                    <div class="text-right">
                        <span class="font-bold text-lg">${totalFormatted}</span>
                        <button class="remove-item-btn text-red-500 hover:text-red-700 text-sm block" data-book-id="${book.BOOK_ID}">Remove</button>
                    </div>
                </div>
            `;
        }).join('');

        const subtotalFormatted = new Intl.NumberFormat('en-IN', {style: 'currency', currency: 'INR'}).format(subtotal);
        
        // Final Cart Summary and Checkout Button
        cartHTML = `
            <h2 class="font-lora text-3xl font-semibold mb-6 pb-2 border-b">Your Shopping Cart</h2>
            <div class="space-y-4" id="cart-item-list">${itemCardsHTML}</div>
            
            <div class="mt-8 pt-4 border-t border-gray-200">
                <div class="flex justify-between items-center text-xl font-bold mb-6">
                    <span>Subtotal:</span>
                    <span>${subtotalFormatted}</span>
                </div>
                <button id="checkout-btn" class="w-full bg-green-600 text-white py-4 rounded-lg font-semibold text-xl hover:bg-green-700 transition duration-150 shadow-lg">
                    Proceed to Checkout
                </button>
            </div>
        `;
    }

    // Replace the entire main content
    mainContent.innerHTML = cartHTML;
}

// ------------------------------------
// INITIALIZATION AND EVENT DELEGATION (ROUTING)
// ------------------------------------

/**
 * Sets up a single click listener on the document body to handle all clicks
 * for navigation and cart actions (delegation).
 */
document.addEventListener('click', (event) => {
    const target = event.target.closest('button, #go-home-btn, #checkout-btn'); // Identify relevant elements

    if (!target) return;

    // --- A. PAGE ROUTING ---
    const homeButton = document.querySelector('#bottom-nav button:nth-child(1)');
    const cartButton = document.querySelector('#bottom-nav button:nth-child(2)');

    if (target.closest('.home-nav-btn') || target === homeButton || target.id === 'go-home-btn') {
        renderHomePage();
    } else if (target === cartButton) {
        renderCartPage();
    } 
    
    // --- B. CART ACTIONS ---
    else if (target.matches('.add-to-cart-btn')) {
        const bookId = target.getAttribute('data-book-id');
        if (bookId) {
            addToCart(bookId);
            // Temporary visual feedback
            target.textContent = 'Added!';
            setTimeout(() => target.textContent = 'Buy Now', 1000);
        }
    } 
    // We will handle 'remove-item-btn' and 'checkout-btn' fully in the next step (Step 8)
    else if (target.matches('.remove-item-btn')) {
        // Placeholder for removal logic (to be added in Step 8)
        alert('Item removal functionality coming in Step 8!');
    } else if (target.id === 'checkout-btn') {
        // Placeholder for checkout form rendering (to be added in Step 8)
        alert('Rendering Checkout Form in Step 8!');
    }
});

// Run initialization logic when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Start on the Home Page by default
    renderHomePage(); 
    
    // Initialize the cart count display
    updateCartUI(); 
});