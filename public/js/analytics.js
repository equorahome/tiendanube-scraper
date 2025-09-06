// Analytics Dashboard JavaScript
let currentPeriod = 30;
let analyticsData = null;
let charts = {};

// Initialize analytics page
function initializeAnalyticsPage() {
    console.log('Initializing analytics page...');
    
    // Load analytics data
    loadAnalyticsData();
    
    // Set up event listeners
    setupEventListeners();
}

// Load analytics data from API or generate mock data
async function loadAnalyticsData() {
    try {
        showLoading();
        
        // Try to load from API first
        const response = await fetch('/api/analytics');
        if (response.ok) {
            analyticsData = await response.json();
        } else {
            // Generate mock data if API is not available
            analyticsData = generateMockAnalyticsData();
        }
        
        renderAnalyticsDashboard();
        hideLoading();
        
    } catch (error) {
        console.log('API not available, using mock data');
        analyticsData = generateMockAnalyticsData();
        renderAnalyticsDashboard();
        hideLoading();
    }
}

// Generate comprehensive mock analytics data
function generateMockAnalyticsData() {
    const stores = [
        { name: 'Shiva Home', domain: 'shivahome.com.ar', active: true },
        { name: 'Bazar Nuba', domain: 'bazarnuba.com.ar', active: true },
        { name: 'Nimba', domain: 'nimba.com.ar', active: true },
        { name: 'Vienna Hogar', domain: 'viennahogar.com.ar', active: true },
        { name: 'Magnolias Deco', domain: 'magnoliasdeco.com.ar', active: false },
        { name: 'Duvet', domain: 'duvet.com.ar', active: true },
        { name: 'Ganga Home', domain: 'gangahome.com.ar', active: true },
        { name: 'Binah Deco', domain: 'binahdeco.com.ar', active: true }
    ];

    // Generate time series data for the last 90 days
    const timeSeriesData = [];
    const now = new Date();
    
    for (let i = 90; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        timeSeriesData.push({
            date: date.toISOString().split('T')[0],
            avgPrice: 50000 + Math.random() * 100000 + Math.sin(i / 10) * 20000,
            priceChanges: Math.floor(Math.random() * 50) + 10,
            newProducts: Math.floor(Math.random() * 20),
            totalProducts: 500 + i * 2 + Math.random() * 100
        });
    }

    // Generate store performance data
    const storePerformance = stores.map(store => ({
        name: store.name,
        domain: store.domain,
        active: store.active,
        products: Math.floor(Math.random() * 200) + 50,
        avgPrice: Math.floor(Math.random() * 150000) + 20000,
        minPrice: Math.floor(Math.random() * 20000) + 5000,
        maxPrice: Math.floor(Math.random() * 500000) + 100000,
        priceChanges30d: Math.floor(Math.random() * 100) + 10,
        trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.3 ? 'down' : 'neutral',
        trendValue: (Math.random() - 0.5) * 20
    }));

    // Generate category data
    const categories = [
        { name: 'Decoración', count: 150, color: '#3b82f6' },
        { name: 'Muebles', count: 120, color: '#10b981' },
        { name: 'Iluminación', count: 80, color: '#f59e0b' },
        { name: 'Textiles', count: 100, color: '#ef4444' },
        { name: 'Cocina', count: 90, color: '#8b5cf6' },
        { name: 'Jardín', count: 60, color: '#06b6d4' }
    ];

    return {
        overview: {
            totalProducts: storePerformance.reduce((sum, store) => sum + store.products, 0),
            avgPrice: Math.floor(storePerformance.reduce((sum, store) => sum + store.avgPrice, 0) / storePerformance.length),
            totalPriceChanges: storePerformance.reduce((sum, store) => sum + store.priceChanges30d, 0),
            activeStores: storePerformance.filter(store => store.active).length,
            inactiveStores: storePerformance.filter(store => !store.active).length
        },
        timeSeries: timeSeriesData,
        stores: storePerformance,
        categories: categories,
        insights: generateMockInsights()
    };
}

