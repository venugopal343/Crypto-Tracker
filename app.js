// API request options
const options = {
    method: 'GET',
    headers: { 
        accept: 'application/json', 
        'x-cg-demo-api-key': 'CG-mDVVqLm5xBDjvcVq523LnAmB' 
    },
};

// Show shimmer effect during loading
const showShimmer = () => document.querySelector('.shimmer-container').style.display = 'flex';

// Hide shimmer effect after loading
const hideShimmer = () => document.querySelector('.shimmer-container').style.display = 'none';

// State variables
let coins = []; // Array to store coin data
let currentPage = 1; // Current page number for pagination

// Initialize the page
const initializePage = async () => {
    await fetchCoins(currentPage);
    renderCoins(coins, currentPage, 25);
    updatePaginationControls(); // Ensure pagination controls are updated on load
};

// Fetch coins from API
const fetchCoins = async (page = 1) => {
    try {
        showShimmer(); // Show loading effect
        const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=25&page=${page}`, options);
        coins = await response.json();
    } catch (err) {
        console.error(err);
    } finally {
        hideShimmer(); // Hide loading effect
    }
    return coins;
};

// Retrieve favorites from localStorage
const getFavorites = () => JSON.parse(localStorage.getItem('favorites')) || [];

// Save favorites to localStorage
const saveFavorites = (favorites) => localStorage.setItem('favorites', JSON.stringify(favorites));

// Handle favorite icon click
const handleFavoriteClick = (coinId) => {
    const favorites = toggleFavorite(coinId);
    saveFavorites(favorites);
    renderCoins(coins, currentPage, 25);
};

// Toggle favorite status
const toggleFavorite = (coinId) => {
    let favorites = getFavorites();
    if (favorites.includes(coinId)) {
        favorites = favorites.filter(id => id !== coinId);
    } else {
        favorites.push(coinId);
    }
    return favorites;
};

// Render a single coin row
const renderCoins = (coinsToDisplay, page, itemsPerPage) => {
    const start = (page - 1) * itemsPerPage + 1;
    const favorites = getFavorites();
    const tableBody = document.querySelector('#crypto-table tbody');
    tableBody.innerHTML = '';

    coinsToDisplay.forEach((coin, index) => {
        const row = renderCoinRow(coin, index, start, favorites);
        attachRowEvents(row, coin.id);
        tableBody.appendChild(row);
    });
};

// Create a coin row
const renderCoinRow = (coin, index, start, favorites) => {
    const isFavorite = favorites.includes(coin.id);
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${start + index}</td>
        <td><img src="${coin.image}" alt="${coin.name}" width="24" height="24" /></td>
        <td>${coin.name}</td>
        <td>$${coin.current_price.toLocaleString()}</td>
        <td>$${coin.total_volume.toLocaleString()}</td>
        <td>$${coin.market_cap.toLocaleString()}</td>
        <td>
            <i class="fas fa-star favorite-icon ${isFavorite ? 'favorite' : ''}" data-id="${coin.id}"></i>
        </td>
    `;
    return row;
};

// Attach events to a coin row
const attachRowEvents = (row, coinId) => {
    row.addEventListener('click', (event) => {
        if (!event.target.classList.contains('favorite-icon')) {
            window.location.href = `coin.html?id=${coinId}`;
        }
    });
    row.querySelector('.favorite-icon').addEventListener('click', (event) => {
        event.stopPropagation();
        handleFavoriteClick(coinId);
    });
};

// Handle "Prev" button click
const handlePrevButtonClick = async () => {
    if (currentPage > 1) {
        currentPage--;
        await fetchCoins(currentPage);
        renderCoins(coins, currentPage, 25);
        updatePaginationControls();
    }
};

// Handle "Next" button click
const handleNextButtonClick = async () => {
    currentPage++;
    await fetchCoins(currentPage);
    renderCoins(coins, currentPage, 25);
    updatePaginationControls();
};

// Update the state of "Prev" and "Next" buttons
const updatePaginationControls = () => {
    document.querySelector('#prev-button').disabled = currentPage === 1;
    document.querySelector('#next-button').disabled = coins.length < 25;
};

// Debounce function
let debounceTimeout;
const debounce = (func, delay) => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(func, delay);
};

// Fetch and display search results
const fetchSearchResults = async (query) => {
    try {
        const response = await fetch(`https://api.coingecko.com/api/v3/search?query=${query}`, options);
        const data = await response.json();
        return data.coins;
    } catch (err) {
        console.error('Error fetching search results:', err);
        return [];
    }
};

