# 🚀 Guía de Deploy y Producción

Guía completa para llevar tu TiendaNube Scraper a producción con todas las mejores prácticas.

## 🏗️ Arquitectura de Producción

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Vercel        │    │    Supabase      │    │    Telegram     │
│                 │    │                  │    │                 │
│  ┌───────────┐  │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│  │ Cron Jobs │  │────┤ │ PostgreSQL   │ │    │ │ Bot API     │ │
│  │ 6:00/18:00│  │    │ │ - stores     │ │    │ │ Notificaciones│ │
│  └───────────┘  │    │ │ - products   │ │    │ └─────────────┘ │
│                 │    │ │ - history    │ │    └─────────────────┘
│  ┌───────────┐  │    │ └──────────────┘ │
│  │    APIs   │  │    │                  │
│  │ /scrape   │  │    │ ┌──────────────┐ │
│  │ /products │  │────┤ │ Edge Network │ │
│  │ /webhook  │  │    │ │ Global CDN   │ │
│  │ /test     │  │    │ └──────────────┘ │
│  └───────────┘  │    └──────────────────┘
└─────────────────┘
```

## 📋 Pre-Deploy Checklist

### Código y Configuración
- [ ] Todas las dependencias instaladas
- [ ] Variables de entorno configuradas
- [ ] Tests pasando localmente
- [ ] Código commiteado y pusheado
- [ ] `.env` en `.gitignore`
- [ ] Documentación actualizada

### Servicios Externos
- [ ] Proyecto Supabase configurado
- [ ] Schema de base de datos aplicado
- [ ] Bot de Telegram creado
- [ ] Credenciales guardadas de forma segura

### Vercel Configuration
- [ ] `vercel.json` configurado correctamente
- [ ] Funciones con timeout adecuado
- [ ] Cron jobs definidos
- [ ] Headers CORS configurados

## 🔐 Configuración de Seguridad

### Variables de Entorno

**Nunca hardcodear credenciales en el código**

```bash
# ✅ Correcto - usando variables de entorno
const supabaseUrl = process.env.SUPABASE_URL;

# ❌ Incorrecto - credenciales en código
const supabaseUrl = \"https://abc123.supabase.co\";
```

### Supabase Security

1. **Row Level Security (RLS)**
```sql
-- Habilitar RLS en tablas sensibles (opcional)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Política para permitir solo operaciones del service role
CREATE POLICY \"Service role access\" ON products
FOR ALL USING (auth.role() = 'service_role');
```

2. **API Key Roles**
- `anon` key: Solo lectura para APIs públicas
- `service_role` key: Operaciones completas del scraper

### Telegram Security

- Token del bot mantenido en variables de entorno
- Chat ID específico para evitar spam
- Rate limiting implementado en notificaciones

## 🚀 Deploy a Vercel

### Método 1: GitHub Integration (Recomendado)

1. **Preparar repositorio**
```bash
git add .
git commit -m \"Deploy to production\"
git push origin main
```

2. **Conectar con Vercel**
- Ir a [vercel.com/new](https://vercel.com/new)
- Seleccionar repositorio de GitHub
- Configurar proyecto
- Deploy automático

3. **Configurar variables de entorno**
```bash
# En Vercel Dashboard > Settings > Environment Variables
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
TELEGRAM_BOT_TOKEN=123:ABC...
TELEGRAM_CHAT_ID=123456789
NODE_ENV=production
ENABLE_TELEGRAM_NOTIFICATIONS=true
SCRAPE_TIMEOUT=300000
MAX_CONCURRENT_PAGES=2
```

### Método 2: Vercel CLI

1. **Instalar CLI**
```bash
npm i -g vercel
vercel login
```

2. **Deploy**
```bash
vercel --prod
```

3. **Configurar variables**
```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_KEY
# ... etc
```

## ⚙️ Optimización para Producción

### Performance

1. **Timeouts y Concurrencia**
```json
{
  \"functions\": {
    \"api/**/*.js\": {
      \"maxDuration\": 300
    }
  }
}
```

2. **Rate Limiting**
```javascript
const delay = Math.max(2000, Math.random() * 3000);
await this.delay(delay);
```

3. **Error Recovery**
```javascript
for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
  try {
    return await this.scrapeWithBrowser(browser, storeData);
  } catch (error) {
    if (attempt === this.maxRetries) throw error;
    await this.delay(attempt * 1000);
  }
}
```

### Database Optimization

1. **Connection Pooling**
```javascript
const supabase = createClient(url, key, {
  db: { schema: 'public' },
  auth: { persistSession: false },
  global: { headers: { 'x-my-custom-header': 'scraper-v1' } }
});
```

2. **Batch Operations**
```javascript
// Insertar productos en lotes
const batchSize = 100;
for (let i = 0; i < products.length; i += batchSize) {
  const batch = products.slice(i, i + batchSize);
  await supabase.from('products').upsert(batch);
}
```

3. **Índices Optimizados**
```sql
CREATE INDEX CONCURRENTLY idx_products_store_updated 
ON products(store_id, updated_at DESC);