// Generate mock insights
function generateMockInsights() {
    return [
        {
            type: 'opportunity',
            icon: '💡',
            title: 'Oportunidad de Arbitraje',
            description: 'Detectamos diferencias significativas de precio en productos similares entre Nimba y Vienna Hogar. Promedio de 15% de diferencia en decoración.'
        },
        {
            type: 'warning',
            icon: '⚠️',
            title: 'Inflación Acelerada',
            description: 'Los precios han aumentado un 8.5% en el último mes, superando la inflación general. Las categorías más afectadas son muebles e iluminación.'
        },
        {
            type: 'info',
            icon: '📊',
            title: 'Patrón de Precios',
            description: 'Shiva Home tiende a ajustar precios los martes, mientras que Duvet lo hace los viernes. Esto podría indicar diferentes estrategias de pricing.'
        },
        {
            type: 'opportunity',
            icon: '🎯',
            title: 'Categoría Emergente',
            description: 'Los productos de jardín han mostrado el mayor crecimiento en variedad (+25%) pero menor volatilidad de precios, sugiriendo un mercado en expansión.'
        },
        {
            type: 'warning',
            icon: '📉',
            title: 'Actividad Reducida',
            description: 'Magnolias Deco no ha actualizado precios en 15 días. Podría indicar problemas técnicos o cambios en su estrategia comercial.'
        },
        {
            type: 'info',
            icon: '🔄',
            title: 'Ciclo de Restock',
            description: 'Detectamos un patrón de restock cada 2-3 semanas en promedio, con Bazar Nuba siendo la más consistente en sus actualizaciones de inventario.'
        }
    ];
}

// Render complete analytics dashboard
function renderAnalyticsDashboard() {
    renderOverviewStats();
    renderCharts();
    renderStorePerformanceTable();
    renderInsights();
}

// Render overview statistics cards
function renderOverviewStats() {
    const { overview, timeSeries } = analyticsData;
    
    // Calculate changes
    const currentData = timeSeries[timeSeries.length - 1];
    const previousData = timeSeries[timeSeries.length - 8]; // Week ago
    
    const productsChange = currentData.totalProducts - previousData.totalProducts;
    const priceChange = ((currentData.avgPrice - previousData.avgPrice) / previousData.avgPrice * 100).toFixed(1);
    const activityChange = ((currentData.priceChanges - previousData.priceChanges) / previousData.priceChanges * 100).toFixed(1);
    
    // Update overview cards
    document.getElementById('total-products').textContent = formatNumber(overview.totalProducts);
    document.getElementById('avg-price').textContent = formatPrice(overview.avgPrice);
    document.getElementById('price-changes').textContent = formatNumber(overview.totalPriceChanges);
    document.getElementById('active-stores').textContent = overview.activeStores;
    
    // Update change indicators
    updateChangeIndicator('products-change', productsChange, 'este período', true);
    updateChangeIndicator('price-change', priceChange, '% vs anterior', false, '%');
    updateChangeIndicator('changes-trend', activityChange, '% actividad', false, '%');
    
    const storesStatus = overview.inactiveStores > 0 
        ? `${Math.round((overview.activeStores / (overview.activeStores + overview.inactiveStores)) * 100)}% operativas`
        : '100% operativas';
    document.getElementById('stores-status').textContent = storesStatus;
}

// Update change indicator styling and content
function updateChangeIndicator(elementId, value, suffix, isCount = false, prefix = '') {
    const element = document.getElementById(elementId);
    const numValue = parseFloat(value);
    
    let displayValue = isCount ? 
        `${numValue >= 0 ? '+' : ''}${Math.abs(numValue)} ${suffix}` :
        `${numValue >= 0 ? '+' : ''}${Math.abs(numValue)}${prefix} ${suffix}`;
    
    element.textContent = displayValue;
    element.className = `overview-change ${numValue >= 0 ? 'change-positive' : 'change-negative'}`;
}

// Render all charts
function renderCharts() {
    renderPriceEvolutionChart();
    renderStorePerformanceChart();
    renderCategoryChart();
    renderMarketActivityChart();
}

