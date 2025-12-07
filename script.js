// --- FINAL API ENDPOINTS (VERIFIED STABLE) ---
// Dedicated GET endpoint for fetching the catalog data
const CATALOG_API_ENDPOINT = "https://script.google.com/macros/s/AKfycbziBJMiEM0s_deX7L8-JFde6FjZXQYVu6J-1cPa7b3KBNhYSOsUz-9Nczo2LcTrUouj0g/exec";
// Dedicated POST endpoint for submitting orders
const ORDER_API_ENDPOINT = "https://script.google.com/macros/s/AKfycbwkbb81y8szLipovLlQxDrjfy-y-ETpLNuZjHJXokjm8dKd6Px12HqBrtvbCvEvA-7U/exec";
// ---------------------------------------------

let cart = JSON.parse(localStorage.getItem('cart')) || [];
let booksData = [];

// --- Helper function to update the cart display and total ---
function updateCart() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalElement = document.getElementById('cartTotal');
    const checkoutCartItems = document.getElementById('checkoutCartItems');
    let total = 0;

    // IMPORTANT: Check if elements exist before manipulating them
    if (!cartItemsContainer || !cartTotalElement || !checkoutCartItems) {
        console.error("Cart display elements not found. Check IDs in index.html.");
        return; 
    }

    cartItemsContainer.innerHTML = '';
    checkoutCartItems.innerHTML = '';

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-gray-500">Your cart is empty.</p>';
        checkoutCartItems.innerHTML = '<p class="text-gray-500">Cart is empty.</p>';
        cartTotalElement.textContent = '₹0';
        return;
    }

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        // Shopping Cart View
        const cartItemEl = document.createElement('div');
        cartItemEl.className = 'flex justify-between items-center py-2 border-b';
        cartItemEl.innerHTML = `
            <div>${item.title} (x${item.quantity})</div>
            <div>₹${itemTotal.toFixed(2)}</div>
            <button onclick="removeFromCart('${item.bookId}')" class="text-red-500 hover:text-red-700 text-sm">Remove</button>
        `;
        cartItemsContainer.appendChild(cartItemEl);

        // Checkout Cart View
        const checkoutItemEl = document.createElement('div');
        checkoutItemEl.className = 'flex justify-between items-center py-1';
        checkoutItemEl.innerHTML = `
            <span class="text-sm">${item.title} (x${item.quantity})</span>
            <span class="text-sm">₹${itemTotal.toFixed(2)}</span>
        `;
        checkoutCartItems.appendChild(checkoutItemEl);
    });

    cartTotalElement.textContent = `₹${total.toFixed(2)}`;
    localStorage.setItem('cart', JSON.stringify(cart));
}

// --- Function to fetch the catalog and render books ---
async function fetchAndRenderCatalog() {
    const bookList = document.getElementById('bookList');
    if (!bookList) return;

    bookList.innerHTML = '<p class="text-center text-gray-500">Loading catalog...</p>';

    try {
        const response = await fetch(CATALOG_API_ENDPOINT);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        booksData = await response.json();

        if (booksData.length === 0) {
            bookList.innerHTML = '<p class="text-center text-red-500">Catalog is empty or data error.</p>';
            return;
        }

        bookList.innerHTML = ''; // Clear loading message

        booksData.forEach(book => {
            // Ensure PRICE_INR is treated as a number
            const price = typeof book.PRICE_INR === 'number' ? book.PRICE_INR : parseFloat(book.PRICE_INR);
            
            const bookEl = document.createElement('div');
            bookEl.className = 'bg-white p-4 rounded-lg shadow-md flex flex-col justify-between';
            bookEl.innerHTML = `
                <img src="${book.COVER_URL || 'placeholder.jpg'}" alt="${book.TITLE_EN}" class="w-full h-48 object-cover mb-4 rounded-md">
                <h3 class="text-lg font-bold mb-1">${book.TITLE_EN}</h3>
                <p class="text-gray-600 text-sm mb-2">${book.AUTHOR}</p>
                <p class="text-xl font-semibold text-green-600 mb-3">₹${price.toFixed(2)}</p>
                <button onclick="addToCart('${book.BOOK_ID}')" class="bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition">Add to Cart</button>
            `;
            bookList.appendChild(bookEl);
        });
    } catch (error) {
        console.error('Error fetching catalog:', error);
        bookList.innerHTML = `<p class="text-center text-red-500">Failed to load catalog. API Error: ${error.message}</p>`;
    }
}

