require('dotenv').config();

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const { stores } = require('./lib/stores');

async function debugTienda(storeName = 'Bazar Nuba') {
  const store = stores.find(s => s.name === storeName);
  if (!store) {
    console.error('Tienda no encontrada');
    return;
  }

  console.log(`🔍 DEBUGEANDO: ${store.name}`);
  console.log(`🔗 URL: ${store.url}`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false, // Para ver qué pasa
      args: ['--no-sandbox'],
      timeout: 60000
    });

    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await page.setViewport({ width: 1366, height: 768 });

    console.log('📖 Navegando a la página...');
    const response = await page.goto(store.url, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });

    console.log(`📊 Respuesta: ${response.status()}`);

    // Esperar un poco
    await page.waitForTimeout(3000);

    // Obtener HTML completo
    const html = await page.content();
    const $ = cheerio.load(html);

    console.log(`📄 HTML length: ${html.length} characters`);

    // Buscar todos los posibles selectores de productos
    const selectores = [
      '.js-item-product',
      '.product-item',
      '.item-product', 
      '.product-card',
      '.product',
      '[data-product-id]',
      '.item',
      '.grid-item',
      '.card',
      '.producto'
    ];

    console.log('\n🔎 Buscando productos con diferentes selectores:');
    let mejorSelector = null;
    let maxProductos = 0;

    for (const selector of selectores) {
      const elementos = $(selector);
      console.log(`   ${selector}: ${elementos.length} elementos`);
      
      if (elementos.length > maxProductos) {
        maxProductos = elementos.length;
        mejorSelector = selector;
      }
    }

    if (mejorSelector && maxProductos > 0) {
      console.log(`\n✅ Mejor selector: ${mejorSelector} (${maxProductos} productos)`);
      
      // Analizar primer producto
      const primerProducto = $(mejorSelector).first();
      console.log('\n📦 Analizando primer producto:');
      
      // Buscar nombre
      const selectoresNombre = [
        '.js-item-name', '.item-name', '.product-name', '.product-title',
        'h1', 'h2', 'h3', '.title', '.name', 'a'
      ];
      
      for (const sel of selectoresNombre) {
        const nombre = primerProducto.find(sel).first().text().trim();
        if (nombre) {
          console.log(`   Nombre (${sel}): ${nombre}`);
          break;
        }
      }
      
      // Buscar precio
      const selectoresPrecio = [
        '.js-price-display', '.price-display', '.price', '.product-price',
        '.item-price', '[data-price]', '.money', '.amount', '.cost'
      ];
      
      for (const sel of selectoresPrecio) {
        const precio = primerProducto.find(sel).first().text().trim();
        if (precio) {
          console.log(`   Precio (${sel}): ${precio}`);
          break;
        }
      }
      
      // HTML del primer producto
      console.log('\n📝 HTML del primer producto:');
      console.log(primerProducto.html()?.substring(0, 300) + '...');
      
    } else {
      console.log('❌ No se encontraron productos con ningún selector');
      
      // Mostrar algunos elementos que podrían ser productos
      console.log('\n🔍 Elementos que podrían ser productos:');
      
      const posibleSelectores = ['div', 'article', 'li', 'section'];
      for (const sel of posibleSelectores) {
        const elementos = $(sel);
        console.log(`   ${sel}: ${elementos.length} elementos`);
      }
    }

    await page.waitForTimeout(5000); // Para ver la página

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Ejecutar
const storeName = process.argv[2] || 'Bazar Nuba';
debugTienda(storeName).catch(console.error);