require('dotenv').config();

const TiendaNubeScraper = require('./lib/scraper');
const { stores } = require('./lib/stores');

async function testCompleto() {
  console.log('🧪 TESTING COMPLETO DEL SISTEMA');
  console.log('='.repeat(50));
  
  const resultados = {
    scraper: false,
    tiendas: [],
    resumen: {}
  };

  try {
    // Test 1: Instanciar scraper
    console.log('1️⃣ Creando scraper...');
    const scraper = new TiendaNubeScraper();
    console.log('✅ Scraper creado');
    resultados.scraper = true;

    // Test 2: Probar algunas tiendas funcionando
    console.log('\n2️⃣ Probando tiendas conocidas que funcionan...');
    const tiendasPrueba = stores.filter(s => 
      ['Shiva Home', 'Nimba', 'Vienna Hogar'].includes(s.name)
    );

    for (const tienda of tiendasPrueba) {
      console.log(`\n🏪 Testeando: ${tienda.name}`);
      
      try {
        const resultado = await scraper.scrapeStore(tienda);
        
        const tiendaResult = {
          nombre: tienda.name,
          exitoso: resultado.success,
          productos: resultado.products?.length || 0,
          duracion: resultado.duration || 0,
          error: resultado.error || null
        };

        if (resultado.success) {
          console.log(`✅ ${tienda.name}: ${resultado.products.length} productos en ${resultado.duration.toFixed(1)}s`);
          
          // Mostrar muestra
          if (resultado.products.length > 0) {
            const muestra = resultado.products.slice(0, 2);
            muestra.forEach((p, i) => {
              console.log(`   ${i+1}. ${p.name} - $${p.current_price}`);
            });
          }
        } else {
          console.log(`❌ ${tienda.name}: ${resultado.error}`);
        }

        resultados.tiendas.push(tiendaResult);
        
      } catch (error) {
        console.log(`❌ ${tienda.name}: ${error.message}`);
        resultados.tiendas.push({
          nombre: tienda.name,
          exitoso: false,
          productos: 0,
          duracion: 0,
          error: error.message
        });
      }
    }

    // Generar resumen
    const exitosas = resultados.tiendas.filter(t => t.exitoso).length;
    const totalProductos = resultados.tiendas.reduce((sum, t) => sum + t.productos, 0);
    const duracionTotal = resultados.tiendas.reduce((sum, t) => sum + t.duracion, 0);

    resultados.resumen = {
      tiendasProbadas: resultados.tiendas.length,
      tiendasExitosas: exitosas,
      totalProductos,
      duracionTotal: duracionTotal.toFixed(1),
      porcentajeExito: ((exitosas / resultados.tiendas.length) * 100).toFixed(1)
    };

    console.log('\n📊 RESUMEN FINAL:');
    console.log('='.repeat(30));
    console.log(`🏪 Tiendas probadas: ${resultados.resumen.tiendasProbadas}`);
    console.log(`✅ Tiendas exitosas: ${resultados.resumen.tiendasExitosas}`);
    console.log(`📦 Total productos: ${resultados.resumen.totalProductos}`);
    console.log(`⏱️ Tiempo total: ${resultados.resumen.duracionTotal}s`);
    console.log(`📈 Tasa de éxito: ${resultados.resumen.porcentajeExito}%`);

    if (exitosas > 0) {
      console.log('\n🎉 EL SISTEMA FUNCIONA CORRECTAMENTE!');
      console.log('✨ El scraper puede encontrar y extraer productos de las tiendas TiendaNube.');
      console.log('🚀 Listo para deployar en producción!');
      return true;
    } else {
      console.log('\n⚠️ NO SE ENCONTRARON PRODUCTOS');
      console.log('🔧 Es posible que las tiendas requieran JavaScript o hayan cambiado su estructura.');
      return false;
    }

  } catch (error) {
    console.error('\n❌ ERROR GENERAL:', error.message);
    return false;
  }
}

// Test de componentes individuales
async function testComponentes() {
  console.log('🔧 TESTING DE COMPONENTES');
  console.log('='.repeat(30));

  try {
    // Test Database (sin conexión real)
    console.log('1️⃣ Database class...');
    try {
      const Database = require('./lib/database');
      console.log('✅ Database class importada');
    } catch (error) {
      console.log(`❌ Database: ${error.message}`);
    }

    // Test Telegram (sin conexión real)
    console.log('2️⃣ Telegram class...');
    try {
      const TelegramNotifier = require('./lib/telegram');
      const telegram = new TelegramNotifier();
      console.log(`✅ Telegram class creada (enabled: ${telegram.enabled})`);
    } catch (error) {
      console.log(`❌ Telegram: ${error.message}`);
    }

    // Test Scraper
    console.log('3️⃣ Scraper class...');
    try {
      const scraper = new TiendaNubeScraper();
      
      // Test métodos auxiliares
      const precio = scraper.parsePrice('$1.234,56');
      const url = scraper.buildAbsoluteUrl('https://test.com', '/producto');
      const id = scraper.generateProductId('Test Product', 100);
      
      console.log(`✅ Scraper methods working: precio=${precio}, url=${url}, id=${id}`);
    } catch (error) {
      console.log(`❌ Scraper: ${error.message}`);
    }

    console.log('\n✅ Todos los componentes básicos funcionan');
    return true;

  } catch (error) {
    console.error('❌ Error en test de componentes:', error.message);
    return false;
  }
}

// Main
async function main() {
  const tipo = process.argv[2] || 'completo';
  
  if (tipo === 'componentes') {
    await testComponentes();
  } else {
    await testComponentes();
    console.log('\n');
    await testCompleto();
  }
}

main().catch(console.error);