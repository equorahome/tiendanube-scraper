require('dotenv').config();

const axios = require('axios');
const cheerio = require('cheerio');
const { stores } = require('./lib/stores');

async function testTiendaConAxios(storeName = 'Bazar Nuba') {
  const store = stores.find(s => s.name === storeName);
  if (!store) {
    console.error('Tienda no encontrada');
    return;
  }

  console.log(`🔍 TESTEANDO CON AXIOS: ${store.name}`);
  console.log(`🔗 URL: ${store.url}`);

  try {
    const response = await axios.get(store.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 30000
    });

    console.log(`📊 Status: ${response.status}`);
    console.log(`📄 Content-Type: ${response.headers['content-type']}`);
    console.log(`📏 HTML Size: ${response.data.length} characters`);

    const $ = cheerio.load(response.data);

    // Buscar productos con diferentes selectores
    const selectores = [
      '.js-item-product',
      '.product-item',
      '.item-product', 
      '.product-card',
      '.product',
      '[data-product-id]',
      '.item',
      '.grid-item',
      '.card'
    ];

    console.log('\n🔎 Buscando productos:');
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
      console.log(`\n✅ ENCONTRADOS ${maxProductos} productos con selector: ${mejorSelector}`);
      
      // Analizar primeros 3 productos
      $(mejorSelector).slice(0, 3).each((i, elemento) => {
        console.log(`\n📦 Producto ${i + 1}:`);
        
        const $elemento = $(elemento);
        
        // Buscar nombre
        const selectoresNombre = ['.js-item-name', '.item-name', '.product-name', 'h1', 'h2', 'h3', '.title', 'a'];
        for (const sel of selectoresNombre) {
          const nombre = $elemento.find(sel).first().text().trim();
          if (nombre && nombre.length > 0) {
            console.log(`   📝 Nombre: ${nombre.substring(0, 60)}`);
            break;
          }
        }
        
        // Buscar precio
        const selectoresPrecio = ['.js-price-display', '.price-display', '.price', '.money', '.amount'];
        for (const sel of selectoresPrecio) {
          const precio = $elemento.find(sel).first().text().trim();
          if (precio && precio.length > 0) {
            console.log(`   💰 Precio: ${precio}`);
            break;
          }
        }
        
        // Buscar URL
        const url = $elemento.find('a').first().attr('href');
        if (url) {
          const fullUrl = url.startsWith('http') ? url : `${store.url.replace(/\/$/, '')}${url}`;
          console.log(`   🔗 URL: ${fullUrl.substring(0, 60)}...`);
        }
      });
      
      console.log('\n🎉 SCRAPING BÁSICO EXITOSO!');
      return true;
      
    } else {
      console.log('❌ No se encontraron productos');
      
      // Ver títulos y elementos que podrían ser productos
      const title = $('title').text();
      console.log(`📄 Título de página: ${title}`);
      
      // Buscar elementos comunes
      console.log('\n🔍 Elementos comunes:');
      console.log(`   div: ${$('div').length}`);
      console.log(`   article: ${$('article').length}`);
      console.log(`   li: ${$('li').length}`);
      console.log(`   Links: ${$('a').length}`);
      console.log(`   Imágenes: ${$('img').length}`);
      
      return false;
    }

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
    }
    return false;
  }
}

async function testTodasLasTiendas() {
  console.log('🏪 TESTEANDO TODAS LAS TIENDAS\n');
  
  for (const store of stores.slice(0, 3)) { // Solo primeras 3 para no saturar
    console.log('='.repeat(50));
    const success = await testTiendaConAxios(store.name);
    
    if (success) {
      console.log(`✅ ${store.name}: FUNCIONANDO`);
    } else {
      console.log(`❌ ${store.name}: NO ENCONTRÓ PRODUCTOS`);
    }
    
    // Pausa entre requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// Ejecutar
const command = process.argv[2];
const storeName = process.argv[3];

if (command === 'all') {
  testTodasLasTiendas().catch(console.error);
} else {
  testTiendaConAxios(storeName).catch(console.error);
}