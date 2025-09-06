// Analytics Dashboard JavaScript - SOLO DATOS REALES
// NO más datos mock o simulados

let currentPeriod = 30;
let analyticsData = null;
let charts = {};

// Initialize analytics page
function initializeAnalyticsPage() {
    console.log('📊 Initializing analytics page with REAL data only...');
    
    try {
        showLoadingState();
        
        // Load only real analytics data
        loadRealAnalyticsData();
        
        // Set up event listeners
        setupEventListeners();
        
        console.log('✅ Analytics page initialized with real data');
        
    } catch (error) {
        console.error('Error initializing analytics page:', error);
        showErrorState('Error cargando analíticas: ' + error.message);
    }
}

// Load real analytics data from API only
async function loadRealAnalyticsData() {
    try {
        console.log('Loading REAL analytics data from API...');
        
        const response = await fetch('/api/analytics');
        const data = await response.json();
        
        if (data && data.overview) {
            analyticsData = data;
            console.log('✅ Loaded real analytics data');
            
            renderAnalyticsDashboard();
            hideLoadingState();
        } else {
            console.log('No analytics data available');
            showEmptyAnalyticsState();
            hideLoadingState();
        }
        
    } catch (error) {
        console.error('Error loading analytics data:', error);
        showEmptyAnalyticsState();
        hideLoadingState();
    }
}

