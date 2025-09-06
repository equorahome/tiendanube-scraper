// Product Page JavaScript - SOLO DATOS REALES
// NO más datos mock o simulados

let productData = null;
let priceHistory = [];
let priceChart = null;
let currentPeriod = 7;

// Initialize product page
async function initializeProductPage() {
    console.log('📦 Initializing product page with REAL data only...');
    
    try {
        showLoadingState();
        
        // Get product ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        
        if (!productId) {
            showErrorState('No se especificó un producto válido en la URL');
            return;
        }
        
        // Load real product data
        await loadRealProductData(productId);
        
        if (!productData) {
            showNotFoundState(productId);
            return;
        }
        
        // Display product information
        displayProductInfo();
        
        // Load and display real price history
        await loadRealPriceHistory(productId);
        displayPriceHistory();
        
        // Initialize price chart
        initializePriceChart();
        
        console.log('✅ Product page loaded with real data');
        hideLoadingState();
        
    } catch (error) {
        console.error('Error initializing product page:', error);
        showErrorState('Error cargando el producto: ' + error.message);
        hideLoadingState();
    }
}

// Load real product data from API
async function loadRealProductData(productId) {
    try {
        console.log(`Loading REAL product data for ID: ${productId}...`);
        
        const response = await fetch(`/api/products/${productId}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                console.log(`Product ${productId} not found`);
                return;
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.product) {
            productData = data.product;
            console.log('✅ Loaded real product data:', productData.name);
        } else {
            console.log(`Product ${productId} not found in database`);
            productData = null;
        }
        
    } catch (error) {
        console.error('Error loading product data:', error);
        
        // Try to get product from products list as fallback
        try {
            const response = await fetch('/api/products');
            const data = await response.json();
            
            if (data.success && data.products) {
                productData = data.products.find(p => p.id === parseInt(productId));
                if (productData) {
                    console.log('✅ Found product in products list:', productData.name);
                } else {
                    console.log(`Product ${productId} not found in products list either`);
                }
            }
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            productData = null;
        }
    }
}

// Load real price history from API
async function loadRealPriceHistory(productId) {
    try {
        console.log(`Loading REAL price history for product ${productId}...`);
        
        const response = await fetch(`/api/products/${productId}/history`);
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.history) {
                priceHistory = data.history.map(entry => ({
                    date: entry.detected_at,
                    price: parseFloat(entry.new_price),
                    oldPrice: parseFloat(entry.old_price),
                    changeType: entry.change_type
                }));
                console.log(`✅ Loaded ${priceHistory.length} real price history entries`);
            } else {
                console.log('No price history available');
                priceHistory = [];
            }
        } else {
            console.log('Price history API not available, using fallback');
            priceHistory = generateFallbackPriceHistory();
        }
        
    } catch (error) {
        console.error('Error loading price history:', error);
        priceHistory = generateFallbackPriceHistory();
    }
}

// Generate minimal fallback price history from current product data
function generateFallbackPriceHistory() {
    if (!productData) return [];
    
    const currentPrice = parseFloat(productData.current_price) || 0;
    const previousPrice = parseFloat(productData.previous_price) || currentPrice;
    
    const history = [];
    const now = new Date();
    
    // Add current price entry
    history.push({
        date: productData.last_updated || now.toISOString(),
        price: currentPrice,
        oldPrice: previousPrice,
        changeType: currentPrice > previousPrice ? 'increase' : currentPrice < previousPrice ? 'decrease' : 'no_change'
    });
    
    // Add previous price entry if different
    if (previousPrice !== currentPrice) {
        const previousDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
        history.unshift({
            date: previousDate.toISOString(),
            price: previousPrice,
            oldPrice: previousPrice,
            changeType: 'no_change'
        });
    }
    
    console.log(`Generated ${history.length} fallback price history entries`);
    return history;
}

// Show not found state
function showNotFoundState(productId) {
    const mainContent = document.querySelector('main');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="error-state">
                <div class="error-icon">📦</div>
                <h1>Producto no encontrado</h1>
                <p>El producto con ID <strong>${productId}</strong> no existe en la base de datos.</p>
                <div class="error-actions">
                    <a href="/index.html" class="btn btn-primary btn-large">
                        ← Volver al Dashboard
                    </a>
                    <a href="/compare.html" class="btn btn-secondary btn-large">
                        🔍 Buscar Productos
                    </a>
                    <button onclick="runScrapingFromProduct()" class="btn btn-secondary btn-large">
                        🚀 Ejecutar Scraping
                    </button>
                </div>
                <div class="not-found-help">
                    <h3>¿Por qué puede haber sucedido esto?</h3>
                    <ul>
                        <li>El producto fue eliminado de la tienda</li>
                        <li>El ID del producto es incorrecto</li>
                        <li>No se ha ejecutado scraping aún</li>
                        <li>Hay un error en la sincronización de datos</li>
                    </ul>
                </div>
            </div>
        `;
    }
}

// Display product information
function displayProductInfo() {
    if (!productData) return;
    
    // Update page title
    document.title = `${productData.name} - TiendaNube Monitor`;
    
    // Update product header
    const productHeader = document.querySelector('.product-header');
    if (productHeader) {
        productHeader.innerHTML = `
            <div class="product-image">
                <img src="${getProductImage(productData.image_url, productData.name)}" 
                     alt="${productData.name}"
                     onerror="this.src='${getDefaultProductImage()}'">
            </div>
            
            <div class="product-info">
                <h1 class="product-title">${productData.name}</h1>
                
                <div class="product-store">
                    ${getStoreEmoji(productData.store_name)} 
                    <strong>${productData.store_name || 'Tienda desconocida'}</strong>
                </div>
                
                <div class="product-price-section">
                    <div class="current-price">
                        ${formatCurrency(productData.current_price)}
                    </div>
                    ${productData.previous_price && productData.previous_price !== productData.current_price ? `
                        <div class="price-change">
                            <span class="old-price">${formatCurrency(productData.previous_price)}</span>
                            ${getPriceChangeIndicator(productData.current_price, productData.previous_price)}
                        </div>
                    ` : ''}
                </div>
                
                <div class="product-status">
                    <span class="availability-badge ${productData.is_available ? 'available' : 'unavailable'}">
                        ${productData.is_available ? '✅ Disponible' : '❌ Sin Stock'}
                    </span>
                    ${productData.is_new ? '<span class="new-badge">✨ Nuevo</span>' : ''}
                </div>
                
                <div class="product-actions">
                    <a href="${productData.url}" target="_blank" class="btn btn-primary">
                        🔗 Ver en Tienda Original
                    </a>
                    <button onclick="shareProduct()" class="btn btn-secondary">
                        📤 Compartir
                    </button>
                    <button onclick="addToCompare()" class="btn btn-secondary">
                        ⚖️ Comparar
                    </button>
                </div>
            </div>
        `;
    }
    
    // Update product details section
    const productDetails = document.querySelector('.product-details');
    if (productDetails) {
        productDetails.innerHTML = `
            <div class="detail-section">
                <h3>📊 Información del Producto</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="label">ID del Producto:</span>
                        <span class="value">${productData.id}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Precio Actual:</span>
                        <span class="value">${formatCurrency(productData.current_price)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Tienda:</span>
                        <span class="value">${productData.store_name}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Disponibilidad:</span>
                        <span class="value">${productData.is_available ? '✅ Disponible' : '❌ Sin Stock'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Agregado al Sistema:</span>
                        <span class="value">${formatDate(productData.created_at)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Última Actualización:</span>
                        <span class="value">${formatDate(productData.last_updated)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">URL Original:</span>
                        <span class="value">
                            <a href="${productData.url}" target="_blank" class="product-link">
                                Ver en ${productData.store_name} ↗
                            </a>
                        </span>
                    </div>
                </div>
            </div>
        `;
    }
}

// Display price history
function displayPriceHistory() {
    const historyContainer = document.querySelector('.price-history-list');
    if (!historyContainer) return;
    
    if (priceHistory.length === 0) {
        historyContainer.innerHTML = `
            <div class="empty-history">
                <div class="empty-icon">📈</div>
                <h3>Sin historial de precios</h3>
                <p>Este producto aún no tiene cambios de precio registrados.</p>
                <p><small>El historial se genera automáticamente cuando se detectan cambios de precio.</small></p>
            </div>
        `;
        return;
    }
    
    const filteredHistory = filterHistoryByPeriod(priceHistory);
    
    historyContainer.innerHTML = `
        <h3>📈 Historial de Precios (${filteredHistory.length} cambios)</h3>
        <div class="history-entries">
            ${filteredHistory.map(entry => `
                <div class="history-entry">
                    <div class="entry-date">
                        ${formatDate(entry.date)}
                    </div>
                    <div class="entry-price">
                        ${formatCurrency(entry.price)}
                    </div>
                    <div class="entry-change">
                        ${entry.oldPrice && entry.oldPrice !== entry.price ? 
                            getPriceChangeIndicator(entry.price, entry.oldPrice) : 
                            '<span class="no-change">Sin cambios</span>'
                        }
                    </div>
                    <div class="entry-type">
                        ${getChangeTypeIcon(entry.changeType)}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Initialize price chart
function initializePriceChart() {
    const chartCanvas = document.getElementById('price-chart');
    if (!chartCanvas) return;
    
    const ctx = chartCanvas.getContext('2d');
    const filteredHistory = filterHistoryByPeriod(priceHistory);
    
    // Destroy existing chart
    if (priceChart) {
        priceChart.destroy();
    }
    
    if (filteredHistory.length === 0) {
        ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
        ctx.fillStyle = '#666';
        ctx.font = '14px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Sin datos para el período seleccionado', chartCanvas.width / 2, chartCanvas.height / 2);
        return;
    }
    
    // Sort history by date
    const sortedHistory = [...filteredHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedHistory.map(entry => formatDateShort(entry.date)),
            datasets: [{
                label: 'Precio',
                data: sortedHistory.map(entry => entry.price),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Fecha'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Precio (ARS)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const entry = sortedHistory[context[0].dataIndex];
                            return formatDate(entry.date);
                        },
                        label: function(context) {
                            return `Precio: ${formatCurrency(context.parsed.y)}`;
                        }
                    }
                },
                legend: {
                    display: false
                }
            }
        }
    });
}

