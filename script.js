// 1. Live API Endpoint from Google Apps Script
const API_ENDPOINT = "https://script.google.com/macros/s/AKfycbwUuBJ6-uRR8z4bbpPJoY71JXmhVEGPDU6XSwQF333thFLiw_987JzP2bVzLwm2s0lq/exec";

// DOM elements for control and display
const catalogContainer = document.getElementById('catalog-container');
const loadingIndicator = document.getElementById('loading-indicator');

/**
 * Creates the HTML structure for a single book card, implementing
 * the design guidelines for typography, spacing, and image aspect ratio.
 * * Design Guidelines Applied:
 * - Book Titles: lg to xl, serif, font-semibold (font-lora)
 * - Metadata/Labels: sm, sans-serif, text-gray-600
 * - Buttons/CTAs: base, sans-serif, font-semibold
 * - Spacing: p-6, gap-6 (Standard spacing for cards/grid)
 * - Cover Image: 3:4 aspect ratio, shadow-lg, rounded-lg
 * * @param {object} book - A single book object from the Google Sheet data.
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
                    class="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition duration-150" 
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
        // Show loading indicator
        loadingIndicator.style.display = 'block';
        
        const response = await fetch(API_ENDPOINT);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Data comes back as an array of book objects
        const books = await response.json();

        if (books.length === 0) {
            catalogContainer.innerHTML = '<p class="text-xl text-center text-gray-500 py-12">No books found in the catalog.</p>';
            return;
        }

        // Generate and insert HTML for all book cards
        const catalogHTML = books.map(createBookCard).join('');
        catalogContainer.innerHTML = catalogHTML;

    } catch (error) {
        console.error("Failed to fetch catalog data:", error);
        catalogContainer.innerHTML = `
            <p class="text-xl text-red-600 text-center py-12">Error loading catalog: Please check your API security settings and Google Sheet structure.</p>
        `;
    } finally {
        // Hide loading indicator after success or failure
        loadingIndicator.style.display = 'none';
    }
}

// Start the data fetching process when the page loads
document.addEventListener('DOMContentLoaded', fetchAndRenderCatalog);