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
        // --- USING DEDICATED CATALOG API ENDPOINT (GET) ---
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
            const bookEl = document.createElement('div');
            bookEl.className = 'bg-white p-4 rounded-lg shadow-md flex flex-col justify-between';
            bookEl.innerHTML = `
                <img src="${book.COVER_URL || 'placeholder.jpg'}" alt="${book.TITLE_EN}" class="w-full h-48 object-cover mb-4 rounded-md">
                <h3 class="text-lg font-bold mb-1">${book.TITLE_EN}</h3>
                <p class="text-gray-600 text-sm mb-2">${book.AUTHOR}</p>
                <p class="text-xl font-semibold text-green-600 mb-3">₹${book.PRICE_INR.toFixed(2)}</p>
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

    const existingItem = cart.find(item => item.bookId === bookId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            bookId: book.BOOK_ID,
            title: book.TITLE_EN,
            price: book.PRICE_INR,
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

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Check if the current page is the catalog page
    if (document.getElementById('bookList')) {
        fetchAndRenderCatalog();
    }
    updateCart();

    // Setup navigation
    const catalogLink = document.getElementById('navCatalog');
    const checkoutLink = document.getElementById('navCheckout');
    const homeSection = document.getElementById('homeSection');
    const checkoutSection = document.getElementById('checkoutSection');

    if (catalogLink && checkoutLink && homeSection && checkoutSection) {
        catalogLink.addEventListener('click', (e) => {
            e.preventDefault();
            homeSection.classList.remove('hidden');
            checkoutSection.classList.add('hidden');
        });

        checkoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            homeSection.classList.add('hidden');
            checkoutSection.classList.remove('hidden');
            // Refresh cart display on checkout view
            updateCart();
        });
    }
});

// --- Order Submission Logic ---
document.addEventListener('submit', async (e) => {
    if (e.target.id === 'checkoutForm') {
        e.preventDefault();

        const customerPhone = document.getElementById('customerPhone').value;
        const deliveryAddress = document.getElementById('deliveryAddress').value;
        const orderTotal = parseFloat(document.getElementById('cartTotal').textContent.replace('₹', ''));
        
        if (cart.length === 0 || !customerPhone || !deliveryAddress || orderTotal === 0) {
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
        submitButton.textContent = 'Processing...';
        submitButton.disabled = true;

        try {
            // --- USING DEDICATED ORDER API ENDPOINT (POST) ---
            const response = await fetch(ORDER_API_ENDPOINT, {
                method: 'POST',
                // This header is crucial for Apps Script to correctly parse the JSON body
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8', 
                },
                body: JSON.stringify(orderData)
            });
            
            const result = await response.json();

            if (result.success) {
                alert(`Order placed successfully! Order ID: ${result.orderId}`);
                clearCart();
                document.getElementById('checkoutForm').reset();
                document.getElementById('navCatalog').click(); // Navigate back to catalog
            } else {
                alert(`Order Submission Failed: ${result.message}`);
                console.error('Server Error:', result.message);
            }

        } catch (error) {
            // This is where the old "Network error" came from. This should now be fixed!
            alert("Network error. Please check your internet connection.");
            console.error('Fetch Error:', error);
        } finally {
            submitButton.textContent = 'Place Order & Pay';
            submitButton.disabled = false;
        }
    }
});