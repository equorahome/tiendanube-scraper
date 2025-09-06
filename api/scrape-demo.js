const TiendaNubeScraper = require('../lib/scraper');
const { stores } = require('../lib/stores');

module.exports = async (req, res) => {
  const startTime = Date.now();
  
  // Configurar headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🧪 SCRAPING DEMO - Solo extracción, sin guardar en DB');
    
    const scraper = new TiendaNubeScraper();
    const { store_id = 1, limit = 1 } = req.query;

    // Filtrar tiendas
    let targetStores = stores.filter(store => store.active);
    if (store_id) {
      targetStores = targetStores.filter(store => store.id === parseInt(store_id));
    }

    // Limitar cantidad para demo
    targetStores = targetStores.slice(0, parseInt(limit));

    if (targetStores.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No se encontraron tiendas válidas'
      });
    }

    console.log(`🎯 Probando ${targetStores.length} tienda(s)...`);

    // Realizar scraping
    const results = await scraper.scrapeMultipleStores(targetStores);
    
    // Procesar resultados para demo
    const processedResults = results.map(result => ({
      store: {
        name: result.store.name,
        url: result.store.url,
        domain: result.store.domain
      },
      success: result.success,
      products_found: result.products?.length || 0,
      duration: result.duration,
      error: result.error || null,
      sample_products: result.success ? (result.products || []).slice(0, 5).map(p => ({
        name: p.name,
        price: p.current_price,
        currency: p.currency,
        url: p.url,
        image_url: p.image_url,
        in_stock: p.in_stock
      })) : []
    }));

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const successful = results.filter(r => r.success).length;
    const totalProducts = results.reduce((sum, r) => sum + (r.products?.length || 0), 0);

    const response = {
      success: true,
      demo_mode: true,
      summary: {
        duration: parseFloat(duration),
        stores_tested: results.length,
        stores_successful: successful,
        total_products_found: totalProducts,
        note: "Demo mode - Los datos NO se guardan en base de datos"
      },
      results: processedResults,
      timestamp: new Date().toISOString()
    };

    console.log(`✅ Demo completado: ${successful}/${results.length} tiendas, ${totalProducts} productos encontrados`);

    return res.status(200).json(response);

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error('❌ Error en demo:', error);

    return res.status(500).json({
      success: false,
      demo_mode: true,
      error: error.message,
      duration: parseFloat(duration),
      timestamp: new Date().toISOString()
    });
  }
};