// Show empty state when no analytics data exists
function showEmptyAnalyticsState() {
    const mainContent = document.querySelector('.analytics-container');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="empty-state analytics-empty">
                <div class="empty-icon">📊</div>
                <h2>No hay datos analíticos aún</h2>
                <p>Para generar analíticas necesitas tener productos monitoreados en el sistema.</p>
                <div class="empty-actions">
                    <button onclick="runScraping()" class="btn btn-primary btn-large">
                        🚀 Ejecutar Scraping Primero
                    </button>
                    <a href="/index.html" class="btn btn-secondary btn-large">
                        ← Volver al Dashboard
                    </a>
                </div>
                <div class="empty-help">
                    <h3>¿Qué contienen las analíticas?</h3>
                    <ul>
                        <li>📈 Evolución de precios promedio por tienda</li>
                        <li>🏪 Rendimiento comparativo de tiendas</li>
                        <li>📊 Distribución de productos por categorías</li>
                        <li>⚡ Actividad del mercado y cambios de precios</li>
                        <li>🤖 Insights automáticos sobre tendencias</li>
                    </ul>
                </div>
            </div>
        `;
    }
}

// Render complete analytics dashboard with real data only
function renderAnalyticsDashboard() {
    if (!analyticsData) {
        showEmptyAnalyticsState();
        return;
    }
    
    renderOverviewStats();
    renderCharts();
    renderStorePerformanceTable();
    renderInsights();
}

// Render overview statistics cards
function renderOverviewStats() {
    const { overview } = analyticsData;
    
    // Update overview cards
    const totalProductsEl = document.getElementById('total-products');
    const avgPriceEl = document.getElementById('avg-price');
    const priceChangesEl = document.getElementById('price-changes');
    const activeStoresEl = document.getElementById('active-stores');
    
    if (totalProductsEl) {
        totalProductsEl.textContent = formatNumber(overview.totalProducts || 0);
    }
    
    if (avgPriceEl) {
        avgPriceEl.textContent = formatPrice(overview.avgPrice || 0);
    }
    
    if (priceChangesEl) {
        priceChangesEl.textContent = formatNumber(overview.totalPriceChanges || 0);
    }
    
    if (activeStoresEl) {
        activeStoresEl.textContent = overview.activeStores || 0;
    }
    
    // Update change indicators based on real data
    updateChangeIndicator('products-change', '0', 'este período', true);
    updateChangeIndicator('price-change', '0', '% vs anterior', false, '%');
    updateChangeIndicator('changes-trend', '0', '% actividad', false, '%');
    
    const storesStatus = overview.inactiveStores > 0 
        ? `${Math.round((overview.activeStores / (overview.activeStores + overview.inactiveStores)) * 100)}% operativas`
        : overview.activeStores > 0 ? '100% operativas' : 'Sin tiendas activas';
    
    const storesStatusEl = document.getElementById('stores-status');
    if (storesStatusEl) {
        storesStatusEl.textContent = storesStatus;
    }
}

// Update change indicator styling and content
function updateChangeIndicator(elementId, value, suffix, isCount = false, prefix = '') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const numValue = parseFloat(value);
    
    let displayValue = isCount ? 
        `${numValue >= 0 ? '+' : ''}${Math.abs(numValue)} ${suffix}` :
        `${numValue >= 0 ? '+' : ''}${Math.abs(numValue)}${prefix} ${suffix}`;
    
    element.textContent = displayValue;
    element.className = `overview-change ${numValue >= 0 ? 'change-positive' : 'change-negative'}`;
}

// Render all charts with real data only
function renderCharts() {
    if (!analyticsData || !analyticsData.timeSeries || analyticsData.timeSeries.length === 0) {
        showEmptyChartsState();
        return;
    }
    
    renderPriceEvolutionChart();
    renderStorePerformanceChart();
    renderCategoryChart();
    renderMarketActivityChart();
}

// Show empty state for charts
function showEmptyChartsState() {
    const chartsGrid = document.querySelector('.charts-grid');
    if (chartsGrid) {
        chartsGrid.innerHTML = `
            <div class="chart-empty-state">
                <div class="empty-icon">📈</div>
                <h3>Sin datos suficientes para gráficos</h3>
                <p>Los gráficos se generan automáticamente cuando hay suficientes datos históricos.</p>
            </div>
        `;
    }
}

// Price evolution line chart with real data
function renderPriceEvolutionChart() {
    const ctx = document.getElementById('price-evolution-chart');
    if (!ctx) return;
    
    const chartContext = ctx.getContext('2d');
    const filteredData = filterDataByPeriod(analyticsData.timeSeries);
    
    if (charts.priceEvolution) {
        charts.priceEvolution.destroy();
    }
    
    if (filteredData.length === 0) {
        chartContext.clearRect(0, 0, ctx.width, ctx.height);
        chartContext.fillText('Sin datos para el período seleccionado', 50, 50);
        return;
    }
    
    charts.priceEvolution = new Chart(chartContext, {
        type: 'line',
        data: {
            labels: filteredData.map(d => formatDateShort(d.date)),
            datasets: [{
                label: 'Precio Promedio Real',
                data: filteredData.map(d => d.avgPrice || 0),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4
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
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: value => formatPrice(value)
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: context => `Precio: ${formatPrice(context.parsed.y)}`
                    }
                },
                legend: {
                    display: false
                }
            }
        }
    });
}

// Store performance bar chart with real data
function renderStorePerformanceChart() {
    const ctx = document.getElementById('store-performance-chart');
    if (!ctx || !analyticsData.stores) return;
    
    const chartContext = ctx.getContext('2d');
    const stores = analyticsData.stores.filter(store => store.active && store.products > 0);
    
    if (charts.storePerformance) {
        charts.storePerformance.destroy();
    }
    
    if (stores.length === 0) {
        chartContext.clearRect(0, 0, ctx.width, ctx.height);
        chartContext.fillText('Sin tiendas activas con productos', 50, 50);
        return;
    }
    
    charts.storePerformance = new Chart(chartContext, {
        type: 'bar',
        data: {
            labels: stores.map(store => store.name),
            datasets: [{
                label: 'Productos',
                data: stores.map(store => store.products || 0),
                backgroundColor: '#10b981'
            }, {
                label: 'Cambios de precio (30d)',
                data: stores.map(store => store.priceChanges30d || 0),
                backgroundColor: '#f59e0b'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

// Category distribution doughnut chart with real data
function renderCategoryChart() {
    const ctx = document.getElementById('category-chart');
    if (!ctx || !analyticsData.categories) return;
    
    const chartContext = ctx.getContext('2d');
    const categories = analyticsData.categories.filter(cat => cat.count > 0);
    
    if (charts.categories) {
        charts.categories.destroy();
    }
    
    if (categories.length === 0) {
        chartContext.clearRect(0, 0, ctx.width, ctx.height);
        chartContext.fillText('Sin categorías detectadas', 50, 50);
        return;
    }
    
    charts.categories = new Chart(chartContext, {
        type: 'doughnut',
        data: {
            labels: categories.map(cat => cat.name),
            datasets: [{
                data: categories.map(cat => cat.count),
                backgroundColor: categories.map(cat => cat.color)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                },
                tooltip: {
                    callbacks: {
                        label: context => {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Market activity area chart with real data
function renderMarketActivityChart() {
    const ctx = document.getElementById('market-activity-chart');
    if (!ctx) return;
    
    const chartContext = ctx.getContext('2d');
    const filteredData = filterDataByPeriod(analyticsData.timeSeries);
    
    if (charts.marketActivity) {
        charts.marketActivity.destroy();
    }
    
    if (filteredData.length === 0) {
        chartContext.clearRect(0, 0, ctx.width, ctx.height);
        chartContext.fillText('Sin datos de actividad', 50, 50);
        return;
    }
    
    charts.marketActivity = new Chart(chartContext, {
        type: 'line',
        data: {
            labels: filteredData.map(d => formatDateShort(d.date)),
            datasets: [{
                label: 'Cambios de precio',
                data: filteredData.map(d => d.priceChanges || 0),
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                fill: '+1'
            }, {
                label: 'Nuevos productos',
                data: filteredData.map(d => d.newProducts || 0),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: 'origin'
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
                y: {
                    beginAtZero: true,
                    stacked: true
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

// Render store performance table with real data
function renderStorePerformanceTable() {
    const tbody = document.getElementById('stores-tbody');
    if (!tbody || !analyticsData.stores) return;
    
    const stores = analyticsData.stores;
    
    if (stores.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <p>No hay datos de tiendas disponibles</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = stores.map(store => `
        <tr>
            <td>
                <div class="store-name">
                    <span class="store-status status-${store.active ? 'active' : 'inactive'}"></span>
                    <span>${store.name}</span>
                </div>
            </td>
            <td>${formatNumber(store.products || 0)}</td>
            <td>${formatPrice(store.avgPrice || 0)}</td>
            <td>${formatPrice(store.minPrice || 0)} - ${formatPrice(store.maxPrice || 0)}</td>
            <td>${store.priceChanges30d || 0}</td>
            <td>
                <div class="trend-indicator trend-${store.trend || 'neutral'}">
                    ${getTrendIcon(store.trend || 'neutral')}
                    <span>${store.trendValue >= 0 ? '+' : ''}${(store.trendValue || 0).toFixed(1)}%</span>
                </div>
            </td>
            <td>
                <span class="badge ${store.active ? 'badge-success' : 'badge-danger'}">
                    ${store.active ? 'Activa' : 'Inactiva'}
                </span>
            </td>
        </tr>
    `).join('');
}

// Render insights cards with real data
function renderInsights() {
    const grid = document.getElementById('insights-grid');
    if (!grid) return;
    
    const insights = analyticsData.insights || [];
    
    if (insights.length === 0) {
        grid.innerHTML = `
            <div class="insight-card empty">
                <div class="insight-icon">🤖</div>
                <div class="insight-title">Sin insights disponibles</div>
                <div class="insight-description">
                    Los insights se generan automáticamente cuando hay suficientes datos históricos y actividad en el sistema.
                </div>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = insights.map(insight => `
        <div class="insight-card">
            <span class="insight-type insight-${insight.type}">
                ${insight.type === 'opportunity' ? 'OPORTUNIDAD' : 
                  insight.type === 'warning' ? 'ATENCIÓN' : 'INFORMACIÓN'}
            </span>
            <div class="insight-icon">${insight.icon}</div>
            <div class="insight-title">${insight.title}</div>
            <div class="insight-description">${insight.description}</div>
        </div>
    `).join('');
}

