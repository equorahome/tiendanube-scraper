// Product Comparison API endpoint
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
);

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            return await handleGetComparison(req, res);
        } else if (req.method === 'POST') {
            return await handleSearchProducts(req, res);
        } else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Error in compare API:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
};

// Handle GET request for product comparison
async function handleGetComparison(req, res) {
    const { ids } = req.query;
    
    if (!ids) {
        return res.status(400).json({ error: 'Product IDs are required' });
    }

    const productIds = ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    
    if (productIds.length === 0) {
        return res.status(400).json({ error: 'Valid product IDs are required' });
    }

    try {
        // Get products with their price history and store information
        const { data: products, error } = await supabase
            .from('products')
            .select(`
                *,
                stores (
                    name,
                    domain,
                    url
                ),
                price_history (
                    old_price,
                    new_price,
                    detected_at,
                    change_type
                )
            `)
            .in('id', productIds)
            .order('price_history(detected_at)', { ascending: false });

        if (error) {
            throw error;
        }

        if (!products || products.length === 0) {
            return res.status(404).json({ error: 'No products found' });
        }

        // Process products for comparison
        const comparisonData = products.map(product => {
            const priceHistory = product.price_history || [];
            const currentPrice = parseFloat(product.current_price) || 0;
            
            // Calculate price statistics
            const allPrices = priceHistory.map(h => parseFloat(h.new_price)).filter(p => !isNaN(p));
            allPrices.push(currentPrice);
            
            const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : currentPrice;
            const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : currentPrice;
            const avgPrice = allPrices.length > 0 ? 
                allPrices.reduce((sum, p) => sum + p, 0) / allPrices.length : currentPrice;

            // Calculate recent price trend (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const recentHistory = priceHistory.filter(h => 
                new Date(h.detected_at) >= thirtyDaysAgo
            ).slice(0, 10); // Last 10 changes

            const trend = calculatePriceTrend(recentHistory, currentPrice);

            return {
                id: product.id,
                name: product.name,
                url: product.url,
                image: product.image_url,
                store: product.stores ? {
                    name: product.stores.name,
                    domain: product.stores.domain,
                    url: product.stores.url
                } : null,
                pricing: {
                    current: currentPrice,
                    min: Math.round(minPrice),
                    max: Math.round(maxPrice),
                    average: Math.round(avgPrice)
                },
                statistics: {
                    priceChanges: priceHistory.length,
                    lastUpdate: product.last_updated,
                    created: product.created_at,
                    isAvailable: product.is_available
                },
                trend: trend,
                history: recentHistory.map(h => ({
                    price: parseFloat(h.new_price),
                    date: h.detected_at,
                    changeType: h.change_type
                }))
            };
        });

        // Generate comparison insights
        const insights = generateComparisonInsights(comparisonData);

        res.status(200).json({
            products: comparisonData,
            insights: insights,
            summary: {
                totalProducts: comparisonData.length,
                priceRange: {
                    min: Math.min(...comparisonData.map(p => p.pricing.current)),
                    max: Math.max(...comparisonData.map(p => p.pricing.current))
                },
                averagePrice: Math.round(
                    comparisonData.reduce((sum, p) => sum + p.pricing.current, 0) / comparisonData.length
                )
            }
        });

    } catch (error) {
        console.error('Error fetching comparison data:', error);
        res.status(500).json({ 
            error: 'Failed to fetch comparison data',
            details: error.message 
        });
    }
}

