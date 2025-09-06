const TiendaNubeScraper = require('../lib/scraper');
const Database = require('../lib/database');
const TelegramNotifier = require('../lib/telegram');

module.exports = async (req, res) => {
  const startTime = Date.now();
  
  console.log('🔔 Webhook de scraping automático activado');
  console.log('⏰', new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }));

  try {
    // Verificar que sea una llamada de cron job (opcional)
    const userAgent = req.headers['user-agent'];
    const isVercelCron = userAgent && userAgent.includes('vercel');
    
    if (process.env.NODE_ENV === 'production' && !isVercelCron) {
      console.log('⚠️ Llamada no autorizada al webhook');
      return res.status(401).json({
        success: false,
        error: 'No autorizado'
      });
    }

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
      console.log('⚠️ No hay tiendas activas para scrapear');
      return res.status(200).json({
        success: true,
        message: 'No hay tiendas activas',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🏪 Procesando ${stores.length} tiendas activas`);

    // Notificar inicio del scraping
    await telegram.notifyScrapingStart(stores);

    // Realizar scraping de todas las tiendas
    const results = await scraper.scrapeMultipleStores(stores);
    
    // Procesar resultados y guardar en base de datos
    let newProducts = [];
    let significantChanges = [];
    let totalProductsProcessed = 0;
    let storeStatuses = [];

    for (const result of results) {
      const storeStatus = {
        name: result.store.name,
        success: result.success,
        products_found: result.products.length,
        duration: result.duration,
        new_products: 0,
        price_changes: 0,
        error: result.error || null
      };

      if (!result.success) {
        storeStatuses.push(storeStatus);
        continue;
      }

      const storeNewProducts = [];
      const storeChanges = [];

      // Procesar cada producto
      for (const product of result.products) {
        try {
          const upsertResult = await database.upsertProduct(product);
          totalProductsProcessed++;

          if (upsertResult.isNew) {
            storeNewProducts.push({
              ...product,
              stores: { name: result.store.name }
            });
          } else if (upsertResult.hasChanges && upsertResult.changeType !== 'no_change') {
            // Solo notificar cambios significativos
            if (isSignificantChange(upsertResult.changeType, product.current_price, product.previous_price)) {
              storeChanges.push({
                ...product,
                change_type: upsertResult.changeType,
                stores: { name: result.store.name }
              });
            }
          }
        } catch (productError) {
          console.error(`❌ Error procesando producto ${product.name}:`, productError.message);
        }
      }

      // Actualizar estadísticas de la tienda
      await database.updateStoreLastScraped(result.store.id, result.products.length);

      storeStatus.new_products = storeNewProducts.length;
      storeStatus.price_changes = storeChanges.length;

      newProducts = newProducts.concat(storeNewProducts);
      significantChanges = significantChanges.concat(storeChanges);
      storeStatuses.push(storeStatus);
    }

    // Enviar notificaciones por Telegram
    try {
      // Notificar productos nuevos (máximo 20 por día)
      if (newProducts.length > 0) {
        const productsToNotify = newProducts.slice(0, 20);
        await telegram.notifyNewProducts(productsToNotify);
        
        if (newProducts.length > 20) {
          console.log(`📢 Se encontraron ${newProducts.length} productos nuevos, notificando solo los primeros 20`);
        }
      }

      // Notificar cambios significativos (máximo 15 por día)
      if (significantChanges.length > 0) {
        const changesToNotify = significantChanges.slice(0, 15);
        await telegram.notifyPriceChanges(changesToNotify);
        
        if (significantChanges.length > 15) {
          console.log(`📢 Se encontraron ${significantChanges.length} cambios, notificando solo los primeros 15`);
        }
      }

      // Notificar finalización
      await telegram.notifyScrapingComplete(results);

    } catch (notificationError) {
      console.error('❌ Error enviando notificaciones:', notificationError.message);
    }

    // Limpiar historial antiguo una vez por semana (aproximadamente)
    const shouldCleanup = Math.random() < 0.14; // ~1/7 chance
    if (shouldCleanup) {
      console.log('🧹 Ejecutando limpieza de historial antiguo...');
      await database.cleanupOldHistory(90); // Mantener 90 días
    }

    // Preparar respuesta
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    const response = {
      success: true,
      webhook_type: 'scheduled_scraping',
      summary: {
        duration: parseFloat(duration),
        stores_processed: results.length,
        stores_successful: successful,
        stores_failed: failed,
        products_processed: totalProductsProcessed,
        new_products: newProducts.length,
        significant_changes: significantChanges.length,
        cleanup_performed: shouldCleanup
      },
      stores: storeStatuses,
      timestamp: new Date().toISOString(),
      next_run: getNextRunTime()
    };

    console.log(`✅ Webhook completado: ${successful}/${results.length} tiendas, ${totalProductsProcessed} productos procesados`);
    console.log(`📈 ${newProducts.length} productos nuevos, ${significantChanges.length} cambios significativos`);

    return res.status(200).json(response);

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error('❌ Error en webhook:', error);

    // Notificar error crítico por Telegram
    try {
      const telegram = new TelegramNotifier();
      await telegram.notifyError(error.message, 'Webhook automático');
    } catch (telegramError) {
      console.error('❌ Error enviando notificación de error:', telegramError);
    }

    return res.status(500).json({
      success: false,
      webhook_type: 'scheduled_scraping',
      error: error.message,
      duration: parseFloat(duration),
      timestamp: new Date().toISOString()
    });
  }
};

// Función para determinar si un cambio es significativo
function isSignificantChange(changeType, currentPrice, previousPrice) {
  // Siempre notificar cambios de stock
  if (changeType === 'back_in_stock' || changeType === 'out_of_stock') {
    return true;
  }

  // Para cambios de precio, solo notificar si es significativo
  if (changeType === 'price_up' || changeType === 'price_down') {
    if (!previousPrice || previousPrice === 0) return false;
    
    const percentageChange = Math.abs(((currentPrice - previousPrice) / previousPrice) * 100);
    const absoluteChange = Math.abs(currentPrice - previousPrice);
    
    // Notificar si:
    // - Cambio >= 10% O
    // - Cambio absoluto >= $5000 (para productos caros) O
    // - Cambio absoluto >= $1000 (para productos baratos)
    return percentageChange >= 10 || 
           absoluteChange >= 5000 || 
           (previousPrice < 10000 && absoluteChange >= 1000);
  }

  return false;
}

// Función para obtener el próximo tiempo de ejecución
function getNextRunTime() {
  const now = new Date();
  const next = new Date();
  
  // Próxima ejecución a las 6:00 o 18:00
  if (now.getHours() < 6) {
    next.setHours(6, 0, 0, 0);
  } else if (now.getHours() < 18) {
    next.setHours(18, 0, 0, 0);
  } else {
    next.setDate(next.getDate() + 1);
    next.setHours(6, 0, 0, 0);
  }
  
  return next.toISOString();
}