// Compare Page JavaScript - SOLO DATOS REALES
// NO más datos mock o simulados

let compareList = [];
let allProducts = [];
let searchTimeout = null;

// Initialize compare page
async function initializeComparePage() {
    console.log('⚖️ Initializing compare page with REAL data only...');
    
    try {
        showLoadingState();
        
        // Load saved comparison list
        loadSavedComparison();
        
        // Load real products for search
        await loadRealProductsForSearch();
        
        // Setup event listeners
        setupEventListeners();
        
        // Display current comparison
        displayComparison();
        
        console.log('✅ Compare page loaded with real data');
        hideLoadingState();
        
    } catch (error) {
        console.error('Error initializing compare page:', error);
        showErrorState('Error cargando el comparador: ' + error.message);
        hideLoadingState();
    }
}

// Load saved comparison from localStorage
function loadSavedComparison() {
    compareList = getStoredData('compare-list', []);
    console.log(`📋 Loaded ${compareList.length} products from saved comparison`);
}

// Load real products for search functionality
async function loadRealProductsForSearch() {
    try {
        console.log('Loading REAL products for search...');
        
        const response = await fetch('/api/products');
        const data = await response.json();
        
        if (data.success && data.products && data.products.length > 0) {
            allProducts = data.products;
            console.log(`✅ Loaded ${allProducts.length} real products for search`);
        } else {
            console.log('No products available for search');
            allProducts = [];
            showEmptySearchState();
        }
        
    } catch (error) {
        console.error('Error loading products for search:', error);
        allProducts = [];
        showEmptySearchState();
    }
}

// Show empty state when no products are available for search
function showEmptySearchState() {
    const searchResults = document.getElementById('search-results');
    if (searchResults) {
        searchResults.innerHTML = `
            <div class="empty-search-state">
                <div class="empty-icon">🔍</div>
                <h3>Sin productos para buscar</h3>
                <p>Para usar el comparador, necesitas tener productos monitoreados en el sistema.</p>
                <button onclick="runScraping()" class="btn btn-primary">
                    🚀 Ejecutar Scraping Primero
                </button>
                <a href="/index.html" class="btn btn-secondary">
                    ← Volver al Dashboard
                </a>
            </div>
        `;
    }
}

// Search products based on real data
function searchProducts(query) {
    if (!query || query.trim().length < 2) {
        displaySearchResults([]);
        return;
    }
    
    if (allProducts.length === 0) {
        showEmptySearchState();
        return;
    }
    
    const searchTerm = query.toLowerCase().trim();
    const filteredProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        (product.store_name && product.store_name.toLowerCase().includes(searchTerm))
    ).slice(0, 10); // Limit to first 10 results
    
    displaySearchResults(filteredProducts);
}

