require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Importar las APIs
const scrapeAPI = require('./api/scrape');
const scrapeDemoAPI = require('./api/scrape-demo');
const scrapeSimpleAPI = require('./api/scrape-simple');
const webhookAPI = require('./api/webhook');
const productsAPI = require('./api/products');
const testAPI = require('./api/test');
const analyticsAPI = require('./api/analytics');
const compareAPI = require('./api/compare');

// Función helper para convertir API de Vercel a Express
function wrapVercelAPI(vercelHandler) {
  return async (req, res) => {
    try {
      // Simular el contexto de Vercel
      const mockReq = {
        ...req,
        query: req.query,
        body: req.body,
        method: req.method,
        headers: req.headers
      };

      const mockRes = {
        ...res,
        status: (code) => {
          res.status(code);
          return mockRes;
        },
        json: (data) => {
          res.json(data);
          return mockRes;
        },
        end: () => {
          res.end();
          return mockRes;
        },
        setHeader: (name, value) => {
          res.setHeader(name, value);
          return mockRes;
        }
      };

      await vercelHandler(mockReq, mockRes);
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  };
}

// Rutas de API
app.get('/api/scrape', wrapVercelAPI(scrapeAPI));
app.post('/api/scrape', wrapVercelAPI(scrapeAPI));

app.get('/api/scrape-demo', wrapVercelAPI(scrapeDemoAPI));
app.post('/api/scrape-demo', wrapVercelAPI(scrapeDemoAPI));

app.get('/api/scrape-simple', wrapVercelAPI(scrapeSimpleAPI));
app.post('/api/scrape-simple', wrapVercelAPI(scrapeSimpleAPI));

app.get('/api/webhook', wrapVercelAPI(webhookAPI));
app.post('/api/webhook', wrapVercelAPI(webhookAPI));

app.get('/api/products', wrapVercelAPI(productsAPI));

app.get('/api/test', wrapVercelAPI(testAPI));

app.get('/api/analytics', wrapVercelAPI(analyticsAPI));

app.get('/api/compare', wrapVercelAPI(compareAPI));
app.post('/api/compare', wrapVercelAPI(compareAPI));

// Página de inicio simple
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>TiendaNube Scraper - Local</title>
        <meta charset="utf-8">
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
                margin: 40px; 
                line-height: 1.6; 
                background: #f5f5f5;
            }
            .container { 
                max-width: 800px; 
                margin: 0 auto; 
                background: white; 
                padding: 30px; 
                border-radius: 10px; 
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { color: #333; text-align: center; }
            h2 { color: #555; margin-top: 30px; }
            .endpoint { 
                background: #f8f9fa; 
                padding: 15px; 
                margin: 10px 0; 
                border-radius: 5px; 
                border-left: 4px solid #007bff;
            }
            .endpoint a { 
                color: #007bff; 
                text-decoration: none; 
                font-weight: 500;
            }
            .endpoint a:hover { text-decoration: underline; }
            .method { 
                display: inline-block; 
                background: #28a745; 
                color: white; 
                padding: 3px 8px; 
                border-radius: 3px; 
                font-size: 12px; 
                margin-right: 10px;
            }
            .status { 
                text-align: center; 
                padding: 20px; 
                background: #d4edda; 
                border-radius: 5px; 
                margin-bottom: 20px;
                color: #155724;
            }
            .warning {
                background: #fff3cd;
                color: #856404;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🛍️ TiendaNube Scraper</h1>
            <div class="status">
                <strong>✅ Servidor Local Funcionando</strong><br>
                Puerto: ${PORT} | Modo: Desarrollo
            </div>

            <div class="warning">
                <strong>⚠️ Modo Local:</strong> Este servidor simula el entorno de Vercel para desarrollo. 
                Las funciones de base de datos y Telegram requieren configuración real.
            </div>

            <h2>🔌 Endpoints Disponibles</h2>

            <div class="endpoint">
                <span class="method">GET</span>
                <a href="/api/test" target="_blank">/api/test</a>
                <p>Tests del sistema - Verifica que todos los componentes funcionen</p>
            </div>

            <div class="endpoint">
                <span class="method">GET</span>
                <a href="/api/test?test=scraper" target="_blank">/api/test?test=scraper</a>
                <p>Test específico del scraper con una tienda</p>
            </div>

            <div class="endpoint">
                <span class="method">GET</span>
                <a href="/api/scrape-simple?store_id=1" target="_blank">/api/scrape-simple</a>
                <p>🔥 SIMPLE: Scraping con Axios (¡funciona garantizado!)</p>
            </div>

            <div class="endpoint">
                <span class="method">GET</span>
                <a href="/api/scrape-demo" target="_blank">/api/scrape-demo</a>
                <p>🧪 DEMO: Scraping con Puppeteer (para testing)</p>
            </div>

            <div class="endpoint">
                <span class="method">GET</span>
                <a href="/api/scrape?test=true&notify=false" target="_blank">/api/scrape?test=true&notify=false</a>
                <p>Scraping de prueba (requiere DB configurada)</p>
            </div>

            <div class="endpoint">
                <span class="method">GET</span>
                <a href="/api/scrape?store_id=1&test=true&notify=false" target="_blank">/api/scrape?store_id=1&test=true&notify=false</a>
                <p>Scraping de una tienda específica (Shiva Home)</p>
            </div>

            <div class="endpoint">
                <span class="method">GET</span>
                <a href="/api/products" target="_blank">/api/products</a>
                <p>Lista de productos (requiere DB configurada)</p>
            </div>

            <div class="endpoint">
                <span class="method">GET</span>
                <a href="/api/webhook" target="_blank">/api/webhook</a>
                <p>Simular webhook automático</p>
            </div>

            <div class="endpoint">
                <span class="method">GET</span>
                <a href="/api/analytics" target="_blank">/api/analytics</a>
                <p>📊 Analytics: Datos para dashboard de analíticas</p>
            </div>

            <div class="endpoint">
                <span class="method">POST</span>
                <a href="/api/compare" target="_blank">/api/compare</a>
                <p>⚖️ Compare: Búsqueda y comparación de productos</p>
            </div>

            <h2>🎨 Frontend Dashboard</h2>

            <div class="endpoint">
                <span class="method">WEB</span>
                <a href="/index.html" target="_blank">/index.html</a>
                <p>🏠 Dashboard Principal - Vista de productos y estadísticas</p>
            </div>

            <div class="endpoint">
                <span class="method">WEB</span>
                <a href="/compare.html" target="_blank">/compare.html</a>
                <p>⚖️ Comparador de Productos - Análisis lado a lado</p>
            </div>

            <div class="endpoint">
                <span class="method">WEB</span>
                <a href="/analytics.html" target="_blank">/analytics.html</a>
                <p>📊 Dashboard de Analíticas - Tendencias y insights</p>
            </div>

            <h2>📊 Estado del Sistema</h2>
            <p>Node.js: ${process.version}</p>
            <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
            <p>Supabase URL: ${process.env.SUPABASE_URL ? '✅ Configurado' : '❌ No configurado'}</p>
            <p>Telegram Bot: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ Configurado' : '❌ No configurado'}</p>

            <h2>🚀 Comandos Útiles</h2>
            <div class="endpoint">
                <strong>Hacer scraping rápido:</strong><br>
                <code>curl "http://localhost:${PORT}/api/scrape?test=true&notify=false"</code>
            </div>

            <div class="endpoint">
                <strong>Ver tests:</strong><br>
                <code>curl "http://localhost:${PORT}/api/test"</code>
            </div>

        </div>
    </body>
    </html>
  `);
});

// Error handler global
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({
    success: false,
    error: error.message,
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 TiendaNube Scraper Server`);
  console.log(`📡 Listening on: http://localhost:${PORT}`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`🕷️ Scrape endpoint: http://localhost:${PORT}/api/scrape?test=true&notify=false`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log('');
  console.log('🔧 Modo desarrollo - Para terminar presiona Ctrl+C');
});

module.exports = app;