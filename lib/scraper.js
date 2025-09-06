const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

class TiendaNubeScraper {
  constructor() {
    this.puppeteerConfig = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ],
      timeout: parseInt(process.env.SCRAPE_TIMEOUT || '120000')
    };

    this.selectors = {
      products: [
        '.js-item-product',
        '.product-item',
        '.item-product',
        '.product-card',
        '.product',
        '[data-product-id]',
        '.item',
        '.grid-item'
      ],
      productName: [
        '.js-item-name',
        '.item-name',
        '.product-name',
        '.product-title',
        'h2 a',
        'h3 a',
        '.name a',
        'h1',
        'h2',
        'h3',
        '.title'
      ],
      productPrice: [
        '.js-price-display',
        '.price-display',
        '.price',
        '.product-price',
        '.item-price',
        '[data-price]',
        '.money',
        '.amount',
        '.cost'
      ],
      productImage: [
        '.js-item-image img',
        '.item-image img',
        '.product-image img',
        '.image img',
        'img[src*="cdn"]',
        'img'
      ],
      productUrl: [
        '.js-item-link',
        '.item-link',
        '.product-link',
        'a[href*="/products/"]',
        'a[href*="/producto/"]',
        'a'
      ],
      nextPage: [
        '.pagination-next',
        '.next',
        'a[rel="next"]',
        '.pager-next a',
        '[data-page="next"]'
      ]
    };

    this.maxRetries = 3;
    this.maxConcurrentPages = parseInt(process.env.MAX_CONCURRENT_PAGES || '3');
    this.requestDelay = 2000;
  }

  async scrapeStore(storeData) {
    const startTime = Date.now();
    console.log(`🚀 Iniciando scraping de ${storeData.name} - ${storeData.url}`);

    let browser;
    try {
      browser = await puppeteer.launch(this.puppeteerConfig);
      const results = await this.scrapeWithBrowser(browser, storeData);
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Scraping completado para ${storeData.name}: ${results.products.length} productos en ${duration}s`);
      
      return {
        success: true,
        store: storeData,
        products: results.products,
        totalPages: results.totalPages,
        scrapedAt: new Date().toISOString(),
        duration: parseFloat(duration)
      };

    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.error(`❌ Error en ${storeData.name} después de ${duration}s:`, error.message);
      
      return {
        success: false,
        store: storeData,
        error: error.message,
        products: [],
        scrapedAt: new Date().toISOString(),
        duration: parseFloat(duration)
      };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async scrapeWithBrowser(browser, storeData) {
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1366, height: 768 });
    
    // Bloquear recursos innecesarios para mayor velocidad
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['stylesheet', 'font', 'media'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    let allProducts = [];
    let currentPage = 1;
    let hasNextPage = true;
    const maxPages = 50; // Límite de seguridad

    while (hasNextPage && currentPage <= maxPages) {
      try {
        const url = this.buildPageUrl(storeData.url, currentPage);
        console.log(`📄 Scrapeando página ${currentPage}: ${url}`);

        const response = await page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: this.puppeteerConfig.timeout 
        });

        if (!response || response.status() !== 200) {
          console.warn(`⚠️ Respuesta ${response?.status()} para página ${currentPage}`);
          break;
        }

        // Esperar a que se carguen los productos
        await this.waitForProducts(page);

        const pageProducts = await this.extractProductsFromPage(page, storeData);
        
        if (pageProducts.length === 0) {
          console.log(`📭 No se encontraron productos en página ${currentPage}`);
          break;
        }

        allProducts = allProducts.concat(pageProducts);
        console.log(`📦 Página ${currentPage}: ${pageProducts.length} productos (total: ${allProducts.length})`);

        // Verificar si hay página siguiente
        hasNextPage = await this.hasNextPage(page);
        
        if (hasNextPage) {
          currentPage++;
          await this.delay(this.requestDelay);
        }

      } catch (error) {
        console.error(`❌ Error en página ${currentPage}:`, error.message);
        break;
      }
    }

    await page.close();
    
    // Eliminar duplicados por URL
    const uniqueProducts = this.removeDuplicates(allProducts);
    console.log(`🧹 Productos únicos: ${uniqueProducts.length} (eliminados ${allProducts.length - uniqueProducts.length} duplicados)`);

    return {
      products: uniqueProducts,
      totalPages: currentPage - 1
    };
  }

  buildPageUrl(baseUrl, page) {
    if (page === 1) return baseUrl;
    
    const url = new URL(baseUrl);
    
    // Diferentes formatos de paginación en TiendaNube
    if (url.pathname.includes('/productos')) {
      return `${baseUrl}?page=${page}`;
    } else if (url.pathname === '/') {
      return `${baseUrl}?page=${page}`;
    } else {
      return `${baseUrl}${url.pathname.endsWith('/') ? '' : '/'}?page=${page}`;
    }
  }

  async waitForProducts(page) {
    try {
      await page.waitForFunction(() => {
        const selectors = [
          '.js-item-product',
          '.product-item',
          '.item-product',
          '.product-card',
          '.product',
          '.item'
        ];
        
        return selectors.some(selector => document.querySelector(selector));
      }, { timeout: 10000 });
    } catch (error) {
      console.log('⏱️ Timeout esperando productos, continuando...');
    }

    // Esperar un poco más para asegurar que todo se cargue
    await this.delay(1000);
  }

  async extractProductsFromPage(page, storeData) {
    const html = await page.content();
    const $ = cheerio.load(html);
    const products = [];

    // Buscar contenedor de productos
    let productSelector = null;
    for (const selector of this.selectors.products) {
      const elements = $(selector);
      if (elements.length > 0) {
        productSelector = selector;
        console.log(`🎯 Usando selector: ${selector} (${elements.length} elementos)`);
        break;
      }
    }

    if (!productSelector) {
      console.warn('⚠️ No se encontró selector de productos válido');
      return products;
    }

    $(productSelector).each((index, element) => {
      try {
        const product = this.extractProductData($, $(element), storeData);
        if (product && product.name && product.price > 0) {
          products.push(product);
        }
      } catch (error) {
        console.error(`❌ Error extrayendo producto ${index + 1}:`, error.message);
      }
    });

    return products;
  }

  extractProductData($, productElement, storeData) {
    const product = {
      store_id: storeData.id,
      external_id: null,
      name: null,
      url: null,
      image_url: null,
      current_price: 0,
      currency: 'ARS',
      in_stock: true,
      category: null
    };

    // Extraer nombre
    product.name = this.extractText($, productElement, this.selectors.productName);

    // Extraer precio
    const priceText = this.extractText($, productElement, this.selectors.productPrice);
    product.current_price = this.parsePrice(priceText);

    // Extraer URL
    const relativeUrl = this.extractAttribute($, productElement, this.selectors.productUrl, 'href');
    if (relativeUrl) {
      product.url = this.buildAbsoluteUrl(storeData.url, relativeUrl);
      product.external_id = this.extractProductIdFromUrl(product.url);
    }

    // Extraer imagen
    const imageUrl = this.extractAttribute($, productElement, this.selectors.productImage, 'src') ||
                     this.extractAttribute($, productElement, this.selectors.productImage, 'data-src');
    if (imageUrl) {
      product.image_url = this.buildAbsoluteUrl(storeData.url, imageUrl);
    }

    // Generar ID externo si no existe
    if (!product.external_id && product.name) {
      product.external_id = this.generateProductId(product.name, product.current_price);
    }

    // Extraer categoría del HTML si está disponible
    product.category = this.extractCategory($, productElement);

    return product;
  }

  extractText($, element, selectors) {
    for (const selector of selectors) {
      const found = element.find(selector).first();
      if (found.length > 0) {
        const text = found.text().trim();
        if (text) return text;
      }
    }
    return null;
  }

  extractAttribute($, element, selectors, attribute) {
    for (const selector of selectors) {
      const found = element.find(selector).first();
      if (found.length > 0) {
        const attr = found.attr(attribute);
        if (attr) return attr;
      }
    }
    return null;
  }

  parsePrice(priceText) {
    if (!priceText) return 0;

    // Limpiar texto del precio
    let cleanPrice = priceText
      .replace(/[^\d,.-]/g, '') // Solo números, comas y puntos
      .replace(/\./g, '') // Remover puntos de miles
      .replace(',', '.'); // Convertir coma decimal a punto

    const price = parseFloat(cleanPrice);
    return isNaN(price) ? 0 : price;
  }

  buildAbsoluteUrl(baseUrl, relativeUrl) {
    if (!relativeUrl) return null;
    
    try {
      if (relativeUrl.startsWith('http')) {
        return relativeUrl;
      }
      
      const base = new URL(baseUrl);
      return new URL(relativeUrl, base.origin).href;
    } catch (error) {
      console.error('Error construyendo URL absoluta:', error.message);
      return null;
    }
  }

  extractProductIdFromUrl(url) {
    if (!url) return null;

    // Intentar extraer ID de diferentes formatos de URL
    const patterns = [
      /\/products\/(\d+)/,
      /\/producto\/([^/?]+)/,
      /\/([^/?]+)(?:\?|$)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  generateProductId(name, price) {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${cleanName}_${price}`.substring(0, 100);
  }

  extractCategory($, element) {
    // Buscar elementos que puedan contener categoría
    const categorySelectors = [
      '.category',
      '.breadcrumb',
      '[data-category]',
      '.product-category'
    ];

    for (const selector of categorySelectors) {
      const categoryElement = element.find(selector);
      if (categoryElement.length > 0) {
        const category = categoryElement.text().trim();
        if (category && category.length < 100) {
          return category;
        }
      }
    }

    return null;
  }

  async hasNextPage(page) {
    try {
      for (const selector of this.selectors.nextPage) {
        const nextButton = await page.$(selector);
        if (nextButton) {
          const isDisabled = await page.evaluate(el => {
            return el.disabled || 
                   el.classList.contains('disabled') ||
                   el.getAttribute('aria-disabled') === 'true' ||
                   el.style.display === 'none';
          }, nextButton);
          
          if (!isDisabled) {
            return true;
          }
        }
      }
      return false;
    } catch (error) {
      console.error('Error verificando página siguiente:', error.message);
      return false;
    }
  }

  removeDuplicates(products) {
    const seen = new Set();
    return products.filter(product => {
      const key = `${product.name}_${product.current_price}_${product.url}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Método para scraping múltiples tiendas
  async scrapeMultipleStores(stores) {
    const results = [];
    
    console.log(`🏪 Iniciando scraping de ${stores.length} tiendas`);
    
    for (const store of stores) {
      if (!store.active) {
        console.log(`⏭️ Saltando ${store.name} (inactiva)`);
        continue;
      }

      const result = await this.scrapeStore(store);
      results.push(result);

      // Pausa entre tiendas para ser respetuosos
      if (stores.indexOf(store) < stores.length - 1) {
        console.log(`⏸️ Pausa de ${this.requestDelay}ms antes de la siguiente tienda`);
        await this.delay(this.requestDelay);
      }
    }

    const successful = results.filter(r => r.success).length;
    const totalProducts = results.reduce((sum, r) => sum + r.products.length, 0);
    
    console.log(`📊 Resumen: ${successful}/${stores.length} tiendas exitosas, ${totalProducts} productos totales`);
    
    return results;
  }
}

module.exports = TiendaNubeScraper;