// Change date filter and update charts
function changeDateFilter(period) {
    currentPeriod = period;
    
    // Update active button
    document.querySelectorAll('.date-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[data-period="${period}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Re-render charts with new period
    renderCharts();
    renderOverviewStats();
}

// Filter data by current period
function filterDataByPeriod(data) {
    if (!data || data.length === 0) return [];
    
    if (currentPeriod === 'all') return data;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - currentPeriod);
    
    return data.filter(d => new Date(d.date) >= cutoffDate);
}

// Export chart as image
function exportChart(chartId) {
    const chartMapping = {
        'price-evolution': 'priceEvolution',
        'store-performance': 'storePerformance',
        'category-distribution': 'categories',
        'market-activity': 'marketActivity'
    };
    
    const chart = charts[chartMapping[chartId]];
    if (chart) {
        const url = chart.toBase64Image();
        const a = document.createElement('a');
        a.href = url;
        a.download = `${chartId}-${new Date().toISOString().split('T')[0]}.png`;
        a.click();
        
        showToast('Chart exported successfully', 'success');
    } else {
        showToast('No hay gráfico para exportar', 'warning');
    }
}

// Manual scraping function for analytics page
async function runScraping() {
    try {
        showToast('Scraping iniciado', 'Ejecutando scraping para generar datos analíticos...', 'info');
        
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
            
            // Reload analytics data after successful scraping
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

// Get trend icon
function getTrendIcon(trend) {
    switch (trend) {
        case 'up': return '↗️';
        case 'down': return '↘️';
        default: return '→';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Refresh data button if it exists
    const refreshBtn = document.getElementById('refresh-data');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadRealAnalyticsData);
    }
}

// Loading states
function showLoadingState() {
    document.body.classList.add('loading');
    
    const mainContent = document.querySelector('.analytics-container');
    if (mainContent) {
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner large"></div>
                <p>Cargando datos analíticos reales...</p>
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
    const mainContent = document.querySelector('.analytics-container');
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

// Utility functions
function formatDateShort(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('es-AR', { 
        month: 'short', 
        day: 'numeric' 
    });
}

function formatNumber(num) {
    return new Intl.NumberFormat('es-AR').format(num || 0);
}

function formatPrice(price) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0
    }).format(price || 0);
}

// Toast notifications
function showToast(title, message, type = 'info') {
    if (typeof window.showToast === 'function') {
        window.showToast(title, message, type);
    } else {
        console.log(`${type.toUpperCase()}: ${title} - ${message}`);
    }
}

// Global exports for analytics functionality
window.analyticsApp = {
    loadRealAnalyticsData,
    changeDateFilter,
    exportChart,
    runScraping
};

// Global functions for onclick handlers
window.changeDateFilter = changeDateFilter;
window.exportChart = exportChart;
window.runScraping = runScraping;

// No more mock data generation
// No more fake time series
// No more simulated insights
// Only real data from APIs