// Display search results
function displaySearchResults(products) {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;
    
    if (products.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <p>No se encontraron productos para tu búsqueda</p>
            </div>
        `;
        return;
    }
    
    resultsContainer.innerHTML = products.map(product => {
        const isAlreadyInComparison = compareList.some(p => p.id === product.id);
        
        return `
            <div class="search-result-item">
                <div class="product-info">
                    <img src="${getProductImage(product.image_url, product.name)}" 
                         alt="${product.name}"
                         class="product-image"
                         onerror="this.src='${getDefaultProductImage()}'">
                    <div class="product-details">
                        <h4 class="product-name">${product.name}</h4>
                        <p class="product-store">
                            ${getStoreEmoji(product.store_name)} ${product.store_name || 'Tienda desconocida'}
                        </p>
                        <p class="product-price">${formatCurrency(product.current_price)}</p>
                    </div>
                </div>
                <div class="product-actions">
                    ${isAlreadyInComparison ? 
                        `<span class="already-added">✓ Ya está en comparación</span>` :
                        `<button onclick="addProductToComparison(${product.id})" class="btn btn-primary btn-sm">
                            Añadir a Comparación
                        </button>`
                    }
                </div>
            </div>
        `;
    }).join('');
}

// Add product to comparison
function addProductToComparison(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    // Check if already in comparison
    if (compareList.some(p => p.id === productId)) {
        showToast('Producto ya añadido', 'Este producto ya está en la comparación', 'warning');
        return;
    }
    
    // Check comparison limit
    if (compareList.length >= 5) {
        showToast('Límite alcanzado', 'Máximo 5 productos en comparación', 'warning');
        return;
    }
    
    compareList.push(product);
    saveComparison();
    displayComparison();
    
    // Update search results to reflect the change
    const currentSearch = document.getElementById('product-search').value;
    if (currentSearch.trim()) {
        searchProducts(currentSearch);
    }
    
    showToast('Producto añadido', `${product.name} añadido a la comparación`, 'success');
}

// Display current comparison
function displayComparison() {
    const comparisonContainer = document.getElementById('comparison-container');
    if (!comparisonContainer) return;
    
    if (compareList.length === 0) {
        showEmptyComparisonState();
        return;
    }
    
    // Show comparison grid
    comparisonContainer.innerHTML = `
        <div class="comparison-header">
            <h2>Comparando ${compareList.length} productos</h2>
            <div class="comparison-actions">
                <button onclick="exportComparison()" class="btn btn-secondary">
                    📊 Exportar Comparación
                </button>
                <button onclick="clearComparison()" class="btn btn-danger">
                    🗑️ Limpiar Todo
                </button>
            </div>
        </div>
        
        <div class="comparison-grid">
            ${compareList.map(product => renderProductCard(product)).join('')}
        </div>
        
        <div class="comparison-insights">
            ${generateComparisonInsights()}
        </div>
    `;
}

// Show empty state when no products in comparison
function showEmptyComparisonState() {
    const comparisonContainer = document.getElementById('comparison-container');
    if (comparisonContainer) {
        comparisonContainer.innerHTML = `
            <div class="empty-comparison-state">
                <div class="empty-icon">⚖️</div>
                <h2>Sin productos para comparar</h2>
                <p>Busca productos arriba y añádelos para compararlos lado a lado.</p>
                <div class="empty-help">
                    <h3>¿Cómo usar el comparador?</h3>
                    <ol>
                        <li>Busca productos usando el campo de búsqueda</li>
                        <li>Añade productos a la comparación (máximo 5)</li>
                        <li>Ve las diferencias de precio y características</li>
                        <li>Exporta los resultados si necesitas</li>
                    </ol>
                </div>
            </div>
        `;
    }
}

// Render individual product card
function renderProductCard(product) {
    const priceChange = getPriceChangeIndicator(product.current_price, product.previous_price);
    
    return `
        <div class="product-comparison-card">
            <div class="card-header">
                <button onclick="removeProductFromComparison(${product.id})" class="remove-btn" title="Eliminar de comparación">
                    ❌
                </button>
            </div>
            
            <div class="card-image">
                <img src="${getProductImage(product.image_url, product.name)}" 
                     alt="${product.name}"
                     onerror="this.src='${getDefaultProductImage()}'">
            </div>
            
            <div class="card-content">
                <h3 class="card-title">${product.name}</h3>
                
                <div class="card-store">
                    ${getStoreEmoji(product.store_name)} ${product.store_name || 'Tienda desconocida'}
                </div>
                
                <div class="card-price-section">
                    <div class="current-price">
                        ${formatCurrency(product.current_price)}
                    </div>
                    ${product.previous_price && product.previous_price !== product.current_price ? 
                        `<div class="price-change">
                            <span class="old-price">${formatCurrency(product.previous_price)}</span>
                            ${priceChange}
                        </div>` : ''
                    }
                </div>
                
                <div class="card-details">
                    <div class="detail-row">
                        <span class="label">Estado:</span>
                        <span class="value availability ${product.is_available ? 'available' : 'unavailable'}">
                            ${product.is_available ? '✅ Disponible' : '❌ Sin Stock'}
                        </span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="label">Agregado:</span>
                        <span class="value">${formatDate(product.created_at)}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="label">Actualizado:</span>
                        <span class="value">${formatDate(product.last_updated)}</span>
                    </div>
                </div>
                
                <div class="card-actions">
                    <a href="/product.html?id=${product.id}" class="btn btn-secondary" style="font-size: 0.875rem;">
                        👁️ Ver Detalles
                    </a>
                    <a href="${product.url}" target="_blank" class="btn btn-primary" style="font-size: 0.875rem;">
                        🔗 Ver en Tienda
                    </a>
                </div>
            </div>
        </div>
    `;
}

// Remove product from comparison
function removeProductFromComparison(productId) {
    compareList = compareList.filter(p => p.id !== productId);
    saveComparison();
    displayComparison();
    
    // Update search results if there's an active search
    const currentSearch = document.getElementById('product-search').value;
    if (currentSearch.trim()) {
        searchProducts(currentSearch);
    }
    
    showToast('Producto eliminado', 'Producto eliminado de la comparación', 'info');
}

// Generate comparison insights based on real data
function generateComparisonInsights() {
    if (compareList.length < 2) {
        return `
            <div class="insights-section">
                <h3>💡 Insights de Comparación</h3>
                <p>Añade al menos 2 productos para obtener insights de comparación.</p>
            </div>
        `;
    }
    
    const prices = compareList.map(p => parseFloat(p.current_price) || 0);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    
    const cheapestProduct = compareList.find(p => parseFloat(p.current_price) === minPrice);
    const mostExpensiveProduct = compareList.find(p => parseFloat(p.current_price) === maxPrice);
    
    const priceDifference = maxPrice - minPrice;
    const priceVariation = ((priceDifference / minPrice) * 100).toFixed(1);
    
    // Store distribution
    const storeCount = {};
    compareList.forEach(p => {
        const storeName = p.store_name || 'Desconocida';
        storeCount[storeName] = (storeCount[storeName] || 0) + 1;
    });
    
    // Availability analysis
    const availableCount = compareList.filter(p => p.is_available).length;
    const availabilityPercentage = ((availableCount / compareList.length) * 100).toFixed(0);
    
    return `
        <div class="insights-section">
            <h3>💡 Insights de Comparación</h3>
            
            <div class="insights-grid">
                <div class="insight-card">
                    <div class="insight-header">
                        <span class="insight-icon">💰</span>
                        <h4>Análisis de Precios</h4>
                    </div>
                    <div class="insight-content">
                        <p><strong>Más barato:</strong> ${cheapestProduct.name} - ${formatCurrency(minPrice)}</p>
                        <p><strong>Más caro:</strong> ${mostExpensiveProduct.name} - ${formatCurrency(maxPrice)}</p>
                        <p><strong>Diferencia:</strong> ${formatCurrency(priceDifference)} (${priceVariation}% más caro)</p>
                        <p><strong>Precio promedio:</strong> ${formatCurrency(avgPrice)}</p>
                    </div>
                </div>
                
                <div class="insight-card">
                    <div class="insight-header">
                        <span class="insight-icon">🏪</span>
                        <h4>Distribución por Tienda</h4>
                    </div>
                    <div class="insight-content">
                        ${Object.entries(storeCount).map(([store, count]) => 
                            `<p><strong>${store}:</strong> ${count} producto${count > 1 ? 's' : ''}</p>`
                        ).join('')}
                    </div>
                </div>
                
                <div class="insight-card">
                    <div class="insight-header">
                        <span class="insight-icon">📊</span>
                        <h4>Disponibilidad</h4>
                    </div>
                    <div class="insight-content">
                        <p><strong>Disponibles:</strong> ${availableCount} de ${compareList.length} productos</p>
                        <p><strong>Porcentaje:</strong> ${availabilityPercentage}% disponible</p>
                        ${availabilityPercentage < 100 ? 
                            '<p class="warning">⚠️ Algunos productos no están disponibles</p>' : 
                            '<p class="success">✅ Todos los productos están disponibles</p>'
                        }
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Export comparison
function exportComparison() {
    if (compareList.length === 0) {
        showToast('Sin datos', 'No hay productos para exportar', 'warning');
        return;
    }
    
    try {
        const comparisonData = {
            exported_at: new Date().toISOString(),
            products: compareList,
            summary: {
                total_products: compareList.length,
                price_range: {
                    min: Math.min(...compareList.map(p => parseFloat(p.current_price) || 0)),
                    max: Math.max(...compareList.map(p => parseFloat(p.current_price) || 0))
                },
                stores: [...new Set(compareList.map(p => p.store_name))]
            }
        };
        
        const dataStr = JSON.stringify(comparisonData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const a = document.createElement('a');
        a.href = URL.createObjectURL(dataBlob);
        a.download = `producto-comparison-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        showToast('Exportación exitosa', 'Comparación exportada como JSON', 'success');
        
    } catch (error) {
        console.error('Error exporting comparison:', error);
        showToast('Error al exportar', 'No se pudo exportar la comparación', 'error');
    }
}

// Clear comparison
function clearComparison() {
    if (compareList.length === 0) {
        showToast('Sin datos', 'No hay productos para limpiar', 'warning');
        return;
    }
    
    if (confirm('¿Estás seguro de que quieres eliminar todos los productos de la comparación?')) {
        compareList = [];
        saveComparison();
        displayComparison();
        
        // Clear search results
        document.getElementById('search-results').innerHTML = '';
        document.getElementById('product-search').value = '';
        
        showToast('Comparación limpiada', 'Todos los productos han sido eliminados', 'info');
    }
}

// Save comparison to localStorage
function saveComparison() {
    setStoredData('compare-list', compareList);
}

// Manual scraping function for compare page
async function runScraping() {
    try {
        showToast('Scraping iniciado', 'Ejecutando scraping para cargar productos...', 'info');
        
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
            showToast('Scraping completado', `${result.totalProducts || 0} productos procesados`, 'success');
            
            // Reload products for search after successful scraping
            setTimeout(async () => {
                await loadRealProductsForSearch();
            }, 2000);
            
        } else {
            throw new Error(result.error || 'Error desconocido en el scraping');
        }
        
    } catch (error) {
        console.error('Scraping error:', error);
        showToast('Error en scraping', error.message, 'error');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('product-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchProducts(e.target.value);
            }, 300);
        });
    }
}

// Utility functions
function getProductImage(imageUrl, productName) {
    if (imageUrl && imageUrl.trim() !== '' && imageUrl !== 'null') {
        return imageUrl;
    }
    return getDefaultProductImage();
}

function getDefaultProductImage() {
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23f0f0f0" stroke="%23ddd"/><text x="100" y="110" text-anchor="middle" font-size="48" fill="%23666">📦</text></svg>`;
}

function getStoreEmoji(storeName) {
    if (!storeName) return '🏪';
    
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
    
    if (previous === 0 || previous === current) return '';
    
    const difference = current - previous;
    const percentage = ((difference / previous) * 100).toFixed(1);
    
    if (difference > 0) {
        return `<span class="price-increase">↗ +${Math.abs(percentage)}%</span>`;
    } else {
        return `<span class="price-decrease">↘ -${Math.abs(percentage)}%</span>`;
    }
}

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
        day: 'numeric'
    });
}

// Storage utilities
function getStoredData(key, defaultValue) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('Error loading stored data:', error);
        return defaultValue;
    }
}

