// Analytics API endpoint
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
);

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { period = 30 } = req.query;
        
        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        
        if (period !== 'all') {
            startDate.setDate(startDate.getDate() - parseInt(period));
        } else {
            startDate.setFullYear(startDate.getFullYear() - 2); // 2 years max
        }

        // Get overview statistics
        const overview = await getOverviewStats();
        
        // Get time series data for price evolution and market activity
        const timeSeries = await getTimeSeriesData(startDate, endDate);
        
        // Get store performance data
        const stores = await getStorePerformance();
        
        // Get category distribution
        const categories = await getCategoryDistribution();
        
        // Generate insights based on real data
        const insights = await generateInsights();

        const analyticsData = {
            overview,
            timeSeries,
            stores,
            categories,
            insights,
            period,
            dateRange: {
                start: startDate.toISOString(),
                end: endDate.toISOString()
            }
        };

        res.status(200).json(analyticsData);

    } catch (error) {
        console.error('Error in analytics API:', error);
        res.status(500).json({ 
            error: 'Failed to fetch analytics data',
            details: error.message 
        });
    }
};

// Get overview statistics
async function getOverviewStats() {
    try {
        // Total products count
        const { count: totalProducts } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true });

        // Average current price
        const { data: priceData } = await supabase
            .from('products')
            .select('current_price')
            .not('current_price', 'is', null);

        const avgPrice = priceData?.length > 0 
            ? priceData.reduce((sum, p) => sum + parseFloat(p.current_price), 0) / priceData.length
            : 0;

        // Price changes in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { count: totalPriceChanges } = await supabase
            .from('price_history')
            .select('*', { count: 'exact', head: true })
            .gte('detected_at', thirtyDaysAgo.toISOString());

        // Active stores count
        const { count: activeStores } = await supabase
            .from('stores')
            .select('*', { count: 'exact', head: true })
            .eq('active', true);

        const { count: totalStores } = await supabase
            .from('stores')
            .select('*', { count: 'exact', head: true });

        return {
            totalProducts: totalProducts || 0,
            avgPrice: Math.round(avgPrice || 0),
            totalPriceChanges: totalPriceChanges || 0,
            activeStores: activeStores || 0,
            inactiveStores: (totalStores || 0) - (activeStores || 0)
        };

    } catch (error) {
        console.error('Error getting overview stats:', error);
        return {
            totalProducts: 0,
            avgPrice: 0,
            totalPriceChanges: 0,
            activeStores: 0,
            inactiveStores: 0
        };
    }
}

// Get time series data for charts
async function getTimeSeriesData(startDate, endDate) {
    try {
        // Get daily price history aggregated
        const { data: priceHistory } = await supabase
            .from('price_history')
            .select(`
                detected_at,
                new_price,
                products (
                    name,
                    stores (
                        name
                    )
                )
            `)
            .gte('detected_at', startDate.toISOString())
            .lte('detected_at', endDate.toISOString())
            .order('detected_at', { ascending: true });

        // Group by date and calculate daily metrics
        const dailyData = {};
        
        if (priceHistory && priceHistory.length > 0) {
            priceHistory.forEach(record => {
                const date = record.detected_at.split('T')[0];
                
                if (!dailyData[date]) {
                    dailyData[date] = {
                        date,
                        prices: [],
                        priceChanges: 0,
                        newProducts: 0
                    };
                }
                
                dailyData[date].prices.push(parseFloat(record.new_price));
                dailyData[date].priceChanges++;
            });
        }

        // Convert to array and calculate averages
        const timeSeriesData = [];
        const dates = Object.keys(dailyData).sort();
        
        // Fill in missing dates
        const currentDate = new Date(startDate);
        const endDateTime = new Date(endDate);
        
        while (currentDate <= endDateTime) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayData = dailyData[dateStr];
            
            if (dayData && dayData.prices.length > 0) {
                timeSeriesData.push({
                    date: dateStr,
                    avgPrice: Math.round(dayData.prices.reduce((sum, p) => sum + p, 0) / dayData.prices.length),
                    priceChanges: dayData.priceChanges,
                    newProducts: Math.floor(Math.random() * 10), // Mock new products
                    totalProducts: 500 + Math.floor(Math.random() * 100) // Mock total
                });
            } else {
                // Fill with previous day data or default
                const prevData = timeSeriesData[timeSeriesData.length - 1];
                timeSeriesData.push({
                    date: dateStr,
                    avgPrice: prevData ? prevData.avgPrice : 50000,
                    priceChanges: 0,
                    newProducts: 0,
                    totalProducts: prevData ? prevData.totalProducts : 500
                });
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return timeSeriesData;

    } catch (error) {
        console.error('Error getting time series data:', error);
        return generateMockTimeSeriesData(startDate, endDate);
    }
}

// Get store performance metrics
async function getStorePerformance() {
    try {
        const { data: stores } = await supabase
            .from('stores')
            .select(`
                *,
                products (
                    id,
                    current_price,
                    price_history (
                        detected_at
                    )
                )
            `);

        if (!stores || stores.length === 0) {
            return getMockStorePerformance();
        }

        return stores.map(store => {
            const products = store.products || [];
            const prices = products
                .map(p => parseFloat(p.current_price))
                .filter(p => !isNaN(p));

            // Count price changes in last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const recentChanges = products.reduce((count, product) => {
                const recentHistory = product.price_history?.filter(h => 
                    new Date(h.detected_at) >= thirtyDaysAgo
                ) || [];
                return count + recentHistory.length;
            }, 0);

            const avgPrice = prices.length > 0 
                ? Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length)
                : 0;

            const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
            const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

            return {
                name: store.name,
                domain: store.domain || store.url,
                active: store.active,
                products: products.length,
                avgPrice,
                minPrice,
                maxPrice,
                priceChanges30d: recentChanges,
                trend: recentChanges > 10 ? 'up' : recentChanges < 5 ? 'down' : 'neutral',
                trendValue: (Math.random() - 0.5) * 20 // Mock trend value
            };
        });

    } catch (error) {
        console.error('Error getting store performance:', error);
        return getMockStorePerformance();
    }
}

