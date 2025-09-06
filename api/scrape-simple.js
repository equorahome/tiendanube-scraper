const axios = require('axios');
const cheerio = require('cheerio');
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
    console.log('🔍 SCRAPING SIMPLE - Usando Axios + Cheerio (método que funciona)');
    
    const { store_id = 1 } = req.query;

    // Obtener tienda
    const store = stores.find(s => s.id === parseInt(store_id));
    if (!store) {
      return res.status(400).json({
        success: false,
        error: 'Tienda no encontrada'
      });
    }

    console.log(`🎯 Scrapeando: ${store.name} - ${store.url}`);

    // Hacer request HTTP simple
    const response = await axios.get(store.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 30000
    });

    const $ = cheerio.load(response.data);

    // Selectores para TiendaNube
    const selectores = [
      '.js-item-product',
      '.product-item',
      '.item-product', 
      '.product-card',
      '.product',
      '[data-product-id]',
      '.item',
      '.grid-item'
    ];

    console.log(`📄 HTML recibido: ${response.data.length} caracteres`);

    let mejorSelector = null;
    let maxProductos = 0;

    // Encontrar el mejor selector
    for (const selector of selectores) {
      const elementos = $(selector);
      if (elementos.length > maxProductos) {
        maxProductos = elementos.length;
        mejorSelector = selector;
      }
    }

    if (!mejorSelector || maxProductos === 0) {
      return res.status(200).json({
        success: false,
        error: 'No se encontraron productos en esta tienda',
        store: store.name,
        html_size: response.data.length,
        selectors_tried: selectores.length
      });
    }

    console.log(`🎯 Usando selector: ${mejorSelector} (${maxProductos} elementos)`);

    const productos = [];

    // Extraer datos de productos
    $(mejorSelector).each((i, elemento) => {
      const $el = $(elemento);
      
      // Extraer nombre
      let nombre = null;
      const selectoresNombre = ['.js-item-name', '.item-name', '.product-name', '.product-title', 'h1', 'h2', 'h3', '.title', 'a'];
      for (const sel of selectoresNombre) {
        const text = $el.find(sel).first().text().trim();
        if (text && text.length > 0) {
          nombre = text;
          break;
        }
      }

      // Extraer precio
      let precio = null;
      let precioNumerico = 0;
      const selectoresPrecio = ['.js-price-display', '.price-display', '.price', '.product-price', '.money', '.amount'];
      for (const sel of selectoresPrecio) {
        const text = $el.find(sel).first().text().trim();
        if (text && text.length > 0) {
          precio = text;
          // Convertir a número
          const cleanPrice = text.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
          precioNumerico = parseFloat(cleanPrice) || 0;
          break;
        }
      }

      // Extraer URL
      let url = null;
      const $link = $el.find('a').first();
      if ($link.length > 0) {
        const href = $link.attr('href');
        if (href) {
          url = href.startsWith('http') ? href : `${store.url.replace(/\/$/, '')}${href}`;
        }
      }

      // Extraer imagen
      let imagen = null;
      const $img = $el.find('img').first();
      if ($img.length > 0) {
        const src = $img.attr('src') || $img.attr('data-src');
        if (src) {
          imagen = src.startsWith('http') ? src : `${store.url.replace(/\/$/, '')}${src}`;
        }
      }

      // Solo agregar si tiene nombre y precio
      if (nombre && precio && precioNumerico > 0) {
        productos.push({
          name: nombre,
          price: precio,
          price_numeric: precioNumerico,
          url: url,
          image_url: imagen,
          currency: 'ARS',
          in_stock: true
        });
      }
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`✅ Extracción completada: ${productos.length} productos en ${duration}s`);

    const response_data = {
      success: true,
      simple_scraping: true,
      store: {
        name: store.name,
        url: store.url,
        domain: store.domain
      },
      summary: {
        duration: parseFloat(duration),
        html_size: response.data.length,
        elements_found: maxProductos,
        products_extracted: productos.length,
        selector_used: mejorSelector
      },
      products: productos.slice(0, 10), // Máximo 10 para demo
      sample_html: response.data.substring(0, 500) + '...',
      timestamp: new Date().toISOString()
    };

    return res.status(200).json(response_data);

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error('❌ Error en scraping simple:', error.message);

    return res.status(500).json({
      success: false,
      simple_scraping: true,
      error: error.message,
      duration: parseFloat(duration),
      timestamp: new Date().toISOString()
    });
  }
};