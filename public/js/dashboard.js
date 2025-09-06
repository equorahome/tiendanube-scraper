// Dashboard JavaScript

// Global state
let currentProducts = [];
let currentFilters = {};
let currentSort = { field: 'updated_at', order: 'desc' };
let currentPage = 1;
let itemsPerPage = 50;
let stores = [];
let stats = {
    totalProducts: 0,
    priceChanges: 0,
    newProducts: 0,
    bestDiscount: 0
};

// Initialize dashboard
async function initializeDashboard() {
    console.log('🏠 Initializing dashboard...');
    
    try {
        performance_monitor.start('dashboard-init');
        
        // Load initial data
        await Promise.all([
            loadStores(),
            loadStats(),
            loadProducts(),
            loadRecentActivity()
        ]);
        
        // Setup event listeners
        setupEventListeners();
        
        // Update last refresh time
        updateLastRefreshTime();
        
        // Setup auto-refresh
        setupAutoRefresh();
        
        performance_monitor.end('dashboard-init');
        
        showToast('Dashboard', 'Dashboard cargado correctamente', 'success');
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showToast('Error', 'Error cargando dashboard', 'error');
    }
}

// Load stores data
async function loadStores() {
    try {
        // For now, use the hardcoded stores from the backend
        stores = [
            { id: 1, name: 'Shiva Home', domain: 'shivahome.com.ar' },
            { id: 2, name: 'Bazar Nuba', domain: 'bazarnuba.com' },
            { id: 3, name: 'Nimba', domain: 'nimba.com.ar' },
            { id: 4, name: 'Vienna Hogar', domain: 'viennahogar.com.ar' },
            { id: 5, name: 'Magnolias Deco', domain: 'magnoliasdeco.com.ar' },
            { id: 6, name: 'Duvet', domain: 'duvet.com.ar' },
            { id: 7, name: 'Ganga Home', domain: 'gangahome.com.ar' },
            { id: 8, name: 'Binah Deco', domain: 'binahdeco.com.ar' }
        ];
        
        populateStoreFilter();
        
    } catch (error) {
        console.error('Error loading stores:', error);
        showToast('Error', 'Error cargando tiendas', 'error');
    }
}

// Populate store filter dropdown
function populateStoreFilter() {
    const storeFilter = document.getElementById('store-filter');
    if (!storeFilter) return;
    
    // Clear existing options (except first one)
    while (storeFilter.children.length > 1) {
        storeFilter.removeChild(storeFilter.lastChild);
    }
    
    stores.forEach(store => {
        const option = document.createElement('option');
        option.value = store.id;
        option.textContent = `${getStoreEmoji(store.name)} ${store.name}`;
        storeFilter.appendChild(option);
    });
}

// Load dashboard stats
async function loadStats() {
    try {
        // For now, generate mock stats
        stats = {
            totalProducts: Math.floor(Math.random() * 2000) + 500,
            priceChanges: Math.floor(Math.random() * 100) + 20,
            newProducts: Math.floor(Math.random() * 50) + 5,
            bestDiscount: Math.floor(Math.random() * 50) + 10
        };
        
        updateStatsDisplay();
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Update stats display with animation
function updateStatsDisplay() {
    const statElements = {
        'total-products': stats.totalProducts,
        'price-changes': stats.priceChanges,
        'new-products': stats.newProducts,
        'best-discount': `${stats.bestDiscount}%`
    };
    
    Object.entries(statElements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            const skeleton = element.querySelector('.loading-skeleton');
            if (skeleton) {
                skeleton.style.display = 'none';
            }
            
            if (typeof value === 'number') {
                animateValue(element, 0, value, 1500);
            } else {
                element.textContent = value;
            }
        }
    });
    
    // Update change indicators
    updateChangeIndicators();
}

