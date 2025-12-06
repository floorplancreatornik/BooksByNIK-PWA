// ----------------------------------------------------
// CORE CONFIGURATION
// ----------------------------------------------------

// Live API Endpoint from Google Apps Script (YOUR CORRECT URL)
const API_ENDPOINT = "https://script.google.com/macros/s/AKfycbx_jW7B1ln-WK_zMyWfqiKEbvLkA6j1tigPaC2AuuEG8wWdYSz_w4xwnMWj8Hds8CFO7w/exec";

// Local Storage Key for Shopping Cart
const CART_STORAGE_KEY = 'booksByNikCart';

// Global variables for data and DOM elements
const mainContent = document.getElementById('main-content');
let fullBookCatalog = []; 

// ----------------------------------------------------
// HELPER FUNCTIONS (CART STORAGE & DATA)
// ----------------------------------------------------

/**
 * Loads the cart array from Local Storage.
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
 * Clears the entire cart after a successful order.
 */
function clearCart() {
    localStorage.removeItem(CART_STORAGE_KEY);
    updateCartUI();
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

    const cartCountElement = document.querySelector('#bottom-nav button:nth-child(2) .text-xs'); 
    if (cartCountElement) {
        cartCountElement.textContent = `Cart (${totalItems})`;
    }
}

// ----------------------------------------------------
// CART MANAGEMENT LOGIC (ADD/REMOVE)
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

/**
 * Removes a specific book ID entirely from the cart.
 */
function removeFromCart(bookId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== bookId);
    saveCart(cart);
    updateCartUI();
    // Re-render the cart page to show the change immediately
    renderCartPage(); 
}

// ----------------------------------------------------
// HOME PAGE RENDERING
// ----------------------------------------------------

/**
 * Creates the HTML structure for a single book card.
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
    const loadingIndicator = document.getElementById('loading-indicator');
    const catalogContainer = document.getElementById('catalog-container');

    try {
        if (loadingIndicator) loadingIndicator.style.display = 'block';
        
        const response = await fetch(API_ENDPOINT);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const books = await response.json();
        fullBookCatalog = books; // SAVE CATALOG GLOBALLY

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

/**
 * Renders the Home Page content and triggers data fetch.
 */
function renderHomePage() {
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
    fetchAndRenderCatalog(); 
}

// ----------------------------------------------------
// CART PAGE RENDERING
// ----------------------------------------------------

/**
 * Renders the Cart Page based on items in Local Storage.
 */
function renderCartPage() {
    const cart = getCart();
    let cartHTML = '';
    let subtotal = 0;

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
    } else {
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

    mainContent.innerHTML = cartHTML;
}

// ----------------------------------------------------
// CHECKOUT FORM RENDERING
// ----------------------------------------------------

/**
 * Renders the form for collecting customer and delivery details.
 */
function renderCheckoutForm() {
    const cart = getCart();
    if (cart.length === 0) {
        renderCartPage(); 
        return;
    }

    let subtotal = 0;
    
    cart.forEach(item => {
        const book = getBookById(item.id);
        if (book) {
            subtotal += book.PRICE_INR * item.quantity;
        }
    });

    const subtotalFormatted = new Intl.NumberFormat('en-IN', {style: 'currency', currency: 'INR'}).format(subtotal);

    mainContent.innerHTML = `
        <h2 class="font-lora text-3xl font-semibold mb-8 pb-2 border-b">Complete Your Order</h2>
        
        <form id="checkout-form" class="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-2xl space-y-6">
            <h3 class="font-lora text-xl font-medium mb-4">Delivery Details</h3>

            <div class="space-y-2">
                <label for="customer-phone" class="block text-sm font-medium text-gray-700">Phone Number (Required for WhatsApp Order)</label>
                <input type="tel" id="customer-phone" name="customer-phone" required 
                       class="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-black focus:border-black"
                       placeholder="+91-XXXXXXXXXX">
            </div>

            <div class="space-y-2">
                <label for="delivery-address" class="block text-sm font-medium text-gray-700">Delivery Address (Full Address)</label>
                <textarea id="delivery-address" name="delivery-address" rows="4" required 
                          class="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-black focus:border-black"
                          placeholder="House Name, Street, City, Pincode"></textarea>
            </div>
            
            <div class="pt-4 border-t border-gray-100">
                <div class="flex justify-between items-center text-xl font-bold mb-4">
                    <span>Final Total:</span>
                    <span class="text-green-600">${subtotalFormatted}</span>
                </div>
                
                <button type="submit" id="submit-order-btn" 
                        class="w-full bg-black text-white py-4 rounded-lg font-semibold text-xl hover:bg-gray-800 transition duration-150">
                    Place Order & Pay
                </button>
            </div>
            <p id="order-status-message" class="text-center text-sm text-gray-600 mt-4 hidden">Processing...</p>
        </form>
    `;
}