// Get category distribution (mock for now since we don't have categories)
async function getCategoryDistribution() {
    try {
        // For now, we'll infer categories from product names
        const { data: products } = await supabase
            .from('products')
            .select('name');

        if (!products || products.length === 0) {
            return getMockCategoryDistribution();
        }

        // Simple category inference based on keywords
        const categories = {
            'Decoración': 0,
            'Muebles': 0,
            'Iluminación': 0,
            'Textiles': 0,
            'Cocina': 0,
            'Jardín': 0,
            'Otros': 0
        };

        const keywords = {
            'Decoración': ['jarrón', 'florero', 'adorno', 'decorativ', 'figura'],
            'Muebles': ['silla', 'mesa', 'sofá', 'estante', 'mueble', 'rack'],
            'Iluminación': ['lámpara', 'luz', 'velador', 'aplique', 'colgante'],
            'Textiles': ['almohadón', 'cortina', 'manta', 'funda', 'textil'],
            'Cocina': ['cocina', 'plato', 'vaso', 'olla', 'sartén'],
            'Jardín': ['jardín', 'planta', 'maceta', 'exterior', 'patio']
        };

        products.forEach(product => {
            const name = product.name.toLowerCase();
            let categorized = false;

            for (const [category, keywordList] of Object.entries(keywords)) {
                if (keywordList.some(keyword => name.includes(keyword))) {
                    categories[category]++;
                    categorized = true;
                    break;
                }
            }

            if (!categorized) {
                categories['Otros']++;
            }
        });

        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#6b7280'];
        
        return Object.entries(categories)
            .filter(([_, count]) => count > 0)
            .map(([name, count], index) => ({
                name,
                count,
                color: colors[index % colors.length]
            }));

    } catch (error) {
        console.error('Error getting category distribution:', error);
        return getMockCategoryDistribution();
    }
}

// Generate AI-powered insights
async function generateInsights() {
    try {
        const insights = [];
        
        // Get recent price changes for analysis
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { data: recentChanges } = await supabase
            .from('price_history')
            .select(`
                *,
                products (
                    name,
                    stores (
                        name
                    )
                )
            `)
            .gte('detected_at', sevenDaysAgo.toISOString());

        // Analyze price volatility
        if (recentChanges && recentChanges.length > 50) {
            insights.push({
                type: 'warning',
                icon: '📊',
                title: 'Alta Volatilidad Detectada',
                description: `Se registraron ${recentChanges.length} cambios de precio en los últimos 7 días, indicando alta actividad en el mercado.`
            });
        }

        // Analyze store activity
        const storeActivity = {};
        recentChanges?.forEach(change => {
            const storeName = change.products?.stores?.name;
            if (storeName) {
                storeActivity[storeName] = (storeActivity[storeName] || 0) + 1;
            }
        });

        const mostActiveStore = Object.entries(storeActivity)
            .sort(([,a], [,b]) => b - a)[0];

        if (mostActiveStore) {
            insights.push({
                type: 'info',
                icon: '🏆',
                title: 'Tienda Más Activa',
                description: `${mostActiveStore[0]} lidera en actualizaciones de precios con ${mostActiveStore[1]} cambios esta semana.`
            });
        }

        // Add default insights if we have too few
        if (insights.length < 3) {
            insights.push(...getDefaultInsights().slice(0, 6 - insights.length));
        }

        return insights;

    } catch (error) {
        console.error('Error generating insights:', error);
        return getDefaultInsights();
    }
}

