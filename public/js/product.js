// Product Page JavaScript

let productData = null;
let priceHistory = [];
let priceChart = null;
let currentPeriod = 7;

// Initialize product page
async function initializeProductPage() {
    console.log('📦 Initializing product page...');
    
    try {
        // Get product ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        
        if (!productId) {
            showError('No se especificó un producto válido');
            return;
        }
        
        // Load product data
        await loadProductData(productId);
        
        // Display product information
        displayProductInfo();
        
        // Generate and display price history
        generateMockPriceHistory();
        displayPriceHistory();
        
        // Initialize price chart
        initializePriceChart();
        
        console.log('✅ Product page loaded successfully');
        
    } catch (error) {
        console.error('Error initializing product page:', error);
        showError('Error cargando el producto');
    }
}

// Load product data (mock for now)
async function loadProductData(productId) {
    try {
        // For now, generate mock product data
        // In real implementation, this would fetch from the API
        
        const stores = [
            { id: 1, name: 'Shiva Home', domain: 'shivahome.com.ar' },
            { id: 2, name: 'Bazar Nuba', domain: 'bazarnuba.com' },
            { id: 3, name: 'Nimba', domain: 'nimba.com.ar' },
            { id: 4, name: 'Vienna Hogar', domain: 'viennahogar.com.ar' }
        ];
        
        const store = stores[Math.floor(Math.random() * stores.length)];
        const basePrice = Math.floor(Math.random() * 500000) + 10000;
        const hasChange = Math.random() > 0.3;
        const isNew = Math.random() > 0.7;
        
        const productNames = [
            'Mesa de Centro Moderna',
            'Silla Ergonómica Premium',
            'Lámpara de Pie Minimalista',
            'Espejo Decorativo Grande',
            'Florero Cerámico Artesanal',
            'Cojín Decorativo Luxury',
            'Cuadro Abstracto Original',
            'Vela Aromática Premium'
        ];
        
        const name = productNames[Math.floor(Math.random() * productNames.length)];
        
        productData = {
            id: parseInt(productId),
            name: `${name} Modelo ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
            store: store,
            current_price: basePrice,
            previous_price: hasChange ? Math.floor(basePrice * (0.8 + Math.random() * 0.4)) : basePrice,
            currency: 'ARS',
            in_stock: Math.random() > 0.1,
            is_new: isNew,
            image_url: `https://picsum.photos/400/400?random=${productId}`,
            url: `https://${store.domain}/productos/${name.toLowerCase().replace(/\s+/g, '-')}-${productId}`,
            created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
            description: `${name} de alta calidad disponible en ${store.name}. Producto ${isNew ? 'nuevo' : 'conocido'} con excelente relación precio-calidad.`
        };
        
    } catch (error) {
        console.error('Error loading product data:', error);
        throw new Error('No se pudo cargar la información del producto');
    }
}