CREATE INDEX CONCURRENTLY idx_price_history_recent 
ON price_history(scraped_at DESC) 
WHERE scraped_at > NOW() - INTERVAL '30 days';
```

## 📊 Monitoreo y Observabilidad

### Logs Estructurados

```javascript
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'INFO',
  action: 'scrape_complete',
  store: storeName,
  products: productCount,
  duration: duration
}));
```

### Métricas Clave

1. **Disponibilidad**
   - Uptime de APIs
   - Éxito de cron jobs
   - Conectividad a Supabase

2. **Performance**
   - Tiempo de scraping por tienda
   - Productos procesados por minuto
   - Memory usage

3. **Business Metrics**
   - Productos nuevos por día
   - Cambios de precio detectados
   - Tasa de notificaciones enviadas

### Alertas

1. **Vercel Integration**
```javascript
// En caso de error crítico
if (errorCount > threshold) {
  await fetch(process.env.SLACK_WEBHOOK, {
    method: 'POST',
    body: JSON.stringify({
      text: `🚨 Scraper failing: ${errorCount} errors`
    })
  });
}
```

2. **Supabase Webhooks**
```sql
-- Alerta si no hay nuevos productos en 24h
SELECT count(*) as new_products 
FROM products 
WHERE created_at > NOW() - INTERVAL '24 hours';
```

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### Pre-commit Hooks

```bash
npm install --save-dev husky lint-staged

# package.json
{
  \"husky\": {
    \"hooks\": {
      \"pre-commit\": \"lint-staged\"
    }
  },
  \"lint-staged\": {
    \"*.js\": [\"eslint --fix\", \"git add\"]
  }
}
```

## 🧪 Testing en Producción

### Health Checks

```javascript
// Endpoint para health checks
module.exports = async (req, res) => {
  const checks = {
    database: await testDatabaseConnection(),
    telegram: await testTelegramConnection(),
    lastScrape: await getLastScrapeTime()
  };
  
  const healthy = Object.values(checks).every(check => check.status === 'ok');
  
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString()
  });
};
```

### Canary Deployments

```bash
# Deploy a una URL de staging primero
vercel --prod --meta staging=true

# Validar funcionamiento
curl https://staging-app.vercel.app/api/test

# Promover a producción
vercel alias staging-app.vercel.app production-app.vercel.app
```

### Feature Flags

```javascript
const FEATURES = {
  enableNewNotifications: process.env.FEATURE_NEW_NOTIFICATIONS === 'true',
  experimentalScraper: process.env.FEATURE_EXPERIMENTAL === 'true'
};

if (FEATURES.enableNewNotifications) {
  await sendEnhancedNotification(data);
}
```

## 📈 Scaling Considerations

### Database Scaling

1. **Connection Limits**
   - Supabase free: 60 connections
   - Pool connections eficientemente

2. **Data Growth**
   - Partición por fecha en price_history
   - Archiving automático de datos antiguos

3. **Read Replicas**
   - APIs de lectura usar replica
   - Scraping usar master

### Function Scaling

1. **Memory Limits**
   - Vercel Pro: 1008MB por función
   - Optimizar uso de Puppeteer

2. **Concurrent Executions**
   - Máximo 1000 concurrent en Pro
   - Rate limiting entre tiendas

3. **Cold Starts**
   - Warmup functions periódicamente
   - Connection pooling

### Cost Optimization

1. **Vercel**
   - Monitor function executions
   - Optimize durations
   - Use appropriate plan

2. **Supabase**
   - Monitor database size
   - Cleanup old data
   - Use appropriate instance

3. **Telegram**
   - Batch notifications
   - Avoid spam limits

## 🛠️ Mantenimiento

### Updates Regulares

1. **Dependencies**
```bash
npm audit
npm update
```

2. **Security Patches**
```bash
# Automated security updates
npm install --save-dev npm-check-updates
ncu -u
```

### Database Maintenance

```sql
-- Limpiar historial antiguo (mensual)
DELETE FROM price_history 
WHERE scraped_at < NOW() - INTERVAL '90 days';

-- Reindexar tablas (según necesidad)
REINDEX INDEX CONCURRENTLY idx_products_updated_at;

-- Analizar estadísticas
ANALYZE products;
ANALYZE price_history;
```

### Monitoring Scripts

```javascript
// Script para generar reporte semanal
const generateWeeklyReport = async () => {
  const stats = await database.getWeeklyStats();
  const report = formatReport(stats);
  await telegram.sendMessage(report);
};

// Ejecutar vía cron job adicional
```

## 🚨 Disaster Recovery

### Backup Strategy

1. **Database Backups**
   - Supabase automatic daily backups
   - Export manual antes de cambios grandes

2. **Code Backups**
   - GitHub repository
   - Local clones en multiple locations

3. **Configuration Backup**
   - Variables de entorno documentadas
   - Deployment scripts en repo

### Recovery Procedures

1. **Database Recovery**
```sql
-- Restore desde backup
pg_restore --host=db.xxx.supabase.co --port=5432 --username=postgres --clean --verbose backup.sql
```

2. **Service Recovery**
```bash
# Redeploy rápido
vercel --prod

# Rollback si es necesario
vercel rollback [deployment-url]
```

3. **Data Validation**
```bash
# Verificar integridad post-recovery
curl https://app.vercel.app/api/test?test=all
```

## 📞 Support y Escalation

### Niveles de Soporte

1. **Level 1**: Logs y documentación
2. **Level 2**: Tests y debugging
3. **Level 3**: Code changes y hotfixes

### Runbooks

1. **Scraper failing**
   - Check Vercel function logs
   - Test individual stores
   - Verify Supabase connectivity

2. **No notifications**
   - Test Telegram bot
   - Check notification settings
   - Verify message formatting

3. **Database issues**
   - Check Supabase status
   - Verify connection strings
   - Monitor query performance

¡Tu scraper está listo para producción! 🚀