// Update change indicators
function updateChangeIndicators() {
    const indicators = [
        { id: 'products-change', change: Math.floor(Math.random() * 20) + 1 },
        { id: 'changes-trend', text: 'Últimas 24h' },
        { id: 'new-trend', text: 'Hoy' },
        { id: 'discount-store', text: stores[Math.floor(Math.random() * stores.length)]?.name || 'N/A' }
    ];
    
    indicators.forEach(({ id, change, text }) => {
        const element = document.getElementById(id);
        if (element) {
            if (change !== undefined) {
                const isPositive = Math.random() > 0.3;
                const icon = isPositive ? '↗' : '↘';
                const sign = isPositive ? '+' : '-';
                const className = isPositive ? 'positive' : 'negative';
                
                element.innerHTML = `<span class="change-icon">${icon}</span>${sign}${change} hoy`;
                element.className = `stat-change ${className}`;
            } else if (text) {
                element.innerHTML = `<span class="change-icon">${id.includes('discount') ? '🏪' : '🕒'}</span>${text}`;
            }
        }
    });
}

// Load products (mock data for now)
async function loadProducts() {
    try {
        performance_monitor.start('load-products');
        
        // Generate mock products for demonstration
        currentProducts = generateMockProducts(100);
        
        displayProducts();
        updateResultsCount();
        setupPagination();
        
        performance_monitor.end('load-products');
        
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('Error', 'Error cargando productos', 'error');
        displayEmptyState();
    }
}