function setStoredData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Error saving data to storage:', error);
    }
}

// Loading states
function showLoadingState() {
    document.body.classList.add('loading');
    
    const mainContent = document.querySelector('main');
    if (mainContent) {
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner large"></div>
                <p>Cargando productos reales para comparación...</p>
            </div>
        `;
        mainContent.appendChild(loadingOverlay);
    }
}

function hideLoadingState() {
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
                <div class="error-actions">
                    <button onclick="location.reload()" class="btn btn-primary btn-large">
                        🔄 Reintentar
                    </button>
                    <a href="/index.html" class="btn btn-secondary btn-large">
                        ← Volver al Dashboard
                    </a>
                </div>
            </div>
        `;
    }
}

// Toast notifications
function showToast(title, message, type = 'info') {
    if (typeof window.showToast === 'function') {
        window.showToast(title, message, type);
    } else {
        console.log(`${type.toUpperCase()}: ${title} - ${message}`);
    }
}

// Global functions for onclick handlers
window.addProductToComparison = addProductToComparison;
window.removeProductFromComparison = removeProductFromComparison;
window.exportComparison = exportComparison;
window.clearComparison = clearComparison;
window.runScraping = runScraping;

// No more mock data generation
// No more fake products
// No more simulated search results
// Only real data from APIs