// Handle POST request for product search
async function handleSearchProducts(req, res) {
    const { query, limit = 10 } = req.body;
    
    if (!query || query.trim().length < 2) {
        return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    try {
        // Search products by name
        const { data: products, error } = await supabase
            .from('products')
            .select(`
                id,
                name,
                url,
                image_url,
                current_price,
                is_available,
                last_updated,
                stores (
                    name,
                    domain
                )
            `)
            .ilike('name', `%${query.trim()}%`)
            .eq('is_available', true)
            .order('last_updated', { ascending: false })
            .limit(parseInt(limit));

        if (error) {
            throw error;
        }

        const searchResults = (products || []).map(product => ({
            id: product.id,
            name: product.name,
            url: product.url,
            image: product.image_url,
            price: parseFloat(product.current_price) || 0,
            store: product.stores ? {
                name: product.stores.name,
                domain: product.stores.domain
            } : null,
            lastUpdate: product.last_updated
        }));

        res.status(200).json({
            results: searchResults,
            query: query.trim(),
            totalFound: searchResults.length
        });

    } catch (error) {
        console.error('Error searching products:', error);
        res.status(500).json({ 
            error: 'Failed to search products',
            details: error.message 
        });
    }
}

// Calculate price trend based on recent history
function calculatePriceTrend(recentHistory, currentPrice) {
    if (!recentHistory || recentHistory.length === 0) {
        return {
            direction: 'neutral',
            percentage: 0,
            description: 'Sin datos suficientes'
        };
    }

    // Get the oldest price in recent history
    const oldestPrice = parseFloat(recentHistory[recentHistory.length - 1].new_price);
    const priceDifference = currentPrice - oldestPrice;
    const percentageChange = oldestPrice > 0 ? (priceDifference / oldestPrice) * 100 : 0;

    let direction, description;
    
    if (Math.abs(percentageChange) < 1) {
        direction = 'neutral';
        description = 'Precio estable';
    } else if (percentageChange > 0) {
        direction = 'up';
        description = `Subió ${Math.abs(percentageChange).toFixed(1)}%`;
    } else {
        direction = 'down';
        description = `Bajó ${Math.abs(percentageChange).toFixed(1)}%`;
    }

    return {
        direction,
        percentage: Math.round(percentageChange * 100) / 100,
        description
    };
}

// Generate insights for product comparison
function generateComparisonInsights(products) {
    const insights = [];

    if (products.length < 2) {
        return [{
            type: 'info',
            icon: '📝',
            title: 'Comparación Simple',
            description: 'Agrega más productos para obtener insights más profundos sobre diferencias de precio y tendencias.'
        }];
    }

    // Find price leaders
    const sortedByPrice = [...products].sort((a, b) => a.pricing.current - b.pricing.current);
    const cheapest = sortedByPrice[0];
    const mostExpensive = sortedByPrice[sortedByPrice.length - 1];

    if (cheapest.id !== mostExpensive.id) {
        const priceDifference = mostExpensive.pricing.current - cheapest.pricing.current;
        const percentageDifference = ((priceDifference / cheapest.pricing.current) * 100).toFixed(1);

        insights.push({
            type: 'opportunity',
            icon: '💰',
            title: 'Diferencia de Precio Significativa',
            description: `${mostExpensive.name} cuesta ${percentageDifference}% más que ${cheapest.name}. Diferencia: ${formatPrice(priceDifference)}.`
        });
    }

    // Analyze price volatility
    const volatilityData = products.map(p => ({
        name: p.name,
        volatility: p.pricing.max - p.pricing.min,
        priceChanges: p.statistics.priceChanges
    }));

    const mostVolatile = volatilityData.reduce((max, current) => 
        current.volatility > max.volatility ? current : max
    );

    if (mostVolatile.volatility > 10000) {
        insights.push({
            type: 'warning',
            icon: '📊',
            title: 'Alta Volatilidad Detectada',
            description: `${mostVolatile.name} muestra la mayor variación de precio con ${formatPrice(mostVolatile.volatility)} de diferencia entre su precio máximo y mínimo.`
        });
    }

    // Analyze store distribution
    const storeDistribution = {};
    products.forEach(p => {
        if (p.store) {
            storeDistribution[p.store.name] = (storeDistribution[p.store.name] || 0) + 1;
        }
    });

    const storeEntries = Object.entries(storeDistribution);
    if (storeEntries.length > 1) {
        const dominantStore = storeEntries.reduce((max, current) => 
            current[1] > max[1] ? current : max
        );

        insights.push({
            type: 'info',
            icon: '🏪',
            title: 'Distribución por Tienda',
            description: `${dominantStore[0]} tiene ${dominantStore[1]} de los ${products.length} productos comparados. Considera diversificar fuentes para mejor análisis.`
        });
    }

    // Analyze update frequency
    const recentUpdates = products.filter(p => {
        const lastUpdate = new Date(p.statistics.lastUpdate);
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        return lastUpdate >= oneDayAgo;
    });

    if (recentUpdates.length < products.length / 2) {
        insights.push({
            type: 'warning',
            icon: '⏰',
            title: 'Datos Desactualizados',
            description: `${products.length - recentUpdates.length} productos no han sido actualizados en las últimas 24 horas. Los precios podrían haber cambiado.`
        });
    }

    // Price trend analysis
    const upwardTrends = products.filter(p => p.trend.direction === 'up').length;
    const downwardTrends = products.filter(p => p.trend.direction === 'down').length;

    if (upwardTrends > downwardTrends && upwardTrends > products.length / 2) {
        insights.push({
            type: 'info',
            icon: '📈',
            title: 'Tendencia Alcista General',
            description: `${upwardTrends} de ${products.length} productos muestran tendencia de precios al alza, sugiriendo inflación en esta categoría.`
        });
    } else if (downwardTrends > upwardTrends && downwardTrends > products.length / 2) {
        insights.push({
            type: 'opportunity',
            icon: '📉',
            title: 'Oportunidad de Compra',
            description: `${downwardTrends} de ${products.length} productos muestran tendencia bajista. Podría ser un buen momento para comprar.`
        });
    }

    return insights;
}

// Utility function to format price
function formatPrice(price) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0
    }).format(price);
}