// Dashboard JavaScript - SOLO DATOS REALES
// NO más datos mock o simulados

// Global state
let currentProducts = [];
let currentFilters = {};
let currentSort = { field: 'updated_at', order: 'desc' };
let currentPage = 1;
let itemsPerPage = 50;
let stores = [];
let isLoading = false;

// Initialize dashboard
async function initializeDashboard() {
    console.log('🏠 Initializing dashboard with REAL data only...');
    
    try {
        showLoadingState();
        
        // Load only real data from APIs
        await loadRealStores();
        await loadRealProducts();
        await loadRealStats();
        
        // Setup event listeners
        setupEventListeners();
        
        // Update last refresh time
        updateLastRefreshTime();
        
        console.log('✅ Dashboard initialized with real data');
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showErrorState('Error cargando el dashboard: ' + error.message);
    } finally {
        hideLoadingState();
    }
}

// Load real stores from API
async function loadRealStores() {
    try {
        // Try to load stores from API - this would be a real endpoint
        // For now, return empty since we don't have real store data yet
        stores = [];
        console.log('Stores loaded:', stores.length);
        
    } catch (error) {
        console.error('Error loading stores:', error);
        stores = [];
    }
}

// Load real products from API
async function loadRealProducts() {
    try {
        console.log('Loading REAL products from API...');
        
        const response = await fetch('/api/products');
        const data = await response.json();
        
        if (data.success && data.products && data.products.length > 0) {
            currentProducts = data.products;
            console.log(`✅ Loaded ${currentProducts.length} real products`);
            displayProducts(currentProducts);
            updateProductCount(currentProducts.length);
        } else {
            console.log('No products found in database');
            currentProducts = [];
            showEmptyProductsState();
        }
        
    } catch (error) {
        console.error('Error loading products:', error);
        currentProducts = [];
        showEmptyProductsState();
    }
}

// Load real stats from API
async function loadRealStats() {
    try {
        console.log('Loading REAL stats from API...');
        
        const response = await fetch('/api/analytics');
        const data = await response.json();
        
        if (data.overview) {
            updateStatsDisplay({
                totalProducts: data.overview.totalProducts || 0,
                avgPrice: data.overview.avgPrice || 0,
                priceChanges: data.overview.totalPriceChanges || 0,
                activeStores: data.overview.activeStores || 0
            });
        } else {
            // No real stats available
            updateStatsDisplay({
                totalProducts: 0,
                avgPrice: 0,
                priceChanges: 0,
                activeStores: 0
            });
        }
        
    } catch (error) {
        console.error('Error loading stats:', error);
        updateStatsDisplay({
            totalProducts: 0,
            avgPrice: 0,
            priceChanges: 0,
            activeStores: 0
        });
    }
}