// ------------------------------------
// INITIALIZATION AND EVENT LISTENERS (ROUTING & ACTIONS)
// ------------------------------------

/**
 * Sets up a single click listener on the document body to handle all navigation and cart actions.
 */
document.addEventListener('click', (event) => {
    // Finds the closest button, or the specific element IDs we care about
    const target = event.target.closest('button, #go-home-btn, #checkout-btn'); 

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
            target.textContent = 'Added!';
            setTimeout(() => target.textContent = 'Buy Now', 1000);
        }
    } else if (target.matches('.remove-item-btn')) {
        const bookId = target.getAttribute('data-book-id');
        if (bookId) {
            removeFromCart(bookId);
        }
    } else if (target.id === 'checkout-btn') {
        renderCheckoutForm();
    }
});

/**
 * Listens for the checkout form submission and posts data to Google Apps Script.
 */
document.addEventListener('submit', async (event) => {
    if (event.target.id === 'checkout-form') {
        event.preventDefault(); 
        
        const form = event.target;
        const submitButton = document.getElementById('submit-order-btn');
        const statusMessage = document.getElementById('order-status-message');

        const customerPhone = form['customer-phone'].value;
        const deliveryAddress = form['delivery-address'].value;
        const cart = getCart();
        
        if (!customerPhone || !deliveryAddress || cart.length === 0) {
            statusMessage.textContent = 'Please fill all details and ensure your cart is not empty.';
            statusMessage.style.display = 'block';
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Placing Order...';
        statusMessage.textContent = 'Processing order...';
        statusMessage.style.display = 'block';

        let subtotal = 0;
        const orderDetails = cart.map(item => {
            const book = getBookById(item.id);
            if (!book) return null;
            
            const totalPrice = book.PRICE_INR * item.quantity;
            subtotal += totalPrice;
            
            return {
                id: item.id,
                quantity: item.quantity,
                pricePerUnit: book.PRICE_INR,
                totalPrice: totalPrice 
            };
        }).filter(item => item !== null);

        const payload = {
            cart: orderDetails,
            customerPhone: customerPhone,
            deliveryAddress: deliveryAddress,
            orderTotal: subtotal 
        };

        try {
            const response = await fetch(API_ENDPOINT, { 
                method: 'POST', // Calls the doPost function in Apps Script
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.success) {
                clearCart();
                mainContent.innerHTML = `
                    <div class="text-center py-16">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-20 w-20 text-green-600 mx-auto mb-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
                        <h3 class="font-lora text-3xl font-semibold mb-2 text-gray-800">Order Placed!</h3>
                        <p class="text-xl text-gray-600">Your Order ID: <span class="font-bold text-black">${result.orderId}</span></p>
                        <p class="mt-4 text-lg text-gray-500">We will contact you shortly on WhatsApp to confirm delivery and payment.</p>
                        <button id="go-home-btn" class="mt-8 bg-black text-white py-3 px-8 rounded-lg font-semibold hover:bg-gray-800 transition duration-150">
                            Continue Shopping
                        </button>
                    </div>
                `;
            } else {
                statusMessage.textContent = 'Order failed. Please try again.';
                console.error("API Error:", result.message);
            }
        } catch (error) {
            statusMessage.textContent = 'Network error. Check your connection.';
            console.error("Fetch Error:", error);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Place Order & Pay';
        }
    }
});


// Run initialization logic when the page loads
document.addEventListener('DOMContentLoaded', () => {
    renderHomePage(); 
    updateCartUI(); 
});


// --- STEP 9: SERVICE WORKER REGISTRATION (PWA) ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/BooksByNIK-PWA/service-worker.js', {scope: '/BooksByNIK-PWA/'})
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
}