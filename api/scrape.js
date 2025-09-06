const { TiendaNubeScraper } = require('../lib/scraper');

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  // Headers para evitar timeouts
  res.setHeader('Content-Type', 'application/json');

  let scraper;
  try {
    console.log('🚀 Iniciando scraping...');
    
    scraper = new TiendaNubeScraper();
    
    // Inicializar browser con timeout
    const initTimeout = setTimeout(() => {
      throw new Error('Timeout initializing browser (30s)');
    }, 30000);
    
    await scraper.init();
    clearTimeout(initTimeout);
    
    console.log('✅ Scraper initialized, starting store scraping...');
    
    // Ejecutar scraping con timeout total
    const scrapeTimeout = setTimeout(() => {
      throw new Error('Timeout during scraping (4 minutes)');
    }, 240000);
    
    const result = await scraper.scrapeAllStores();
    clearTimeout(scrapeTimeout);
    
    console.log('✅ Scraping completed:', result);
    
    res.status(200).json({
      success: true,
      message: 'Scraping completado exitosamente',
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error en scraping:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    // Cerrar browser siempre
    if (scraper) {
      try {
        await scraper.close();
        console.log('✅ Browser closed');
      } catch (closeError) {
        console.warn('⚠️ Warning closing browser:', closeError.message);
      }
    }
  }
}