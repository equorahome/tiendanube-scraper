const TiendaNubeScraper = require('../lib/scraper');
const Database = require('../lib/database');
const TelegramNotifier = require('../lib/telegram');

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
    console.log('🚀 Iniciando proceso de scraping manual...');
    
    // Inicializar servicios
    const database = new Database();
    const scraper = new TiendaNubeScraper();
    const telegram = new TelegramNotifier();

    // Verificar conexión a base de datos
    const dbConnected = await database.testConnection();
    if (!dbConnected) {
      throw new Error('No se pudo conectar a la base de datos');
    }

    // Obtener tiendas activas
    const stores = await database.getActiveStores();
    if (stores.length === 0) {
      throw new Error('No se encontraron tiendas activas');
    }

    console.log(`📊 Scrapeando ${stores.length} tiendas...`);

    // Obtener parámetros de consulta
    const { store_id, notify = 'true', test = 'false' } = req.query;
    const shouldNotify = notify === 'true';
    const isTest = test === 'true';

    // Filtrar tiendas si se especifica una específica
    let targetStores = stores;
    if (store_id) {
      targetStores = stores.filter(store => store.id === parseInt(store_id));
      if (targetStores.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Tienda no encontrada'
        });
      }
    }

    // Notificar inicio si está habilitado
    if (shouldNotify && !isTest) {
      await telegram.notifyScrapingStart(targetStores);
    }

    // Realizar scraping
    const results = await scraper.scrapeMultipleStores(targetStores);
    
    // Procesar resultados y guardar en base de datos
    let newProducts = [];
    let priceChanges = [];
    let totalProductsProcessed = 0;

    for (const result of results) {
      if (!result.success) continue;

      const storeNewProducts = [];
      const storePriceChanges = [];

      // Procesar cada producto
      for (const product of result.products) {
        const upsertResult = await database.upsertProduct(product);
        totalProductsProcessed++;

        if (upsertResult.isNew) {
          storeNewProducts.push(product);
        } else if (upsertResult.hasChanges && upsertResult.changeType !== 'no_change') {
          storePriceChanges.push({
            ...product,
            change_type: upsertResult.changeType
          });
        }
      }

      // Actualizar estadísticas de la tienda
      await database.updateStoreLastScraped(result.store.id, result.products.length);

      newProducts = newProducts.concat(storeNewProducts);
      priceChanges = priceChanges.concat(storePriceChanges);
    }

    // Enviar notificaciones si está habilitado
    if (shouldNotify && !isTest) {
      // Notificar productos nuevos
      if (newProducts.length > 0) {
        await telegram.notifyNewProducts(newProducts);
      }

      // Notificar cambios de precio
      if (priceChanges.length > 0) {
        const recentChanges = await database.getRecentChanges(1); // Última hora
        await telegram.notifyPriceChanges(recentChanges);
      }

      // Notificar finalización
      await telegram.notifyScrapingComplete(results);
    }

    // Preparar respuesta
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    const response = {
      success: true,
      summary: {
        duration: parseFloat(duration),
        stores_processed: results.length,
        stores_successful: successful,
        stores_failed: failed,
        products_processed: totalProductsProcessed,
        new_products: newProducts.length,
        price_changes: priceChanges.length
      },
      results: results.map(r => ({
        store: r.store.name,
        success: r.success,
        products_found: r.products.length,
        duration: r.duration,
        error: r.error || null
      })),
      new_products: isTest ? newProducts.slice(0, 5) : [],
      price_changes: isTest ? priceChanges.slice(0, 5) : [],
      timestamp: new Date().toISOString()
    };

    console.log(`✅ Scraping completado: ${successful}/${results.length} tiendas, ${totalProductsProcessed} productos procesados`);

    return res.status(200).json(response);

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error('❌ Error en scraping:', error);

    // Notificar error por Telegram
    if (req.query.notify !== 'false') {
      try {
        const telegram = new TelegramNotifier();
        await telegram.notifyError(error.message, 'Scraping manual');
      } catch (telegramError) {
        console.error('❌ Error enviando notificación de error:', telegramError);
      }
    }

    return res.status(500).json({
      success: false,
      error: error.message,
      duration: parseFloat(duration),
      timestamp: new Date().toISOString()
    });
  }
};