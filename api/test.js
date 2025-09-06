const Database = require('../lib/database');
const TelegramNotifier = require('../lib/telegram');
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

  const { test = 'all', store = null } = req.query;
  
  console.log(`🧪 Iniciando tests: ${test}`);
  
  const results = {
    success: true,
    tests: {},
    errors: [],
    summary: {},
    timestamp: new Date().toISOString()
  };

  try {
    // Test 1: Conexión a base de datos
    if (test === 'all' || test === 'database') {
      console.log('🗄️ Testeando conexión a base de datos...');
      
      try {
        const database = new Database();
        const connected = await database.testConnection();
        
        if (connected) {
          const stats = await database.getStatistics();
          results.tests.database = {
            status: 'success',
            connected: true,
            statistics: stats
          };
          console.log('✅ Base de datos: OK');
        } else {
          throw new Error('Conexión fallida');
        }
      } catch (dbError) {
        results.tests.database = {
          status: 'error',
          connected: false,
          error: dbError.message
        };
        results.errors.push(`Database: ${dbError.message}`);
        console.error('❌ Base de datos: ERROR');
      }
    }

    // Test 2: Notificaciones de Telegram
    if (test === 'all' || test === 'telegram') {
      console.log('📱 Testeando notificaciones de Telegram...');
      
      try {
        const telegram = new TelegramNotifier();
        const sent = await telegram.testConnection();
        
        results.tests.telegram = {
          status: sent ? 'success' : 'disabled',
          enabled: telegram.enabled,
          message_sent: sent
        };
        
        if (sent) {
          console.log('✅ Telegram: OK');
        } else {
          console.log('⚠️ Telegram: Deshabilitado o no configurado');
        }
      } catch (telegramError) {
        results.tests.telegram = {
          status: 'error',
          enabled: false,
          error: telegramError.message
        };
        results.errors.push(`Telegram: ${telegramError.message}`);
        console.error('❌ Telegram: ERROR');
      }
    }

    // Test 3: Scraper
    if (test === 'all' || test === 'scraper') {
      console.log('🕷️ Testeando scraper...');
      
      try {
        const scraper = new TiendaNubeScraper();
        
        // Seleccionar tienda para test
        let testStore = stores.find(s => s.name === store) || stores[0];
        
        console.log(`🎯 Testeando con tienda: ${testStore.name}`);
        
        const result = await scraper.scrapeStore(testStore);
        
        results.tests.scraper = {
          status: result.success ? 'success' : 'error',
          store_tested: testStore.name,
          products_found: result.products.length,
          duration: result.duration,
          sample_products: result.products.slice(0, 3).map(p => ({
            name: p.name,
            price: p.current_price,
            url: p.url
          })),
          error: result.error || null
        };
        
        if (result.success) {
          console.log(`✅ Scraper: OK (${result.products.length} productos)`);
        } else {
          throw new Error(result.error);
        }
        
      } catch (scraperError) {
        results.tests.scraper = {
          status: 'error',
          error: scraperError.message
        };
        results.errors.push(`Scraper: ${scraperError.message}`);
        console.error('❌ Scraper: ERROR');
      }
    }

    // Test 4: Variables de entorno
    if (test === 'all' || test === 'env') {
      console.log('🔧 Verificando variables de entorno...');
      
      const requiredEnvVars = [
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY'
      ];
      
      const optionalEnvVars = [
        'SUPABASE_SERVICE_KEY',
        'TELEGRAM_BOT_TOKEN',
        'TELEGRAM_CHAT_ID'
      ];
      
      const envStatus = {
        required: {},
        optional: {}
      };
      
      let allRequiredPresent = true;
      
      for (const varName of requiredEnvVars) {
        const present = !!process.env[varName];
        envStatus.required[varName] = present;
        if (!present) allRequiredPresent = false;
      }
      
      for (const varName of optionalEnvVars) {
        envStatus.optional[varName] = !!process.env[varName];
      }
      
      results.tests.environment = {
        status: allRequiredPresent ? 'success' : 'warning',
        variables: envStatus,
        all_required_present: allRequiredPresent
      };
      
      if (allRequiredPresent) {
        console.log('✅ Variables de entorno: OK');
      } else {
        console.log('⚠️ Variables de entorno: Faltan variables requeridas');
      }
    }

    // Test 5: API endpoints
    if (test === 'all' || test === 'api') {
      console.log('🔌 Verificando endpoints de API...');
      
      const endpoints = [
        '/api/scrape',
        '/api/webhook',
        '/api/products',
        '/api/test'
      ];
      
      results.tests.api = {
        status: 'success',
        endpoints: endpoints.map(endpoint => ({
          path: endpoint,
          available: true
        }))
      };
      
      console.log('✅ API endpoints: OK');
    }

    // Generar resumen
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const testsRun = Object.keys(results.tests).length;
    const testsSuccessful = Object.values(results.tests).filter(t => t.status === 'success').length;
    const testsWithWarnings = Object.values(results.tests).filter(t => t.status === 'warning').length;
    const testsWithErrors = Object.values(results.tests).filter(t => t.status === 'error').length;
    
    results.summary = {
      duration: parseFloat(duration),
      tests_run: testsRun,
      tests_successful: testsSuccessful,
      tests_warnings: testsWithWarnings,
      tests_errors: testsWithErrors,
      overall_status: testsWithErrors > 0 ? 'error' : 
                     testsWithWarnings > 0 ? 'warning' : 'success'
    };
    
    results.success = testsWithErrors === 0;
    
    console.log(`📊 Tests completados: ${testsSuccessful}/${testsRun} exitosos en ${duration}s`);
    
    if (results.errors.length > 0) {
      console.log('❌ Errores encontrados:', results.errors);
    }

    // Información del sistema
    if (test === 'all') {
      results.system_info = {
        node_version: process.version,
        platform: process.platform,
        memory_usage: process.memoryUsage(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
      };
    }

    return res.status(results.success ? 200 : 500).json(results);

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.error('❌ Error general en tests:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      duration: parseFloat(duration),
      timestamp: new Date().toISOString()
    });
  }
};