// Generate mock products for demo
function generateMockProducts(count) {
    const products = [];
    const productNames = [
        'Mesa de Centro Moderna', 'Silla Ergonómica', 'Lámpara de Pie', 'Espejo Decorativo',
        'Florero Ceramico', 'Cojín Decorativo', 'Cuadro Abstracto', 'Vela Aromática',
        'Jarron Grande', 'Mesa Ratona', 'Sillon Esquinero', 'Biblioteca Moderna',
        'Maceta Decorativa', 'Alfombra Vintage', 'Cortina Blackout', 'Perchero de Pie'
    ];
    
    for (let i = 0; i < count; i++) {
        const store = stores[Math.floor(Math.random() * stores.length)];
        const name = productNames[Math.floor(Math.random() * productNames.length)];
        const basePrice = Math.floor(Math.random() * 500000) + 10000;
        const hasChange = Math.random() > 0.7;
        const isNew = Math.random() > 0.8;
        
        products.push({
            id: i + 1,
            name: `${name} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
            store: store,
            current_price: basePrice,
            previous_price: hasChange ? basePrice * (0.8 + Math.random() * 0.4) : basePrice,
            currency: 'ARS',
            in_stock: Math.random() > 0.1,
            is_new: isNew,
            image_url: `https://picsum.photos/300/300?random=${i}`,
            url: `https://${store.domain}/productos/${name.toLowerCase().replace(/\s+/g, '-')}-${i}`,
            updated_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    
    return products;
}

// Display products in table or cards
function displayProducts() {
    const currentView = document.querySelector('.view-btn.active')?.dataset.view || 'table';
    
    if (currentView === 'table') {
        displayProductsTable();
    } else {
        displayProductsCards();
    }
}

// Display products in table format
function displayProductsTable() {
    const tbody = document.getElementById('products-tbody');
    if (!tbody) return;
    
    // Clear loading row
    tbody.innerHTML = '';
    
    if (currentProducts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center" style="padding: var(--space-8);">
                    <div>
                        <div style="font-size: 3rem; margin-bottom: var(--space-4); opacity: 0.5;">📦</div>
                        <h3>No se encontraron productos</h3>
                        <p style="color: var(--text-secondary);">Intenta ajustar los filtros o realizar un nuevo scraping.</p>
                        <button class="btn btn-primary" onclick="triggerScraping()">Ejecutar Scraping</button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // Get products for current page
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageProducts = currentProducts.slice(start, end);
    
    pageProducts.forEach(product => {
        const row = createProductRow(product);
        tbody.appendChild(row);
    });
}

// Create table row for product
function createProductRow(product) {
    const row = document.createElement('tr');
    row.className = 'animate-fade-in';
    
    const priceChange = getPriceChangeIndicator(product.current_price, product.previous_price);
    const timeAgo = formatTimeAgo(product.updated_at);
    
    row.innerHTML = `
        <td>
            <img class="product-image" 
                 src="${product.image_url}" 
                 alt="${product.name}"
                 onerror="this.src='https://via.placeholder.com/60x60?text=📦'">
        </td>
        <td>
            <div class="product-name" title="${product.name}">
                ${product.name}
                ${product.is_new ? '<span style="color: var(--warning-color); margin-left: 8px;">✨</span>' : ''}
            </div>
        </td>
        <td>
            <div class="store-badge">
                ${getStoreEmoji(product.store.name)} ${product.store.name}
            </div>
        </td>
        <td>
            <span class="price">${formatCurrency(product.current_price)}</span>
        </td>
        <td>
            <span class="price">${product.previous_price ? formatCurrency(product.previous_price) : 'N/A'}</span>
        </td>
        <td>
            <div class="price-change ${priceChange.class}">
                <span>${priceChange.icon}</span>
                <span>${priceChange.text}</span>
            </div>
        </td>
        <td>
            <span class="stock-badge ${product.in_stock ? 'in-stock' : 'out-of-stock'}">
                ${product.in_stock ? '✅ En stock' : '❌ Sin stock'}
            </span>
        </td>
        <td>
            <span title="${formatDate(product.updated_at)}">${timeAgo}</span>
        </td>
        <td>
            <div class="actions-cell">
                <button class="btn btn-primary action-btn-small" onclick="viewProduct(${product.id})">
                    👁️ Ver
                </button>
                <button class="btn btn-secondary action-btn-small" onclick="openProductUrl('${product.url}')">
                    🔗 Ir
                </button>
            </div>
        </td>
    `;
    
    return row;
}

// Display products in cards format
function displayProductsCards() {
    const cardsContainer = document.getElementById('products-grid');
    if (!cardsContainer) return;
    
    cardsContainer.innerHTML = '';
    
    if (currentProducts.length === 0) {
        cardsContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: var(--space-8);">
                <div style="font-size: 4rem; margin-bottom: var(--space-4); opacity: 0.5;">📦</div>
                <h3>No se encontraron productos</h3>
                <p style="color: var(--text-secondary);">Intenta ajustar los filtros o realizar un nuevo scraping.</p>
                <button class="btn btn-primary" onclick="triggerScraping()">Ejecutar Scraping</button>
            </div>
        `;
        return;
    }
    
    // Get products for current page
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageProducts = currentProducts.slice(start, end);
    
    pageProducts.forEach(product => {
        const card = createProductCard(product);
        cardsContainer.appendChild(card);
    });
}

// Create product card
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card animate-scale-in';
    
    const priceChange = getPriceChangeIndicator(product.current_price, product.previous_price);
    const timeAgo = formatTimeAgo(product.updated_at);
    
    card.innerHTML = `
        <img class="product-card-image" 
             src="${product.image_url}" 
             alt="${product.name}"
             onerror="this.src='https://via.placeholder.com/300x200?text=📦'">
        
        <div class="product-card-content">
            <div class="product-card-header">
                <h3 class="product-card-name">
                    ${product.name}
                    ${product.is_new ? ' ✨' : ''}
                </h3>
                <div class="product-card-store">
                    ${getStoreEmoji(product.store.name)} ${product.store.name}
                </div>
            </div>
            
            <div class="product-card-price">
                ${formatCurrency(product.current_price)}
            </div>
            
            ${priceChange.text !== 'Nuevo' ? `
                <div class="price-change ${priceChange.class}" style="margin-bottom: var(--space-3);">
                    <span>${priceChange.icon}</span>
                    <span>${priceChange.text}</span>
                </div>
            ` : ''}
            
            <div class="product-card-meta">
                <span class="stock-badge ${product.in_stock ? 'in-stock' : 'out-of-stock'}">
                    ${product.in_stock ? '✅' : '❌'}
                </span>
                <span style="font-size: 0.75rem; color: var(--text-tertiary);">${timeAgo}</span>
            </div>
            
            <div style="margin-top: var(--space-4); display: flex; gap: var(--space-2);">
                <button class="btn btn-primary" onclick="viewProduct(${product.id})" style="flex: 1;">
                    👁️ Ver Detalles
                </button>
                <button class="btn btn-secondary" onclick="openProductUrl('${product.url}')">
                    🔗
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// Setup pagination
function setupPagination() {
    const totalPages = Math.ceil(currentProducts.length / itemsPerPage);
    const paginationContainer = document.getElementById('pagination');
    
    if (!paginationContainer || totalPages <= 1) {
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
            ← Anterior
        </button>
    `;
    
    // Page numbers
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
        paginationHTML += `
            <button class="${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }
    
    // Next button
    paginationHTML += `
        <button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
            Siguiente →
        </button>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
}

// Change page
function changePage(page) {
    if (page < 1 || page > Math.ceil(currentProducts.length / itemsPerPage)) return;
    
    currentPage = page;
    displayProducts();
    setupPagination();
    scrollToTop();
}

// Update results count
function updateResultsCount() {
    const countElement = document.getElementById('results-count');
    if (countElement) {
        countElement.textContent = formatNumber(currentProducts.length);
    }
}

// Load recent activity
async function loadRecentActivity() {
    try {
        const activityList = document.getElementById('activity-list');
        if (!activityList) return;
        
        // Generate mock activity
        const activities = generateMockActivity(10);
        
        activityList.innerHTML = '';
        
        activities.forEach(activity => {
            const item = createElement('div', 'activity-item animate-slide-in');
            
            item.innerHTML = `
                <div class="activity-icon" style="background-color: ${activity.color};">
                    ${activity.icon}
                </div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-description">${activity.description}</div>
                    <div class="activity-time">${activity.time}</div>
                </div>
            `;
            
            activityList.appendChild(item);
        });
        
    } catch (error) {
        console.error('Error loading activity:', error);
    }
}

// Generate mock activity
function generateMockActivity(count) {
    const activities = [];
    const types = [
        {
            icon: '📈',
            color: 'var(--success-light)',
            title: 'Precio subió',
            getDescription: () => {
                const product = currentProducts[Math.floor(Math.random() * currentProducts.length)];
                return product ? `${product.name} aumentó su precio` : 'Precio actualizado';
            }
        },
        {
            icon: '📉',
            color: 'var(--info-light)',
            title: 'Precio bajó',
            getDescription: () => {
                const product = currentProducts[Math.floor(Math.random() * currentProducts.length)];
                return product ? `${product.name} redujo su precio` : 'Precio actualizado';
            }
        },
        {
            icon: '✨',
            color: 'var(--warning-light)',
            title: 'Producto nuevo',
            getDescription: () => {
                const store = stores[Math.floor(Math.random() * stores.length)];
                return `Nuevo producto encontrado en ${store.name}`;
            }
        },
        {
            icon: '🔄',
            color: 'var(--primary-light)',
            title: 'Scraping completado',
            getDescription: () => {
                const count = Math.floor(Math.random() * 50) + 10;
                return `${count} productos actualizados`;
            }
        }
    ];
    
    for (let i = 0; i < count; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const time = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000);
        
        activities.push({
            ...type,
            description: type.getDescription(),
            time: formatTimeAgo(time.toISOString())
        });
    }
    
    return activities;
}

// Setup event listeners
function setupEventListeners() {
    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', handleRefresh);
    }
    
    // View toggle buttons
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', handleViewToggle);
    });
    
    // Filter inputs
    const filterInputs = [
        'store-filter',
        'search-filter',
        'min-price',
        'max-price',
        'sort-filter',
        'only-new',
        'price-changed',
        'in-stock'
    ];
    
    filterInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            const event = element.type === 'checkbox' ? 'change' : 'input';
            element.addEventListener(event, debounce(handleFilterChange, 300));
        }
    });
    
    // Filter buttons
    const applyBtn = document.getElementById('apply-filters');
    const clearBtn = document.getElementById('clear-filters');
    
    if (applyBtn) applyBtn.addEventListener('click', applyFilters);
    if (clearBtn) clearBtn.addEventListener('click', clearFilters);
    
    // Table sorting
    const sortableHeaders = document.querySelectorAll('.products-table th.sortable');
    sortableHeaders.forEach(header => {
        header.addEventListener('click', handleSort);
    });
}

// Handle refresh
async function handleRefresh() {
    const refreshBtn = document.getElementById('refresh-btn');
    if (!refreshBtn) return;
    
    refreshBtn.classList.add('loading');
    refreshBtn.disabled = true;
    
    try {
        await Promise.all([
            loadStats(),
            loadProducts(),
            loadRecentActivity()
        ]);
        
        updateLastRefreshTime();
        showToast('Actualizado', 'Datos actualizados correctamente', 'success');
        
    } catch (error) {
        console.error('Error refreshing:', error);
        showToast('Error', 'Error actualizando datos', 'error');
    } finally {
        refreshBtn.classList.remove('loading');
        refreshBtn.disabled = false;
    }
}

// Handle view toggle
function handleViewToggle(event) {
    const clickedBtn = event.target;
    const view = clickedBtn.dataset.view;
    
    // Update active state
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    clickedBtn.classList.add('active');
    
    // Show/hide views
    const tableView = document.getElementById('table-view');
    const cardsView = document.getElementById('cards-view');
    
    if (view === 'table') {
        tableView.style.display = 'block';
        cardsView.style.display = 'none';
    } else {
        tableView.style.display = 'none';
        cardsView.style.display = 'block';
    }
    
    displayProducts();
    
    // Store preference
    storeData('preferred-view', view);
}

// Handle filter changes
function handleFilterChange() {
    currentFilters = {
        store: document.getElementById('store-filter')?.value || '',
        search: document.getElementById('search-filter')?.value || '',
        minPrice: parseFloat(document.getElementById('min-price')?.value) || null,
        maxPrice: parseFloat(document.getElementById('max-price')?.value) || null,
        sort: document.getElementById('sort-filter')?.value || 'updated_at-desc',
        onlyNew: document.getElementById('only-new')?.checked || false,
        priceChanged: document.getElementById('price-changed')?.checked || false,
        inStock: document.getElementById('in-stock')?.checked || false
    };
    
    applyFilters();
}

// Apply filters
function applyFilters() {
    let filteredProducts = [...generateMockProducts(100)]; // Start with all products
    
    // Store filter
    if (currentFilters.store) {
        filteredProducts = filteredProducts.filter(p => p.store.id == currentFilters.store);
    }
    
    // Search filter
    if (currentFilters.search) {
        const searchTerm = currentFilters.search.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            p.store.name.toLowerCase().includes(searchTerm)
        );
    }
    
    // Price filters
    if (currentFilters.minPrice) {
        filteredProducts = filteredProducts.filter(p => p.current_price >= currentFilters.minPrice);
    }
    
    if (currentFilters.maxPrice) {
        filteredProducts = filteredProducts.filter(p => p.current_price <= currentFilters.maxPrice);
    }
    
    // Checkbox filters
    if (currentFilters.onlyNew) {
        filteredProducts = filteredProducts.filter(p => p.is_new);
    }
    
    if (currentFilters.priceChanged) {
        filteredProducts = filteredProducts.filter(p => p.current_price !== p.previous_price);
    }
    
    if (currentFilters.inStock) {
        filteredProducts = filteredProducts.filter(p => p.in_stock);
    }
    
    // Apply sorting
    if (currentFilters.sort) {
        const [field, order] = currentFilters.sort.split('-');
        filteredProducts.sort((a, b) => {
            let aVal = a[field];
            let bVal = b[field];
            
            if (field === 'store') {
                aVal = a.store.name;
                bVal = b.store.name;
            }
            
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            if (order === 'desc') {
                return aVal < bVal ? 1 : -1;
            } else {
                return aVal > bVal ? 1 : -1;
            }
        });
    }
    
    currentProducts = filteredProducts;
    currentPage = 1;
    
    displayProducts();
    updateResultsCount();
    setupPagination();
}

// Clear filters
function clearFilters() {
    // Reset form elements
    document.getElementById('store-filter').value = '';
    document.getElementById('search-filter').value = '';
    document.getElementById('min-price').value = '';
    document.getElementById('max-price').value = '';
    document.getElementById('sort-filter').value = 'updated_at-desc';
    document.getElementById('only-new').checked = false;
    document.getElementById('price-changed').checked = false;
    document.getElementById('in-stock').checked = false;
    
    // Reset filters
    currentFilters = {};
    
    // Reload products
    loadProducts();
    
    showToast('Filtros', 'Filtros limpiados', 'info');
}

// Handle table sorting
function handleSort(event) {
    const header = event.target;
    const field = header.dataset.sort;
    
    // Update sort state
    if (currentSort.field === field) {
        currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.field = field;
        currentSort.order = 'asc';
    }
    
    // Update header classes
    document.querySelectorAll('.products-table th').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
    });
    header.classList.add(`sort-${currentSort.order}`);
    
    // Update sort filter and apply
    document.getElementById('sort-filter').value = `${field}-${currentSort.order}`;
    handleFilterChange();
}

// Update last refresh time
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

// Setup auto refresh
function setupAutoRefresh() {
    // Refresh data every 5 minutes
    setInterval(async () => {
        try {
            await loadStats();
            await loadRecentActivity();
            updateLastRefreshTime();
            
            console.log('🔄 Auto-refresh completed');
        } catch (error) {
            console.error('Auto-refresh error:', error);
        }
    }, 5 * 60 * 1000);
}

// Product actions
function viewProduct(productId) {
    // Navigate to product detail page
    window.location.href = `/product.html?id=${productId}`;
}

function openProductUrl(url) {
    if (url) {
        window.open(url, '_blank');
    }
}

// Global functions for buttons
window.triggerScraping = function() {
    showModal('scraping-modal');
    populateScrapingModal();
};

window.exportData = function() {
    const data = currentProducts.map(product => ({
        nombre: product.name,
        tienda: product.store.name,
        precio_actual: product.current_price,
        precio_anterior: product.previous_price,
        moneda: product.currency,
        en_stock: product.in_stock,
        es_nuevo: product.is_new,
        url: product.url,
        actualizado: product.updated_at
    }));
    
    const filename = `productos_tiendanube_${new Date().toISOString().split('T')[0]}.json`;
    downloadJSON(data, filename);
    
    showToast('Exportar', `${data.length} productos exportados`, 'success');
};

window.viewAlerts = function() {
    showToast('Alertas', 'Sistema de alertas próximamente', 'info');
};

window.openSettings = function() {
    showToast('Configuración', 'Panel de configuración próximamente', 'info');
};

// Populate scraping modal
function populateScrapingModal() {
    const storeSelection = document.getElementById('store-selection');
    if (!storeSelection) return;
    
    storeSelection.innerHTML = '';
    
    stores.forEach(store => {
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        label.innerHTML = `
            <input type="checkbox" value="${store.id}" checked>
            <span class="checkbox-custom"></span>
            ${getStoreEmoji(store.name)} ${store.name}
        `;
        storeSelection.appendChild(label);
    });
}

// Start scraping
window.startScraping = async function() {
    const progressContainer = document.getElementById('scraping-progress');
    const optionsContainer = document.querySelector('.scraping-options');
    
    if (!progressContainer || !optionsContainer) return;
    
    optionsContainer.style.display = 'none';
    progressContainer.style.display = 'block';
    
    try {
        // Simulate scraping process
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        const progressLogs = document.getElementById('progress-logs');
        
        const steps = [
            'Iniciando scraping...',
            'Conectando con Shiva Home...',
            'Extrayendo productos de Shiva Home...',
            'Conectando con Nimba...',
            'Extrayendo productos de Nimba...',
            'Conectando con Vienna Hogar...',
            'Extrayendo productos de Vienna Hogar...',
            'Procesando datos...',
            'Guardando en base de datos...',
            'Scraping completado!'
        ];
        
        for (let i = 0; i < steps.length; i++) {
            const progress = ((i + 1) / steps.length) * 100;
            
            progressFill.style.width = `${progress}%`;
            progressText.textContent = steps[i];
            
            const logEntry = document.createElement('div');
            logEntry.textContent = `${new Date().toLocaleTimeString()} - ${steps[i]}`;
            progressLogs.appendChild(logEntry);
            progressLogs.scrollTop = progressLogs.scrollHeight;
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Show completion
        showToast('Scraping', 'Scraping completado exitosamente', 'success');
        
        setTimeout(() => {
            closeModal();
            handleRefresh();
        }, 2000);
        
    } catch (error) {
        console.error('Scraping error:', error);
        showToast('Error', 'Error durante el scraping', 'error');
        
        // Reset modal
        optionsContainer.style.display = 'block';
        progressContainer.style.display = 'none';
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeDashboard);