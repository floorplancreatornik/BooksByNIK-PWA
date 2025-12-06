// ----------------------------------------------------
// STEP 5: API CONFIGURATION & DATA FETCHING
// ----------------------------------------------------

// Live API Endpoint from Google Apps Script (Your URL)
const API_ENDPOINT = "https://script.google.com/macros/s/AKfycbwUuBJ6-uRR8z4bbpPJoY71JXmhVEGPDU6XSwQF333thFLiw_987JzP2bVzLwm2s0lq/exec";

// DOM elements for control and display
const catalogContainer = document.getElementById('catalog-container');
const loadingIndicator = document.getElementById('loading-indicator');

/**
 * Creates the HTML structure for a single book card using Tailwind classes.
 * @param {object} book - A single book object from the Google Sheet data.
 * @returns {string} The HTML string for the book card.
 */
function createBookCard(book) {
    // Format the price in Indian Rupees
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
 * Fetches the book data and renders the catalog onto the Home Page.
 */
async function fetchAndRenderCatalog() {
    try {
        loadingIndicator.style.display = 'block';
        
        const response = await fetch(API_ENDPOINT);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const books = await response.json();

        if (books.length === 0) {
            catalogContainer.innerHTML = '<p class="text-xl text-center text-gray-500 py-12">No books found in the catalog.</p>';
            return;
        }

        const catalogHTML = books.map(createBookCard).join('');
        catalogContainer.innerHTML = catalogHTML;

    } catch (error) {
        console.error("Failed to fetch catalog data:", error);
        catalogContainer.innerHTML = `
            <p class="text-xl text-red-600 text-center py-12">Error loading catalog: Please check API permissions and Sheet structure.</p>
        `;
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

// ----------------------------------------------------
// STEP 6: CART MANAGEMENT FUNCTIONS (Local Storage)
// ----------------------------------------------------

const CART_STORAGE_KEY = 'booksByNikCart';
// Target the Cart button's text/span to update the count
const cartCountElement = document.querySelector('#bottom-nav button:nth-child(2) .text-xs'); 

/**
 * Loads the cart array from Local Storage.
 * @returns {Array} The current cart items.
 */
function getCart() {
    try {
        const cartJson = localStorage.getItem(CART_STORAGE_KEY);
        return cartJson ? JSON.parse(cartJson) : [];
    } catch (e) {
        console.error("Error loading cart:", e);
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
        console.error("Error saving cart:", e);
    }
}

/**
 * Updates the visual count on the Cart navigation button.
 */
function updateCartUI() {
    const cart = getCart();
    // Sums the quantity of all items
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0); 
    
    // Updates the text 'Cart (X)'
    cartCountElement.textContent = `Cart (${totalItems})`;
}

/**
 * Adds or updates a book in the cart.
 */
function addToCart(bookId) {
    let cart = getCart();
    const existingItem = cart.find(item => item.id === bookId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        // Add new item to cart
        cart.push({ id: bookId, quantity: 1 });
    }

    saveCart(cart);
    updateCartUI();
    console.log(`Added book ${bookId}. Current cart:`, cart);
}

/**
 * Sets up event listeners for dynamically added 'Buy Now' buttons.
 */
function setupAddToCartListeners() {
    // Event delegation: Listen for clicks on the whole content area
    document.getElementById('main-content').addEventListener('click', (event) => {
        const target = event.target;
        
        // Checks if the clicked element has the 'add-to-cart-btn' class
        if (target.matches('.add-to-cart-btn')) {
            const bookId = target.getAttribute('data-book-id');
            if (bookId) {
                addToCart(bookId);
                // Temporary visual feedback
                target.textContent = 'Added!';
                setTimeout(() => target.textContent = 'Buy Now', 1000);
            }
        }
    });
}

// ------------------------------------
// INITIALIZATION
// ------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    // 1. Fetch data and render the catalog
    fetchAndRenderCatalog();
    
    // 2. Set up click listeners for adding items
    setupAddToCartListeners();
    
    // 3. Initialize the cart count display
    updateCartUI(); 
});