// --- Cart management functions ---
function addToCart(bookId) {
    const book = booksData.find(b => b.BOOK_ID === bookId);
    if (!book) return;
    
    // Use the potentially parsed price
    const price = typeof book.PRICE_INR === 'number' ? book.PRICE_INR : parseFloat(book.PRICE_INR);

    const existingItem = cart.find(item => item.bookId === bookId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            bookId: book.BOOK_ID,
            title: book.TITLE_EN,
            price: price,
            quantity: 1
        });
    }
    updateCart();
    alert(`${book.TITLE_EN} added to cart!`);
}

function removeFromCart(bookId) {
    const existingItem = cart.find(item => item.bookId === bookId);
    
    if (existingItem && existingItem.quantity > 1) {
        existingItem.quantity -= 1;
    } else {
        cart = cart.filter(item => item.bookId !== bookId);
    }
    updateCart();
}

function clearCart() {
    cart = [];
    updateCart();
    alert('Cart cleared.');
}

// --- Event Listeners and Navigation Setup (Protected Block) ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Load catalog and update cart display immediately
    if (document.getElementById('bookList')) {
        fetchAndRenderCatalog();
    }
    updateCart();

    try {
        // 2. Setup navigation links and sections
        const catalogLink = document.getElementById('navCatalog');
        const checkoutLink = document.getElementById('navCheckout');
        const homeSection = document.getElementById('homeSection');
        const checkoutSection = document.getElementById('checkoutSection');

        if (catalogLink && checkoutLink && homeSection && checkoutSection) {
            
            // Listener for the Home/Catalog button
            catalogLink.addEventListener('click', (e) => {
                e.preventDefault();
                homeSection.classList.remove('hidden');
                checkoutSection.classList.add('hidden');
            });

            // Listener for the Cart/Checkout button
            checkoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                homeSection.classList.add('hidden');
                checkoutSection.classList.remove('hidden');
                updateCart(); // Refresh cart display on checkout view
            });
        } else {
            console.warn("Navigation elements not fully found. Interaction will be limited.");
        }
    } catch (e) {
        // This catch block prevents a crash from stopping the rest of the script (like form submission)
        console.error("Critical Navigation Setup Failed:", e);
    }
});

// --- Order Submission Logic ---
document.addEventListener('submit', async (e) => {
    if (e.target.id === 'checkoutForm') {
        e.preventDefault();

        const customerPhone = document.getElementById('customerPhone')?.value;
        const deliveryAddress = document.getElementById('deliveryAddress')?.value;
        const cartTotalElement = document.getElementById('cartTotal');
        
        if (!cartTotalElement) {
             alert("Error: Cart total element not found.");
             return;
        }

        const cartTotalText = cartTotalElement.textContent.replace('₹', '').trim();
        const orderTotal = parseFloat(cartTotalText);
        
        if (cart.length === 0 || !customerPhone || !deliveryAddress || isNaN(orderTotal) || orderTotal === 0) {
            alert("Please fill out all details and ensure your cart is not empty.");
            return;
        }

        const orderData = {
            cart: cart,
            customerPhone: customerPhone,
            deliveryAddress: deliveryAddress,
            orderTotal: orderTotal
        };

        const submitButton = document.querySelector('#checkoutForm button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Processing...';
            submitButton.disabled = true;
        }

        try {
            // --- USING DEDICATED ORDER API ENDPOINT (POST) ---
            const response = await fetch(ORDER_API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8', 
                },
                body: JSON.stringify(orderData)
            });
            
            const result = await response.json();

            if (result.success) {
                alert(`Order placed successfully! Order ID: ${result.orderId}`);
                clearCart();
                document.getElementById('checkoutForm')?.reset();
                document.getElementById('navCatalog')?.click(); // Navigate back to catalog
            } else {
                alert(`Order Submission Failed: ${result.message}`);
                console.error('Server Error:', result.message);
            }

        } catch (error) {
            alert("Network error. Check your internet connection or the Apps Script doPost function.");
            console.error('Fetch Error:', error);
        } finally {
            if (submitButton) {
                submitButton.textContent = 'Place Order & Pay';
                submitButton.disabled = false;
            }
        }
    }
});