// Display product information
function displayProductInfo() {
    if (!productData) return;
    
    // Update page title and breadcrumb
    document.title = `${productData.name} - TiendaNube Monitor`;
    document.getElementById('product-breadcrumb').textContent = productData.name;
    
    // Product header
    document.getElementById('product-main-image').src = productData.image_url;
    document.getElementById('product-main-image').alt = productData.name;
    document.getElementById('product-title').textContent = productData.name;
    
    // Store info
    const storeElement = document.getElementById('product-store');
    const storeEmoji = getStoreEmoji(productData.store.name);
    storeElement.innerHTML = `${storeEmoji} <span>${productData.store.name}</span>`;
    
    // Current price
    document.getElementById('current-price').textContent = formatCurrency(productData.current_price);
    
    // Price trend
    const priceTrendElement = document.getElementById('price-trend');
    if (productData.previous_price && productData.previous_price !== productData.current_price) {
        const changeInfo = getPriceChangeIndicator(productData.current_price, productData.previous_price);
        const percentage = calculatePercentageChange(productData.previous_price, productData.current_price);
        
        priceTrendElement.innerHTML = `
            <span class="previous-price">${formatCurrency(productData.previous_price)}</span>
            <span class="price-change-badge ${changeInfo.class}">
                ${changeInfo.icon} ${formatPercentage(percentage)}
            </span>
        `;
    } else if (productData.is_new) {
        priceTrendElement.innerHTML = `
            <span class="price-change-badge" style="background: var(--warning-light); color: var(--warning-color);">
                ✨ Producto Nuevo
            </span>
        `;
    }
    
    // Meta information
    document.getElementById('stock-status').innerHTML = productData.in_stock 
        ? '<span style="color: var(--success-color);">✅ En Stock</span>'
        : '<span style="color: var(--danger-color);">❌ Sin Stock</span>';
    
    document.getElementById('product-status').innerHTML = productData.is_new 
        ? '<span style="color: var(--warning-color);">✨ Nuevo</span>'
        : '<span style="color: var(--info-color);">👍 Monitoreado</span>';
    
    document.getElementById('last-update').textContent = formatTimeAgo(productData.updated_at);
    document.getElementById('created-date').textContent = formatDate(productData.created_at, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
    
    // Store link
    document.getElementById('store-link').href = productData.url;
    
    // Update product statistics
    updateProductStatistics();
}

// Generate mock price history
function generateMockPriceHistory() {
    priceHistory = [];
    
    const now = new Date();
    const daysBack = 90;
    const basePrice = productData.current_price;
    
    // Generate data points for the last 90 days
    for (let i = daysBack; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        
        // Create some price variation
        let price = basePrice;
        
        if (i > 0) {
            // Add some randomness to historical prices
            const variation = (Math.random() - 0.5) * 0.3; // ±15% variation
            price = Math.floor(basePrice * (1 + variation));
            
            // Ensure price doesn't go below 50% or above 150% of current price
            price = Math.max(basePrice * 0.5, Math.min(basePrice * 1.5, price));
        }
        
        const changeType = determineChangeType(i, price, basePrice);
        
        priceHistory.push({
            id: i,
            date: date.toISOString(),
            price: price,
            previous_price: i < daysBack - 1 ? priceHistory[priceHistory.length - 1]?.price : null,
            change_type: changeType,
            change_percentage: i < daysBack - 1 && priceHistory.length > 0 
                ? calculatePercentageChange(priceHistory[priceHistory.length - 1].price, price)
                : null,
            in_stock: Math.random() > 0.1
        });
    }
    
    // Sort by date (oldest first for chart)
    priceHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
}

// Determine change type for history
function determineChangeType(dayIndex, currentPrice, basePrice) {
    if (dayIndex === 0) return 'current';
    
    const variation = (currentPrice - basePrice) / basePrice;
    
    if (Math.abs(variation) < 0.02) return 'no_change';
    if (variation > 0) return 'price_up';
    return 'price_down';
}

// Update product statistics
function updateProductStatistics() {
    if (priceHistory.length === 0) return;
    
    const prices = priceHistory.map(h => h.price);
    const initialPrice = prices[0];
    const currentPrice = productData.current_price;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    // Animate the statistics
    setTimeout(() => {
        animateValue(document.getElementById('initial-price'), 0, initialPrice, 1000);
    }, 200);
    
    setTimeout(() => {
        animateValue(document.getElementById('min-price'), 0, minPrice, 1000);
    }, 400);
    
    setTimeout(() => {
        animateValue(document.getElementById('max-price'), 0, maxPrice, 1000);
    }, 600);
    
    setTimeout(() => {
        const totalChange = calculatePercentageChange(initialPrice, currentPrice);
        const totalChangeElement = document.getElementById('total-change');
        
        totalChangeElement.textContent = formatPercentage(totalChange);
        totalChangeElement.style.color = totalChange > 0 ? 'var(--danger-color)' : 
                                         totalChange < 0 ? 'var(--success-color)' : 
                                         'var(--text-primary)';
    }, 800);
}

// Display price history table
function displayPriceHistory() {
    const tbody = document.getElementById('history-tbody');
    if (!tbody || priceHistory.length === 0) return;
    
    tbody.innerHTML = '';
    
    // Show last 20 entries (most recent first)
    const recentHistory = [...priceHistory].reverse().slice(0, 20);
    
    recentHistory.forEach(entry => {
        const row = document.createElement('tr');
        row.className = 'animate-fade-in';
        
        const date = new Date(entry.date);
        const changeIcon = getChangeTypeIcon(entry.change_type);
        const changeBadgeClass = getChangeTypeBadgeClass(entry.change_type);
        
        row.innerHTML = `
            <td>${formatDate(entry.date, { month: 'short', day: 'numeric', year: '2-digit' })}</td>
            <td>${date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</td>
            <td><strong>${formatCurrency(entry.price)}</strong></td>
            <td>
                ${entry.previous_price && entry.previous_price !== entry.price 
                    ? `<span style="color: var(--text-secondary);">${formatCurrency(entry.previous_price)}</span>`
                    : '-'
                }
            </td>
            <td>
                <span class="change-type-badge ${changeBadgeClass}">
                    ${changeIcon} ${getChangeTypeText(entry.change_type)}
                </span>
            </td>
            <td>
                ${entry.change_percentage !== null ? 
                    `<span style="color: ${entry.change_percentage > 0 ? 'var(--danger-color)' : 'var(--success-color)'};">
                        ${formatPercentage(entry.change_percentage)}
                    </span>` 
                    : '-'
                }
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Get change type icon
function getChangeTypeIcon(changeType) {
    const icons = {
        'current': '🕐',
        'price_up': '📈',
        'price_down': '📉',
        'no_change': '➖',
        'new_product': '✨',
        'back_in_stock': '✅',
        'out_of_stock': '❌'
    };
    return icons[changeType] || '📊';
}

// Get change type badge class
function getChangeTypeBadgeClass(changeType) {
    const classes = {
        'new_product': 'change-new',
        'price_up': 'change-up',
        'price_down': 'change-down',
        'back_in_stock': 'change-stock',
        'out_of_stock': 'change-stock',
        'no_change': '',
        'current': ''
    };
    return classes[changeType] || '';
}

// Get change type text
function getChangeTypeText(changeType) {
    const texts = {
        'current': 'Actual',
        'price_up': 'Subió',
        'price_down': 'Bajó',
        'no_change': 'Sin cambio',
        'new_product': 'Nuevo',
        'back_in_stock': 'Stock',
        'out_of_stock': 'Sin stock'
    };
    return texts[changeType] || 'Cambio';
}

// Initialize price chart
function initializePriceChart() {
    const ctx = document.getElementById('price-chart').getContext('2d');
    
    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Precio',
                data: [],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgb(59, 130, 246)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgb(59, 130, 246)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            return `Precio: ${formatCurrency(context.parsed.y)}`;
                        },
                        title: function(context) {
                            const date = new Date(context[0].label);
                            return formatDate(date.toISOString(), {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric'
                            });
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Fecha',
                        font: {
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Precio (ARS)',
                        font: {
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });
    
    // Load initial chart data
    updateChart(currentPeriod);
}

// Change chart period
function changePeriod(period) {
    currentPeriod = period;
    
    // Update active button
    document.querySelectorAll('.chart-period').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update chart
    updateChart(period);
}

// Update chart with new period
function updateChart(period) {
    if (!priceChart || priceHistory.length === 0) return;
    
    let filteredHistory = [...priceHistory];
    let summary = '';
    
    if (period !== 'all') {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - period);
        
        filteredHistory = priceHistory.filter(entry => 
            new Date(entry.date) >= cutoffDate
        );
        
        summary = `Mostrando últimos ${period} días`;
    } else {
        summary = `Mostrando historial completo (${priceHistory.length} puntos)`;
    }
    
    // Prepare chart data
    const labels = filteredHistory.map(entry => {
        const date = new Date(entry.date);
        if (period <= 7) {
            return date.toLocaleDateString('es-AR', { weekday: 'short', month: 'short', day: 'numeric' });
        } else if (period <= 30) {
            return date.toLocaleDateString('es-AR', { month: 'short', day: 'numeric' });
        } else {
            return date.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
        }
    });
    
    const prices = filteredHistory.map(entry => entry.price);
    
    // Update chart
    priceChart.data.labels = labels;
    priceChart.data.datasets[0].data = prices;
    
    // Update colors based on trend
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const isUpTrend = lastPrice > firstPrice;
    
    priceChart.data.datasets[0].borderColor = isUpTrend ? 'rgb(239, 68, 68)' : 'rgb(16, 185, 129)';
    priceChart.data.datasets[0].backgroundColor = isUpTrend ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)';
    priceChart.data.datasets[0].pointBackgroundColor = isUpTrend ? 'rgb(239, 68, 68)' : 'rgb(16, 185, 129)';
    
    priceChart.update('active');
    
    // Update summary
    const summaryElement = document.getElementById('chart-summary');
    if (summaryElement) {
        const trend = isUpTrend ? '📈 Tendencia alcista' : '📉 Tendencia bajista';
        const change = formatPercentage(calculatePercentageChange(firstPrice, lastPrice));
        summaryElement.textContent = `${summary} • ${trend} (${change})`;
    }
}

// Product actions
function shareProduct() {
    if (!productData) return;
    
    const shareData = {
        title: productData.name,
        text: `${productData.name} - ${formatCurrency(productData.current_price)} en ${productData.store.name}`,
        url: window.location.href
    };
    
    if (navigator.share) {
        navigator.share(shareData)
            .then(() => console.log('Product shared successfully'))
            .catch(error => console.error('Error sharing:', error));
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(`${shareData.text} - ${shareData.url}`)
            .then(() => {
                showToast('Compartir', 'Link copiado al portapapeles', 'success');
            })
            .catch(() => {
                showToast('Error', 'No se pudo copiar el link', 'error');
            });
    }
}

function addToCompare() {
    if (!productData) return;
    
    // Get existing comparison list from localStorage
    let compareList = getStoredData('compare-list', []);
    
    // Check if product is already in comparison
    const exists = compareList.find(item => item.id === productData.id);
    
    if (exists) {
        showToast('Comparar', 'Este producto ya está en la lista de comparación', 'warning');
        return;
    }
    
    // Add to comparison
    compareList.push({
        id: productData.id,
        name: productData.name,
        store: productData.store.name,
        price: productData.current_price,
        image: productData.image_url,
        url: productData.url
    });
    
    // Limit to 5 products
    if (compareList.length > 5) {
        compareList = compareList.slice(-5);
        showToast('Comparar', 'Máximo 5 productos. Se eliminó el más antiguo.', 'info');
    }
    
    // Save to localStorage
    storeData('compare-list', compareList);
    
    showToast('Comparar', 'Producto agregado a comparación', 'success');
    
    // Optionally redirect to compare page
    setTimeout(() => {
        const goToCompare = confirm('¿Quieres ir a la página de comparación ahora?');
        if (goToCompare) {
            window.location.href = '/compare.html';
        }
    }, 1000);
}

// Error handling
function showError(message) {
    const container = document.querySelector('.product-detail-container');
    if (!container) return;
    
    container.innerHTML = `
        <div style="text-align: center; padding: var(--space-12);">
            <div style="font-size: 4rem; margin-bottom: var(--space-6); opacity: 0.5;">😕</div>
            <h2>Oops! Algo salió mal</h2>
            <p style="color: var(--text-secondary); margin-bottom: var(--space-6);">${message}</p>
            <div>
                <button class="btn btn-primary" onclick="window.location.reload()">
                    🔄 Reintentar
                </button>
                <a href="/" class="btn btn-secondary" style="margin-left: var(--space-3);">
                    🏠 Ir al Dashboard
                </a>
            </div>
        </div>
    `;
}

// Global functions for HTML onclick handlers
window.changePeriod = changePeriod;
window.shareProduct = shareProduct;
window.addToCompare = addToCompare;