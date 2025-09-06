// Compare Page JavaScript

let compareList = [];
let allProducts = [];
let searchTimeout = null;

// Initialize compare page
async function initializeComparePage() {
    console.log('⚖️ Initializing compare page...');
    
    try {
        // Load saved comparison list
        loadSavedComparison();
        
        // Generate mock products for search
        generateMockProducts();
        
        // Setup event listeners
        setupEventListeners();
        
        // Display current comparison
        displayComparison();
        
        console.log('✅ Compare page loaded successfully');
        
    } catch (error) {
        console.error('Error initializing compare page:', error);
        showToast('Error', 'Error cargando comparador', 'error');
    }
}

// Load saved comparison from localStorage
function loadSavedComparison() {
    compareList = getStoredData('compare-list', []);
    console.log(`📋 Loaded ${compareList.length} products from saved comparison`);
}

// Generate mock products for search
function generateMockProducts() {
    const stores = [
        { id: 1, name: 'Shiva Home', domain: 'shivahome.com.ar' },
        { id: 2, name: 'Bazar Nuba', domain: 'bazarnuba.com' },
        { id: 3, name: 'Nimba', domain: 'nimba.com.ar' },
        { id: 4, name: 'Vienna Hogar', domain: 'viennahogar.com.ar' },
        { id: 5, name: 'Magnolias Deco', domain: 'magnoliasdeco.com.ar' },
        { id: 6, name: 'Duvet', domain: 'duvet.com.ar' },
        { id: 7, name: 'Ganga Home', domain: 'gangahome.com.ar' },
        { id: 8, name: 'Binah Deco', domain: 'binahdeco.com.ar' }
    ];
    
    const productNames = [
        'Mesa de Centro Moderna',
        'Silla Ergonómica',
        'Lámpara de Pie',
        'Espejo Decorativo',
        'Florero Cerámico',
        'Cojín Decorativo',
        'Cuadro Abstracto',
        'Vela Aromática',
        'Jarron Grande',
        'Mesa Ratona',
        'Sillón Esquinero',
        'Biblioteca Moderna',
        'Maceta Decorativa',
        'Alfombra Vintage',
        'Cortina Blackout',
        'Perchero de Pie',
        'Mesa Comedor',
        'Silla Tapizada',
        'Lámpara Colgante',
        'Espejo Redondo'
    ];
    
    const adjectives = ['Premium', 'Luxury', 'Clásica', 'Moderna', 'Vintage', 'Minimalista', 'Artesanal', 'Elegante'];
    
    allProducts = [];
    
    for (let i = 0; i < 200; i++) {
        const store = stores[Math.floor(Math.random() * stores.length)];
        const baseName = productNames[Math.floor(Math.random() * productNames.length)];
        const adjective = Math.random() > 0.5 ? adjectives[Math.floor(Math.random() * adjectives.length)] + ' ' : '';
        const variant = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        const name = `${adjective}${baseName} ${variant}`;
        
        const basePrice = Math.floor(Math.random() * 500000) + 5000;
        const isNew = Math.random() > 0.8;
        const inStock = Math.random() > 0.1;
        
        allProducts.push({
            id: i + 1,
            name: name,
            store: store,
            price: basePrice,
            previous_price: Math.random() > 0.7 ? Math.floor(basePrice * (0.8 + Math.random() * 0.4)) : basePrice,
            currency: 'ARS',
            in_stock: inStock,
            is_new: isNew,
            image: `https://picsum.photos/200/200?random=${i + 1}`,
            url: `https://${store.domain}/productos/${name.toLowerCase().replace(/\s+/g, '-')}-${i + 1}`,
            created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    
    console.log(`🔍 Generated ${allProducts.length} products for search`);
}

// Setup event listeners
function setupEventListeners() {
    const searchInput = document.getElementById('compare-search');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('focus', showSearchResults);
        searchInput.addEventListener('blur', hideSearchResultsDelayed);
    }
    
    // Hide search results when clicking outside
    document.addEventListener('click', (e) => {
        const searchContainer = document.querySelector('.search-container');
        if (searchContainer && !searchContainer.contains(e.target)) {
            hideSearchResults();
        }
    });
}

// Handle search input
function handleSearch(event) {
    const query = event.target.value.trim().toLowerCase();
    
    // Clear previous timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    // Debounce search
    searchTimeout = setTimeout(() => {
        if (query.length >= 2) {
            performSearch(query);
        } else {
            hideSearchResults();
        }
    }, 300);
}

// Perform product search
function performSearch(query) {
    const searchResults = allProducts.filter(product => {
        return product.name.toLowerCase().includes(query) ||
               product.store.name.toLowerCase().includes(query);
    }).slice(0, 10); // Limit to 10 results
    
    displaySearchResults(searchResults);
}

// Display search results
function displaySearchResults(results) {
    const searchResultsContainer = document.getElementById('search-results');
    if (!searchResultsContainer) return;
    
    if (results.length === 0) {
        searchResultsContainer.innerHTML = `
            <div class="search-result-item" style="justify-content: center; color: var(--text-secondary);">
                No se encontraron productos
            </div>
        `;
    } else {
        searchResultsContainer.innerHTML = results.map(product => {
            const isAlreadyCompared = compareList.some(item => item.id === product.id);
            
            return `
                <div class="search-result-item ${isAlreadyCompared ? 'disabled' : ''}" 
                     onclick="${isAlreadyCompared ? '' : `addToComparison(${product.id})`}"
                     style="${isAlreadyCompared ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
                    <img class="search-result-image" 
                         src="${product.image}" 
                         alt="${product.name}"
                         onerror="this.src='https://via.placeholder.com/50x50?text=📦'">
                    <div class="search-result-info">
                        <div class="search-result-name">${product.name}</div>
                        <div class="search-result-meta">
                            ${getStoreEmoji(product.store.name)} ${product.store.name} • 
                            ${formatCurrency(product.price)}
                            ${isAlreadyCompared ? ' • Ya agregado' : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    showSearchResults();
}

// Show search results
function showSearchResults() {
    const searchResults = document.getElementById('search-results');
    if (searchResults) {
        searchResults.style.display = 'block';
    }
}

// Hide search results
function hideSearchResults() {
    const searchResults = document.getElementById('search-results');
    if (searchResults) {
        searchResults.style.display = 'none';
    }
}

// Hide search results with delay (for blur event)
function hideSearchResultsDelayed() {
    setTimeout(hideSearchResults, 200);
}

// Add product to comparison
function addToComparison(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    // Check if already in comparison
    if (compareList.some(item => item.id === productId)) {
        showToast('Comparar', 'Este producto ya está en la comparación', 'warning');
        return;
    }
    
    // Check maximum limit
    if (compareList.length >= 5) {
        showToast('Comparar', 'Máximo 5 productos. Elimina uno para agregar otro.', 'warning');
        return;
    }
    
    // Add to comparison
    compareList.push({
        id: product.id,
        name: product.name,
        store: product.store.name,
        store_emoji: getStoreEmoji(product.store.name),
        price: product.price,
        previous_price: product.previous_price,
        image: product.image,
        url: product.url,
        in_stock: product.in_stock,
        is_new: product.is_new,
        currency: product.currency
    });
    
    // Save to localStorage
    storeData('compare-list', compareList);
    
    // Update display
    displayComparison();
    
    // Hide search results
    hideSearchResults();
    
    // Clear search input
    const searchInput = document.getElementById('compare-search');
    if (searchInput) {
        searchInput.value = '';
    }
    
    showToast('Comparar', `${product.name} agregado a la comparación`, 'success');
}

// Remove from comparison
function removeFromComparison(productId) {
    const productIndex = compareList.findIndex(item => item.id === productId);
    if (productIndex === -1) return;
    
    const productName = compareList[productIndex].name;
    compareList.splice(productIndex, 1);
    
    // Save to localStorage
    storeData('compare-list', compareList);
    
    // Update display
    displayComparison();
    
    showToast('Comparar', `${productName} eliminado de la comparación`, 'info');
}

// Display comparison
function displayComparison() {
    const comparisonContent = document.getElementById('comparison-content');
    const compareCount = document.getElementById('compare-count');
    const insightsSection = document.getElementById('insights-section');
    
    if (!comparisonContent || !compareCount) return;
    
    // Update count
    compareCount.textContent = compareList.length;
    
    if (compareList.length === 0) {
        displayEmptyState(comparisonContent);
        if (insightsSection) insightsSection.style.display = 'none';
        return;
    }
    
    // Show insights section
    if (insightsSection) insightsSection.style.display = 'block';
    
    // Generate comparison analysis
    const analysis = generateComparisonAnalysis();
    
    // Display products
    comparisonContent.innerHTML = `
        <div class="comparison-grid">
            ${compareList.map(product => createComparisonCard(product, analysis)).join('')}
        </div>
    `;
    
    // Display insights
    displayInsights(analysis);
}

// Display empty state
function displayEmptyState(container) {
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">⚖️</div>
            <h3>¡Comienza tu comparación!</h3>
            <p>Busca productos arriba para agregarlos y compararlos</p>
            
            <div class="quick-add">
                <h4>O agrega productos populares:</h4>
                <div class="quick-add-grid">
                    <button class="quick-add-btn" onclick="quickAddProduct('mesa')">
                        🪑 Mesas
                    </button>
                    <button class="quick-add-btn" onclick="quickAddProduct('silla')">
                        💺 Sillas
                    </button>
                    <button class="quick-add-btn" onclick="quickAddProduct('lámpara')">
                        💡 Lámparas
                    </button>
                    <button class="quick-add-btn" onclick="quickAddProduct('espejo')">
                        🪞 Espejos
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Quick add product by category
function quickAddProduct(category) {
    const searchInput = document.getElementById('compare-search');
    if (searchInput) {
        searchInput.value = category;
        searchInput.focus();
        handleSearch({ target: searchInput });
    }
}

// Generate comparison analysis
function generateComparisonAnalysis() {
    if (compareList.length === 0) return {};
    
    const prices = compareList.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    // Find best and worst deals
    const cheapestProduct = compareList.find(p => p.price === minPrice);
    const mostExpensiveProduct = compareList.find(p => p.price === maxPrice);
    
    // Calculate savings
    const maxSavings = maxPrice - minPrice;
    const savingsPercentage = ((maxSavings / maxPrice) * 100).toFixed(1);
    
    // Store analysis
    const storeCount = new Set(compareList.map(p => p.store)).size;
    const storeDistribution = {};
    compareList.forEach(p => {
        storeDistribution[p.store] = (storeDistribution[p.store] || 0) + 1;
    });
    
    // Stock analysis
    const inStockCount = compareList.filter(p => p.in_stock).length;
    const newProductsCount = compareList.filter(p => p.is_new).length;
    
    return {
        priceRange: { min: minPrice, max: maxPrice, avg: avgPrice },
        cheapest: cheapestProduct,
        mostExpensive: mostExpensiveProduct,
        savings: { amount: maxSavings, percentage: savingsPercentage },
        stores: { count: storeCount, distribution: storeDistribution },
        stock: { inStock: inStockCount, total: compareList.length },
        newProducts: newProductsCount
    };
}

// Create comparison card
function createComparisonCard(product, analysis) {
    const isCheapest = analysis.cheapest && product.id === analysis.cheapest.id;
    const isMostExpensive = analysis.mostExpensive && product.id === analysis.mostExpensive.id;
    
    const cardClass = isCheapest ? 'winner' : isMostExpensive ? 'expensive' : '';
    
    const priceChange = getPriceChangeIndicator(product.price, product.previous_price);
    
    const badges = [];
    if (isCheapest) badges.push('<span class="comparison-badge badge-best-price">🏆 Mejor Precio</span>');
    if (isMostExpensive) badges.push('<span class="comparison-badge badge-most-expensive">💰 Más Caro</span>');
    if (product.is_new) badges.push('<span class="comparison-badge badge-new">✨ Nuevo</span>');
    
    return `
        <div class="comparison-card ${cardClass}">
            <button class="comparison-remove" onclick="removeFromComparison(${product.id})" title="Eliminar">
                ×
            </button>
            
            <img class="comparison-image" 
                 src="${product.image}" 
                 alt="${product.name}"
                 onerror="this.src='https://via.placeholder.com/250x150?text=📦'">
            
            <h3 class="comparison-name">${product.name}</h3>
            
            <div class="comparison-store">
                ${product.store_emoji} ${product.store}
            </div>
            
            <div class="comparison-price">
                ${formatCurrency(product.price)}
            </div>
            
            ${product.previous_price && product.previous_price !== product.price ? `
                <div class="price-change ${priceChange.class}" style="font-size: 0.875rem; margin-bottom: var(--space-2);">
                    ${priceChange.icon} ${priceChange.text}
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">
                        Antes: ${formatCurrency(product.previous_price)}
                    </div>
                </div>
            ` : ''}
            
            ${badges.length > 0 ? `
                <div class="comparison-badges">
                    ${badges.join('')}
                </div>
            ` : ''}
            
            <div style="margin-bottom: var(--space-3);">
                <div style="font-size: 0.875rem; margin-bottom: var(--space-1);">
                    <strong>Stock:</strong> 
                    <span style="color: ${product.in_stock ? 'var(--success-color)' : 'var(--danger-color)'};">
                        ${product.in_stock ? '✅ Disponible' : '❌ Sin stock'}
                    </span>
                </div>
                
                ${analysis.savings.amount > 0 && !isCheapest ? `
                    <div style="font-size: 0.875rem; color: var(--warning-color);">
                        💰 Ahorras <strong>${formatCurrency(product.price - analysis.priceRange.min)}</strong>
                        eligiendo el más barato
                    </div>
                ` : ''}
            </div>
            
            <div class="comparison-actions-card">
                <a href="${product.url}" target="_blank" class="btn btn-primary" style="flex: 1; font-size: 0.875rem;">
                    🔗 Ver en Tienda
                </a>
                <a href="/product.html?id=${product.id}" class="btn btn-secondary" style="font-size: 0.875rem;">
                    👁️
                </a>
            </div>
        </div>
    `;
}

// Display insights
function displayInsights(analysis) {
    const insightsGrid = document.getElementById('insights-grid');
    if (!insightsGrid || !analysis.priceRange) return;
    
    const insights = [];
    
    // Price insight
    if (analysis.savings.amount > 0) {
        insights.push({
            icon: '💰',
            title: 'Oportunidad de Ahorro',
            description: `Puedes ahorrar hasta <strong>${formatCurrency(analysis.savings.amount)}</strong> (${analysis.savings.percentage}%) eligiendo el producto más económico en lugar del más caro.`
        });
    }
    
    // Store diversity insight
    if (analysis.stores.count > 1) {
        const mostCommonStore = Object.keys(analysis.stores.distribution).reduce((a, b) => 
            analysis.stores.distribution[a] > analysis.stores.distribution[b] ? a : b
        );
        
        insights.push({
            icon: '🏪',
            title: 'Diversidad de Tiendas',
            description: `Comparando productos de <strong>${analysis.stores.count}</strong> tiendas diferentes. <strong>${mostCommonStore}</strong> aparece más frecuentemente en tu comparación.`
        });
    }
    
    // Stock insight
    if (analysis.stock.inStock < analysis.stock.total) {
        const outOfStock = analysis.stock.total - analysis.stock.inStock;
        insights.push({
            icon: '📦',
            title: 'Disponibilidad',
            description: `<strong>${outOfStock}</strong> de ${analysis.stock.total} productos están sin stock. Considera esto en tu decisión de compra.`
        });
    }
    
    // New products insight
    if (analysis.newProducts > 0) {
        insights.push({
            icon: '✨',
            title: 'Productos Nuevos',
            description: `<strong>${analysis.newProducts}</strong> producto${analysis.newProducts > 1 ? 's son' : ' es'} nuevo${analysis.newProducts > 1 ? 's' : ''} en el catálogo. Estos podrían tener precios de lanzamiento especiales.`
        });
    }
    
    // Price range insight
    insights.push({
        icon: '📊',
        title: 'Análisis de Precios',
        description: `El rango de precios va desde <strong>${formatCurrency(analysis.priceRange.min)}</strong> hasta <strong>${formatCurrency(analysis.priceRange.max)}</strong>. El precio promedio es <strong>${formatCurrency(analysis.priceRange.avg)}</strong>.`
    });
    
    // Recommendation insight
    if (analysis.cheapest) {
        const recommendation = analysis.cheapest.in_stock ? 
            `Te recomendamos <strong>${analysis.cheapest.name}</strong> de ${analysis.cheapest.store} por su excelente precio y disponibilidad.` :
            `Aunque <strong>${analysis.cheapest.name}</strong> tiene el mejor precio, está sin stock. Considera la segunda opción más económica.`;
            
        insights.push({
            icon: '🎯',
            title: 'Recomendación',
            description: recommendation
        });
    }
    
    insightsGrid.innerHTML = insights.map(insight => `
        <div class="insight-card">
            <div class="insight-icon">${insight.icon}</div>
            <div class="insight-title">${insight.title}</div>
            <div class="insight-description">${insight.description}</div>
        </div>
    `).join('');
}

// Export comparison
function exportComparison() {
    if (compareList.length === 0) {
        showToast('Exportar', 'No hay productos para exportar', 'warning');
        return;
    }
    
    const analysis = generateComparisonAnalysis();
    
    const exportData = {
        fecha_comparacion: new Date().toISOString(),
        productos: compareList.map(product => ({
            nombre: product.name,
            tienda: product.store,
            precio_actual: product.price,
            precio_anterior: product.previous_price,
            en_stock: product.in_stock,
            es_nuevo: product.is_new,
            url: product.url
        })),
        analisis: {
            precio_minimo: analysis.priceRange.min,
            precio_maximo: analysis.priceRange.max,
            precio_promedio: Math.round(analysis.priceRange.avg),
            ahorro_potencial: analysis.savings.amount,
            porcentaje_ahorro: analysis.savings.percentage + '%',
            producto_mas_barato: analysis.cheapest?.name,
            tienda_mas_barata: analysis.cheapest?.store,
            total_tiendas: analysis.stores.count
        }
    };
    
    const filename = `comparacion_productos_${new Date().toISOString().split('T')[0]}.json`;
    downloadJSON(exportData, filename);
    
    showToast('Exportar', `Comparación exportada: ${compareList.length} productos`, 'success');
}

// Clear all comparisons
function clearComparison() {
    if (compareList.length === 0) {
        showToast('Limpiar', 'No hay productos para limpiar', 'info');
        return;
    }
    
    const confirmClear = confirm(`¿Estás seguro de que quieres eliminar todos los ${compareList.length} productos de la comparación?`);
    
    if (confirmClear) {
        compareList = [];
        storeData('compare-list', compareList);
        displayComparison();
        showToast('Limpiar', 'Comparación limpiada', 'info');
    }
}

// Global functions for HTML onclick handlers
window.addToComparison = addToComparison;
window.removeFromComparison = removeFromComparison;
window.quickAddProduct = quickAddProduct;
window.exportComparison = exportComparison;
window.clearComparison = clearComparison;