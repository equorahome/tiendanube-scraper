require('dotenv').config();

const TiendaNubeScraper = require('./lib/scraper');
const { stores } = require('./lib/stores');

async function testScraperBasico() {
  console.log('🧪 INICIANDO TEST LOCAL DEL SCRAPER');
  console.log('=' .repeat(50));

  try {
    // Test 1: Instanciar el scraper
    console.log('📦 1. Creando instancia del scraper...');
    const scraper = new TiendaNubeScraper();
    console.log('✅ Scraper creado correctamente');

    // Test 2: Verificar tiendas configuradas
    console.log('\n🏪 2. Verificando tiendas configuradas...');
    console.log(`✅ ${stores.length} tiendas encontradas:`);
    stores.forEach((store, i) => {
      console.log(`   ${i + 1}. ${store.name} - ${store.domain}`);
    });

    // Test 3: Probar scraping de una tienda (solo primera página)
    console.log('\n🕷️ 3. Probando scraping de una tienda...');
    const testStore = stores[0]; // Shiva Home
    console.log(`🎯 Testeando: ${testStore.name}`);
    console.log(`🔗 URL: ${testStore.url}`);

    const startTime = Date.now();
    const result = await scraper.scrapeStore(testStore);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (result.success) {
      console.log(`✅ Scraping exitoso en ${duration}s`);
      console.log(`📦 Productos encontrados: ${result.products.length}`);
      
      // Mostrar muestra de productos
      if (result.products.length > 0) {
        console.log('\n📋 Muestra de productos:');
        result.products.slice(0, 3).forEach((product, i) => {
          console.log(`   ${i + 1}. ${product.name}`);
          console.log(`      💰 Precio: $${product.current_price}`);
          console.log(`      🔗 URL: ${product.url}`);
          console.log(`      🖼️ Imagen: ${product.image_url ? 'Sí' : 'No'}`);
          console.log('');
        });
      }
      
      console.log('🎉 TEST LOCAL EXITOSO!');
      return true;
      
    } else {
      console.error(`❌ Error en scraping: ${result.error}`);
      return false;
    }

  } catch (error) {
    console.error('❌ Error en test:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

async function testBasicoSinBrowser() {
  console.log('🔧 TEST BÁSICO DE COMPONENTES');
  console.log('=' .repeat(30));

  try {
    // Test básico del scraper sin browser
    const scraper = new TiendaNubeScraper();
    
    // Test de métodos auxiliares
    console.log('✅ 1. Scraper instanciado');
    
    // Test parsePrice
    const price1 = scraper.parsePrice('$1.234,50');
    const price2 = scraper.parsePrice('$ 2.500');
    console.log(`✅ 2. Parse precios: $1.234,50 → ${price1}, $ 2.500 → ${price2}`);
    
    // Test buildAbsoluteUrl
    const url1 = scraper.buildAbsoluteUrl('https://example.com', '/producto/123');
    console.log(`✅ 3. Build URL: ${url1}`);
    
    // Test generateProductId
    const id1 = scraper.generateProductId('Mesa de Centro Moderna', 15000);
    console.log(`✅ 4. Generate ID: ${id1}`);
    
    console.log('\n🎉 TODOS LOS TESTS BÁSICOS PASARON');
    return true;
    
  } catch (error) {
    console.error('❌ Error en test básico:', error.message);
    return false;
  }
}

// Función principal
async function runTests() {
  const args = process.argv.slice(2);
  const testType = args[0] || 'basico';

  console.log(`\n🚀 TiendaNube Scraper - Test Local\n`);
  
  if (testType === 'scraper' || testType === 'full') {
    console.log('⚠️  NOTA: Este test usará Puppeteer y puede tardar varios minutos');
    console.log('⚠️  Asegúrate de tener conexión a internet\n');
    
    const success = await testScraperBasico();
    process.exit(success ? 0 : 1);
    
  } else {
    console.log('ℹ️  Ejecutando test básico (sin browser)');
    console.log('ℹ️  Para test completo: node test-local.js scraper\n');
    
    const success = await testBasicoSinBrowser();
    process.exit(success ? 0 : 1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runTests().catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
}

module.exports = { testScraperBasico, testBasicoSinBrowser };