// Show empty state when no products exist
function showEmptyProductsState() {
    const tbody = document.getElementById('products-tbody');
    const cardsContainer = document.getElementById('products-cards');
    
    const emptyStateHTML = `
        <div class="empty-state">
            <div class="empty-icon">📦</div>
            <h3>No hay productos monitoreados aún</h3>
            <p>Para comenzar a monitorear productos de TiendaNube, ejecuta el scraping manual.</p>
            <button onclick="runManualScraping()" class="btn btn-primary btn-large">
                🚀 Ejecutar Scraping Ahora
            </button>
            <div class="empty-help">
                <p><strong>¿Qué hace el scraping?</strong></p>
                <ul>
                    <li>Extrae productos de 8 tiendas de TiendaNube</li>
                    <li>Monitorea precios y cambios</li>
                    <li>Detecta productos nuevos</li>
                    <li>Envía notificaciones de cambios importantes</li>
                </ul>
            </div>
        </div>
    `;
    
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="padding: 0; border: none;">
                    ${emptyStateHTML}
                </td>
            </tr>
        `;
    }
    
    if (cardsContainer) {
        cardsContainer.innerHTML = emptyStateHTML;
    }
    
    // Hide filters when empty
    const filtersSection = document.querySelector('.filters-section');
    if (filtersSection) {
        filtersSection.style.display = 'none';
    }
}

// Display real products in table/cards
function displayProducts(products) {
    if (!products || products.length === 0) {
        showEmptyProductsState();
        return;
    }
    
    // Show filters when we have products
    const filtersSection = document.querySelector('.filters-section');
    if (filtersSection) {
        filtersSection.style.display = 'block';
    }
    
    // Apply current filters and sorting
    const filteredProducts = applyFiltersAndSort(products);
    
    // Paginate results
    const paginatedProducts = paginateProducts(filteredProducts);
    
    // Render in current view mode
    const viewMode = document.querySelector('.view-toggle.active')?.dataset.view || 'table';
    
    if (viewMode === 'table') {
        displayProductsTable(paginatedProducts);
    } else {
        displayProductsCards(paginatedProducts);
    }
    
    // Update pagination
    updatePagination(filteredProducts.length);
}

// Display products in table format
function displayProductsTable(products) {
    const tbody = document.getElementById('products-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = products.map(product => `
        <tr>
            <td>
                <div class="product-info">
                    <img src="${getProductImage(product.image_url, product.name)}" 
                         alt="${product.name}"
                         class="product-image"
                         onerror="this.src='${getDefaultProductImage()}'">
                    <div class="product-details">
                        <div class="product-name">${product.name}</div>
                        <div class="product-url">
                            <a href="${product.url}" target="_blank" class="store-link">
                                ${getStoreEmoji(product.store_name)} ${product.store_name}
                            </a>
                        </div>
                    </div>
                </div>
            </td>
            <td>
                <div class="price-display">
                    <span class="current-price">${formatCurrency(product.current_price)}</span>
                    ${product.previous_price && product.previous_price !== product.current_price ? 
                        `<div class="price-change">
                            <span class="old-price">${formatCurrency(product.previous_price)}</span>
                            ${getPriceChangeIndicator(product.current_price, product.previous_price)}
                        </div>` : ''
                    }
                </div>
            </td>
            <td>
                <span class="availability-badge ${product.is_available ? 'available' : 'unavailable'}">
                    ${product.is_available ? '✅ Disponible' : '❌ Sin Stock'}
                </span>
            </td>
            <td>
                <span class="date-text">${formatDate(product.created_at)}</span>
            </td>
            <td>
                <span class="date-text">${formatDate(product.last_updated)}</span>
            </td>
            <td>
                <div class="actions">
                    <button class="btn btn-sm btn-primary" onclick="viewProduct(${product.id})" title="Ver detalles">
                        👁️
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="openProductUrl('${product.url}')" title="Ver en tienda">
                        🔗
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Display products in cards format
function displayProductsCards(products) {
    const container = document.getElementById('products-cards');
    if (!container) return;
    
    container.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-card-image">
                <img src="${getProductImage(product.image_url, product.name)}" 
                     alt="${product.name}"
                     onerror="this.src='${getDefaultProductImage()}'">
            </div>
            <div class="product-card-content">
                <h3 class="product-card-title">${product.name}</h3>
                <div class="product-card-store">
                    ${getStoreEmoji(product.store_name)} ${product.store_name}
                </div>
                <div class="product-card-price">
                    <span class="current-price">${formatCurrency(product.current_price)}</span>
                    ${product.previous_price && product.previous_price !== product.current_price ? 
                        `<div class="price-change">
                            ${getPriceChangeIndicator(product.current_price, product.previous_price)}
                        </div>` : ''
                    }
                </div>
                <div class="product-card-status">
                    <span class="availability-badge ${product.is_available ? 'available' : 'unavailable'}">
                        ${product.is_available ? '✅ Disponible' : '❌ Sin Stock'}
                    </span>
                </div>
                <div class="product-card-actions">
                    <button class="btn btn-primary" onclick="viewProduct(${product.id})">
                        Ver Detalles
                    </button>
                    <button class="btn btn-secondary" onclick="openProductUrl('${product.url}')">
                        Ver en Tienda
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Update stats display with real data
function updateStatsDisplay(stats) {
    const elements = {
        totalProducts: document.getElementById('total-products'),
        avgPrice: document.getElementById('avg-price'),
        priceChanges: document.getElementById('price-changes'),
        activeStores: document.getElementById('active-stores')
    };
    
    if (elements.totalProducts) {
        elements.totalProducts.textContent = stats.totalProducts.toLocaleString();
    }
    
    if (elements.avgPrice) {
        elements.avgPrice.textContent = formatCurrency(stats.avgPrice);
    }
    
    if (elements.priceChanges) {
        elements.priceChanges.textContent = stats.priceChanges.toLocaleString();
    }
    
    if (elements.activeStores) {
        elements.activeStores.textContent = stats.activeStores.toString();
    }
}

// Update product count display
function updateProductCount(count) {
    const countElement = document.getElementById('products-count');
    if (countElement) {
        countElement.textContent = `${count.toLocaleString()} productos`;
    }
}

// Manual scraping function
async function runManualScraping() {
    const button = document.querySelector('button[onclick*="runManualScraping"]');
    const originalText = button ? button.innerHTML : '';
    
    try {
        if (button) {
            button.disabled = true;
            button.innerHTML = `
                <span class="loading-spinner"></span>
                Ejecutando scraping...
            `;
        }
        
        showToast('Scraping', 'Iniciando scraping manual...', 'info');
        
        const response = await fetch('/api/scrape', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                test: false,
                notify: true
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Éxito', `Scraping completado: ${result.totalProducts || 0} productos procesados`, 'success');
            
            // Reload data after successful scraping
            setTimeout(async () => {
                await loadRealProducts();
                await loadRealStats();
            }, 2000);
            
        } else {
            throw new Error(result.error || 'Error desconocido en el scraping');
        }
        
    } catch (error) {
        console.error('Scraping error:', error);
        showToast('Error', `Error en scraping: ${error.message}`, 'error');
    } finally {
        if (button) {
            button.disabled = false;
            button.innerHTML = originalText;
        }
    }
}

// Product actions
function viewProduct(productId) {
    window.location.href = `/product.html?id=${productId}`;
}

function openProductUrl(url) {
    if (url) {
        window.open(url, '_blank');
    }
}

// Utility functions for product display
function getProductImage(imageUrl, productName) {
    if (imageUrl && imageUrl.trim() !== '' && imageUrl !== 'null') {
        return imageUrl;
    }
    return getDefaultProductImage();
}

function getDefaultProductImage() {
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><rect width="60" height="60" fill="%23f0f0f0" stroke="%23ddd"/><text x="30" y="35" text-anchor="middle" font-size="20" fill="%23666">📦</text></svg>`;
}

function getStoreEmoji(storeName) {
    const emojiMap = {
        'Shiva Home': '🏠',
        'Bazar Nuba': '🛍️',
        'Nimba': '🎨',
        'Vienna Hogar': '🪑',
        'Magnolias Deco': '🌸',
        'Duvet': '🛏️',
        'Ganga Home': '💰',
        'Binah Deco': '✨'
    };
    return emojiMap[storeName] || '🏪';
}

function getPriceChangeIndicator(currentPrice, previousPrice) {
    const current = parseFloat(currentPrice) || 0;
    const previous = parseFloat(previousPrice) || 0;
    
    if (previous === 0) return '';
    
    const difference = current - previous;
    const percentage = ((difference / previous) * 100).toFixed(1);
    
    if (Math.abs(difference) < 1) {
        return '<span class="price-neutral">→ Sin cambios</span>';
    } else if (difference > 0) {
        return `<span class="price-increase">↗ +${Math.abs(percentage)}%</span>`;
    } else {
        return `<span class="price-decrease">↘ -${Math.abs(percentage)}%</span>`;
    }
}

// Loading states
function showLoadingState() {
    isLoading = true;
    document.body.classList.add('loading');
    
    const mainContent = document.querySelector('main');
    if (mainContent) {
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner large"></div>
                <p>Cargando datos reales del sistema...</p>
            </div>
        `;
        mainContent.appendChild(loadingOverlay);
    }
}

function hideLoadingState() {
    isLoading = false;
    document.body.classList.remove('loading');
    
    const loadingOverlay = document.querySelector('.loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
}

// Error state
function showErrorState(message) {
    const mainContent = document.querySelector('main');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="error-state">
                <div class="error-icon">❌</div>
                <h2>Error de Conexión</h2>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn btn-primary btn-large">
                    🔄 Reintentar
                </button>
            </div>
        `;
    }
}

// Filter and sort functions (simplified - only work with real data)
function applyFiltersAndSort(products) {
    let filtered = [...products];
    
    // Apply filters
    if (currentFilters.store) {
        filtered = filtered.filter(p => p.store_id === parseInt(currentFilters.store));
    }
    
    if (currentFilters.available !== undefined) {
        filtered = filtered.filter(p => p.is_available === currentFilters.available);
    }
    
    if (currentFilters.minPrice) {
        filtered = filtered.filter(p => parseFloat(p.current_price) >= currentFilters.minPrice);
    }
    
    if (currentFilters.maxPrice) {
        filtered = filtered.filter(p => parseFloat(p.current_price) <= currentFilters.maxPrice);
    }
    
    if (currentFilters.search) {
        const searchTerm = currentFilters.search.toLowerCase();
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            p.store_name.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
        let aVal = a[currentSort.field];
        let bVal = b[currentSort.field];
        
        // Handle different data types
        if (currentSort.field.includes('price')) {
            aVal = parseFloat(aVal) || 0;
            bVal = parseFloat(bVal) || 0;
        } else if (currentSort.field.includes('date') || currentSort.field.includes('updated')) {
            aVal = new Date(aVal);
            bVal = new Date(bVal);
        }
        
        if (currentSort.order === 'desc') {
            return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        } else {
            return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        }
    });
    
    return filtered;
}

// Pagination
function paginateProducts(products) {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return products.slice(startIndex, startIndex + itemsPerPage);
}

function updatePagination(totalProducts) {
    const totalPages = Math.ceil(totalProducts / itemsPerPage);
    const paginationElement = document.getElementById('pagination');
    
    if (!paginationElement || totalPages <= 1) {
        if (paginationElement) paginationElement.style.display = 'none';
        return;
    }
    
    paginationElement.style.display = 'flex';
    paginationElement.innerHTML = `
        <button onclick="changePage(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>
            ← Anterior
        </button>
        <span>Página ${currentPage} de ${totalPages}</span>
        <button onclick="changePage(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>
            Siguiente →
        </button>
    `;
}

function changePage(page) {
    const totalPages = Math.ceil(currentProducts.length / itemsPerPage);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        displayProducts(currentProducts);
    }
}

// Event listeners setup
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            currentFilters.search = e.target.value;
            currentPage = 1;
            displayProducts(currentProducts);
        }, 300));
    }
    
    // Filter inputs
    const storeFilter = document.getElementById('store-filter');
    if (storeFilter) {
        storeFilter.addEventListener('change', (e) => {
            currentFilters.store = e.target.value || null;
            currentPage = 1;
            displayProducts(currentProducts);
        });
    }
    
    // View toggle buttons
    const viewButtons = document.querySelectorAll('.view-toggle');
    viewButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            viewButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            displayProducts(currentProducts);
        });
    });
    
    // Refresh button
    const refreshButton = document.getElementById('refresh-button');
    if (refreshButton) {
        refreshButton.addEventListener('click', async () => {
            await loadRealProducts();
            await loadRealStats();
            showToast('Actualizado', 'Datos actualizados desde la base de datos', 'success');
        });
    }
}

// Utility functions
function formatCurrency(amount) {
    const num = parseFloat(amount) || 0;
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0
    }).format(num);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function updateLastRefreshTime() {
    const updateTimeElement = document.getElementById('update-time');
    if (updateTimeElement) {
        const now = new Date();
        updateTimeElement.textContent = now.toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Global functions for onclick handlers
window.viewProduct = viewProduct;
window.openProductUrl = openProductUrl;
window.runManualScraping = runManualScraping;
window.changePage = changePage;

// Toast notifications (keep existing implementation)
window.showToast = window.showToast || function(title, message, type = 'info') {
    console.log(`${type.toUpperCase()}: ${title} - ${message}`);
};

// Auto-refresh removed - only manual refresh now
// No more fake data generation
// No more setTimeout simulations