// Price evolution line chart
function renderPriceEvolutionChart() {
    const ctx = document.getElementById('price-evolution-chart').getContext('2d');
    
    // Filter data based on current period
    const filteredData = filterDataByPeriod(analyticsData.timeSeries);
    
    if (charts.priceEvolution) {
        charts.priceEvolution.destroy();
    }
    
    charts.priceEvolution = new Chart(ctx, {
        type: 'line',
        data: {
            labels: filteredData.map(d => formatDateShort(d.date)),
            datasets: [{
                label: 'Precio Promedio',
                data: filteredData.map(d => d.avgPrice),
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

// Store performance bar chart
function renderStorePerformanceChart() {
    const ctx = document.getElementById('store-performance-chart').getContext('2d');
    const stores = analyticsData.stores.filter(store => store.active);
    
    if (charts.storePerformance) {
        charts.storePerformance.destroy();
    }
    
    charts.storePerformance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: stores.map(store => store.name),
            datasets: [{
                label: 'Productos',
                data: stores.map(store => store.products),
                backgroundColor: '#10b981'
            }, {
                label: 'Cambios de precio (30d)',
                data: stores.map(store => store.priceChanges30d),
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

// Category distribution doughnut chart
function renderCategoryChart() {
    const ctx = document.getElementById('category-chart').getContext('2d');
    const categories = analyticsData.categories;
    
    if (charts.categories) {
        charts.categories.destroy();
    }
    
    charts.categories = new Chart(ctx, {
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

// Market activity area chart
function renderMarketActivityChart() {
    const ctx = document.getElementById('market-activity-chart').getContext('2d');
    const filteredData = filterDataByPeriod(analyticsData.timeSeries);
    
    if (charts.marketActivity) {
        charts.marketActivity.destroy();
    }
    
    charts.marketActivity = new Chart(ctx, {
        type: 'line',
        data: {
            labels: filteredData.map(d => formatDateShort(d.date)),
            datasets: [{
                label: 'Cambios de precio',
                data: filteredData.map(d => d.priceChanges),
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                fill: '+1'
            }, {
                label: 'Nuevos productos',
                data: filteredData.map(d => d.newProducts),
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

// Render store performance table
function renderStorePerformanceTable() {
    const tbody = document.getElementById('stores-tbody');
    const stores = analyticsData.stores;
    
    tbody.innerHTML = stores.map(store => `
        <tr>
            <td>
                <div class="store-name">
                    <span class="store-status status-${store.active ? 'active' : 'inactive'}"></span>
                    <span>${store.name}</span>
                </div>
            </td>
            <td>${formatNumber(store.products)}</td>
            <td>${formatPrice(store.avgPrice)}</td>
            <td>${formatPrice(store.minPrice)} - ${formatPrice(store.maxPrice)}</td>
            <td>${store.priceChanges30d}</td>
            <td>
                <div class="trend-indicator trend-${store.trend}">
                    ${getTrendIcon(store.trend)}
                    <span>${store.trendValue >= 0 ? '+' : ''}${store.trendValue.toFixed(1)}%</span>
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

// Render insights cards
function renderInsights() {
    const grid = document.getElementById('insights-grid');
    const insights = analyticsData.insights;
    
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
    document.querySelector(`[data-period="${period}"]`).classList.add('active');
    
    // Re-render charts with new period
    renderCharts();
    
    // Update overview stats for new period
    renderOverviewStats();
}

// Filter data by current period
function filterDataByPeriod(data) {
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
        refreshBtn.addEventListener('click', loadAnalyticsData);
    }
    
    // Auto-refresh every 5 minutes
    setInterval(loadAnalyticsData, 5 * 60 * 1000);
}

// Loading states
function showLoading() {
    const loadingElements = document.querySelectorAll('.loading-spinner');
    loadingElements.forEach(el => el.style.display = 'flex');
}

function hideLoading() {
    const loadingElements = document.querySelectorAll('.loading-spinner');
    loadingElements.forEach(el => el.style.display = 'none');
}

// Utility functions
function formatDateShort(dateStr) {
    return new Date(dateStr).toLocaleDateString('es-AR', { 
        month: 'short', 
        day: 'numeric' 
    });
}

function formatNumber(num) {
    return new Intl.NumberFormat('es-AR').format(num);
}

function formatPrice(price) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0
    }).format(price);
}

// Toast notifications
function showToast(message, type = 'info') {
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
    } else {
        console.log(`Toast: ${message}`);
    }
}

// Global export for analytics functionality
window.analyticsApp = {
    loadAnalyticsData,
    changeDateFilter,
    exportChart
};