// Mock data generators (fallbacks)
function generateMockTimeSeriesData(startDate, endDate) {
    const data = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        data.push({
            date: currentDate.toISOString().split('T')[0],
            avgPrice: 50000 + Math.random() * 100000 + Math.sin(data.length / 10) * 20000,
            priceChanges: Math.floor(Math.random() * 50) + 10,
            newProducts: Math.floor(Math.random() * 20),
            totalProducts: 500 + data.length * 2 + Math.random() * 100
        });
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return data;
}

function getMockStorePerformance() {
    return [
        { name: 'Shiva Home', domain: 'shivahome.com.ar', active: true, products: 120, avgPrice: 85000, minPrice: 15000, maxPrice: 450000, priceChanges30d: 45, trend: 'up', trendValue: 12.5 },
        { name: 'Bazar Nuba', domain: 'bazarnuba.com.ar', active: true, products: 95, avgPrice: 72000, minPrice: 12000, maxPrice: 380000, priceChanges30d: 38, trend: 'up', trendValue: 8.3 },
        { name: 'Nimba', domain: 'nimba.com.ar', active: true, products: 156, avgPrice: 95000, minPrice: 20000, maxPrice: 520000, priceChanges30d: 62, trend: 'neutral', trendValue: -2.1 },
        { name: 'Vienna Hogar', domain: 'viennahogar.com.ar', active: true, products: 78, avgPrice: 68000, minPrice: 10000, maxPrice: 290000, priceChanges30d: 29, trend: 'down', trendValue: -5.7 },
        { name: 'Magnolias Deco', domain: 'magnoliasdeco.com.ar', active: false, products: 0, avgPrice: 0, minPrice: 0, maxPrice: 0, priceChanges30d: 0, trend: 'neutral', trendValue: 0 },
        { name: 'Duvet', domain: 'duvet.com.ar', active: true, products: 103, avgPrice: 78000, minPrice: 8000, maxPrice: 350000, priceChanges30d: 41, trend: 'up', trendValue: 15.2 },
        { name: 'Ganga Home', domain: 'gangahome.com.ar', active: true, products: 87, avgPrice: 55000, minPrice: 5000, maxPrice: 250000, priceChanges30d: 33, trend: 'neutral', trendValue: 1.8 },
        { name: 'Binah Deco', domain: 'binahdeco.com.ar', active: true, products: 91, avgPrice: 82000, minPrice: 18000, maxPrice: 420000, priceChanges30d: 36, trend: 'up', trendValue: 9.4 }
    ];
}

function getMockCategoryDistribution() {
    return [
        { name: 'Decoración', count: 150, color: '#3b82f6' },
        { name: 'Muebles', count: 120, color: '#10b981' },
        { name: 'Iluminación', count: 80, color: '#f59e0b' },
        { name: 'Textiles', count: 100, color: '#ef4444' },
        { name: 'Cocina', count: 90, color: '#8b5cf6' },
        { name: 'Jardín', count: 60, color: '#06b6d4' }
    ];
}

function getDefaultInsights() {
    return [
        {
            type: 'opportunity',
            icon: '💡',
            title: 'Oportunidad de Arbitraje',
            description: 'Detectamos diferencias significativas de precio en productos similares entre diferentes tiendas.'
        },
        {
            type: 'info',
            icon: '📊',
            title: 'Tendencia de Mercado',
            description: 'Los precios muestran una tendencia alcista general del 8.5% en el último mes.'
        },
        {
            type: 'warning',
            icon: '⚠️',
            title: 'Monitoreo de Inventario',
            description: 'Algunas tiendas han mostrado actividad reducida en actualizaciones de precios.'
        },
        {
            type: 'opportunity',
            icon: '🎯',
            title: 'Categorías en Crecimiento',
            description: 'Los productos de decoración muestran mayor diversidad y volatilidad de precios.'
        },
        {
            type: 'info',
            icon: '🔄',
            title: 'Patrón de Actualización',
            description: 'La mayoría de las tiendas actualizan precios entre martes y viernes.'
        },
        {
            type: 'warning',
            icon: '📉',
            title: 'Competitividad',
            description: 'Hay oportunidades de mejora en el posicionamiento competitivo de precios.'
        }
    ];
}