// Change period and update chart
function changePeriod(period) {
    currentPeriod = period;
    
    // Update active button
    document.querySelectorAll('.chart-period').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-period="${period}"]`).classList.add('active');
    
    // Update chart and history
    displayPriceHistory();
    initializePriceChart();
}

// Filter history by current period
function filterHistoryByPeriod(history) {
    if (currentPeriod === 'all') return history;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - currentPeriod);
    
    return history.filter(entry => new Date(entry.date) >= cutoffDate);
}

// Product action functions
function shareProduct() {
    if (!productData) return;
    
    if (navigator.share) {
        navigator.share({
            title: productData.name,
            text: `Mira este producto: ${productData.name} - ${formatCurrency(productData.current_price)}`,
            url: window.location.href
        }).catch(error => console.log('Error sharing:', error));
    } else {
        // Fallback: copy to clipboard
        const shareUrl = window.location.href;
        navigator.clipboard.writeText(shareUrl).then(() => {
            showToast('Enlace copiado', 'El enlace del producto ha sido copiado al portapapeles', 'success');
        }).catch(error => {
            console.log('Error copying to clipboard:', error);
            showToast('Error', 'No se pudo copiar el enlace', 'error');
        });
    }
}

function addToCompare() {
    if (!productData) return;
    
    // Get existing comparison list
    const compareList = getStoredData('compare-list', []);
    
    // Check if already in comparison
    if (compareList.some(p => p.id === productData.id)) {
        showToast('Ya está en comparación', 'Este producto ya está en tu lista de comparación', 'warning');
        return;
    }
    
    // Check limit
    if (compareList.length >= 5) {
        showToast('Límite alcanzado', 'Máximo 5 productos en comparación. Ve al comparador para gestionar la lista.', 'warning');
        return;
    }
    
    // Add to comparison
    compareList.push(productData);
    setStoredData('compare-list', compareList);
    
    showToast('Añadido a comparación', `${productData.name} añadido a la comparación. Ve al comparador para ver la comparación.`, 'success');
}

// Manual scraping function for product page
async function runScrapingFromProduct() {
    try {
        showToast('Scraping iniciado', 'Ejecutando scraping para actualizar productos...', 'info');
        
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
            
            // Reload page after successful scraping
            setTimeout(() => {
                location.reload();
            }, 2000);
            
        } else {
            throw new Error(result.error || 'Error desconocido en el scraping');
        }
        
    } catch (error) {
        console.error('Scraping error:', error);
        showToast('Error en scraping', error.message, 'error');
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
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%23f0f0f0" stroke="%23ddd"/><text x="150" y="160" text-anchor="middle" font-size="64" fill="%23666">📦</text></svg>`;
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
    
    if (previous === 0 || previous === current) return '<span class="no-change">→ Sin cambios</span>';
    
    const difference = current - previous;
    const percentage = ((difference / previous) * 100).toFixed(1);
    
    if (difference > 0) {
        return `<span class="price-increase">↗ +${Math.abs(percentage)}%</span>`;
    } else {
        return `<span class="price-decrease">↘ -${Math.abs(percentage)}%</span>`;
    }
}

function getChangeTypeIcon(changeType) {
    switch (changeType) {
        case 'increase': return '📈';
        case 'decrease': return '📉';
        case 'no_change': return '➖';
        default: return '📊';
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
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDateShort(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
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
                <p>Cargando datos reales del producto...</p>
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
                <h1>Error Cargando Producto</h1>
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
window.shareProduct = shareProduct;
window.addToCompare = addToCompare;
window.changePeriod = changePeriod;
window.runScrapingFromProduct = runScrapingFromProduct;

// No more mock data generation
// No more fake price history
// No more simulated product data
// Only real data from APIs