// Show search results in the dialog
const showSearchResults = (results) => {
    const searchDialog = document.querySelector('#search-dialog');
    const resultsList = document.querySelector('#search-results');

    resultsList.innerHTML = '';
    if(results.length !==0){
        results.slice(0, 10).forEach(result => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <img src="${result.thumb}" alt="${result.name}" width="24" height="24" />
                <span>${result.name}</span>
            `;
            listItem.dataset.id = result.id; // Set the data-id attribute
            resultsList.appendChild(listItem);
        });
    }
    else{
        resultsList.innerHTML = '<li>No coin found.</li>';
    }

    // Attach click event to each list item
    resultsList.querySelectorAll('li').forEach(item => {
        item.addEventListener('click', (event) => {
            const coinId = event.currentTarget.dataset.id; // Retrieve the coin ID from data attribute
            console.log(coinId); // Debugging purpose
            window.location.href = `coin.html?id=${coinId}`;
        });
    });

    searchDialog.style.display = 'block';
};


// Close the search dialog
const closeSearchDialog = () => {
    const searchDialog = document.querySelector('#search-dialog');
    searchDialog.style.display = 'none';
};

// Handle search input with debounce
const handleSearchInput = () => {
    debounce(async () => {
        const searchTerm = document.querySelector('#search-box').value.trim();
        if (searchTerm) {
            const results = await fetchSearchResults(searchTerm);
            showSearchResults(results);
        } else {
            closeSearchDialog(); // Close dialog if search term is empty
        }
    }, 300);
};

// Event listeners for search and pagination
document.addEventListener('DOMContentLoaded', initializePage);
document.querySelector('#search-box').addEventListener('input', handleSearchInput);
document.querySelector('#search-icon').addEventListener('click', handleSearchInput);
document.querySelector('#close-dialog').addEventListener('click', closeSearchDialog);
document.querySelector('#prev-button').addEventListener('click', handlePrevButtonClick);
document.querySelector('#next-button').addEventListener('click', handleNextButtonClick);

// Sorting functions
// const sortCoinsByPrice = (order) => {
//     coins.sort((a, b) => order === 'asc' ? a.current_price - b.current_price : b.current_price - a.current_price);
//     renderCoins(coins, currentPage, 25);
// };

// const sortCoinsByVolume = (order) => {
//     coins.sort((a, b) => order === 'asc' ? a.total_volume - b.total_volume : b.total_volume - a.total_volume);
//     renderCoins(coins, currentPage, 25);
// };

// const sortCoinsByMarketCap = (order) => {
//     coins.sort((a, b) => order === 'asc' ? a.market_cap - b.market_cap : b.market_cap - a.market_cap);
//     renderCoins(coins, currentPage, 25);
// };

const sortCoinsByField = (field, order) => {
    coins.sort((a, b) => 
        order === 'asc' ? a[field] - b[field] : b[field] - a[field]
    );
    renderCoins(coins, currentPage, 25);
};


document.querySelector('#sort-price-asc').addEventListener('click', () => sortCoinsByField('current_price', 'asc'));
document.querySelector('#sort-price-desc').addEventListener('click', () => sortCoinsByField('current_price', 'desc'));
document.querySelector('#sort-volume-asc').addEventListener('click', () => sortCoinsByField('total_volume', 'asc'));
document.querySelector('#sort-volume-desc').addEventListener('click', () => sortCoinsByField('total_volume', 'desc'));
document.querySelector('#sort-market-asc').addEventListener('click', () => sortCoinsByField('market_cap', 'asc'));
document.querySelector('#sort-market-desc').addEventListener('click', () => sortCoinsByField('market_cap', 'desc'));

// document.querySelector('#sort-price-asc').addEventListener('click', () => sortCoinsByPrice('asc'));
// document.querySelector('#sort-price-desc').addEventListener('click', () => sortCoinsByPrice('desc'));
// document.querySelector('#sort-volume-asc').addEventListener('click', () => sortCoinsByVolume('asc'));
// document.querySelector('#sort-volume-desc').addEventListener('click', () => sortCoinsByVolume('desc'));
// document.querySelector('#sort-market-asc').addEventListener('click', () => sortCoinsByMarketCap('asc'));
// document.querySelector('#sort-market-desc').addEventListener('click', () => sortCoinsByMarketCap('desc'));
