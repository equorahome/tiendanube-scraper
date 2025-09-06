# 🛍️ TiendaNube Scraper

Sistema completo de scraping automático para tiendas argentinas que usan la plataforma TiendaNube. Monitorea productos, detecta cambios de precio y envía notificaciones automáticas por Telegram.

## ✨ Características

- 🤖 **Scraping automático** 2 veces al día (6:00 y 18:00)
- 🆕 **Detección de productos nuevos** en tiempo real
- 📈 **Monitoreo de cambios de precio** con historial completo
- 📱 **Notificaciones por Telegram** instantáneas
- 💾 **Base de datos PostgreSQL** (Supabase) para almacenamiento
- 🚀 **Deploy gratuito en Vercel** con cron jobs
- 🔌 **API REST completa** para consultar datos
- 🛡️ **Sistema robusto** con manejo de errores y reintentos

## 🏪 Tiendas Monitoreadas

- [Shiva Home](https://www.shivahome.com.ar/)
- [Bazar Nuba](https://bazarnuba.com/)
- [Nimba](https://www.nimba.com.ar/)
- [Vienna Hogar](https://viennahogar.com.ar/)
- [Magnolias Deco](https://www.magnoliasdeco.com.ar/)
- [Duvet](https://www.duvet.com.ar/)
- [Ganga Home](https://www.gangahome.com.ar/)
- [Binah Deco](https://binahdeco.com.ar/)

## 🚀 Instalación Rápida

### 1. Clonar el repositorio

```bash
git clone <tu-repo>
cd tiendanube-scraper
npm install
```

### 2. Configurar Supabase

1. Crear cuenta en [Supabase](https://supabase.com)
2. Crear nuevo proyecto
3. Ir a SQL Editor y ejecutar el contenido de `sql/schema.sql`
4. Obtener URL y API keys desde Settings > API

### 3. Configurar Telegram (Opcional)

1. Hablar con [@BotFather](https://t.me/botfather) en Telegram
2. Crear nuevo bot con `/newbot`
3. Obtener el token del bot
4. Obtener tu chat ID hablando con [@userinfobot](https://t.me/userinfobot)

### 4. Configurar Variables de Entorno

Copiar `.env.example` a `.env` y completar:

```bash
# Supabase (Requerido)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-supabase-anon-key
SUPABASE_SERVICE_KEY=tu-supabase-service-key

# Telegram (Opcional)
TELEGRAM_BOT_TOKEN=tu-telegram-bot-token
TELEGRAM_CHAT_ID=tu-telegram-chat-id

# Configuración opcional
NODE_ENV=production
ENABLE_TELEGRAM_NOTIFICATIONS=true
```

### 5. Deploy en Vercel

1. Conectar repositorio con Vercel
2. Configurar variables de entorno en Vercel Dashboard
3. Deploy automático activará los cron jobs

## 🔧 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Ejecutar tests
npm run test
```

## 📡 API Endpoints

### GET /api/products
Obtener lista de productos con filtros y paginación

```bash
# Ejemplos
curl \"https://tu-app.vercel.app/api/products\"
curl \"https://tu-app.vercel.app/api/products?store_name=Shiva Home&limit=10\"
curl \"https://tu-app.vercel.app/api/products?min_price=1000&max_price=5000\"
curl \"https://tu-app.vercel.app/api/products?search=mesa&is_new=true\"
```

**Parámetros:**
- `page`: Número de página (default: 1)
- `limit`: Productos por página (max: 100, default: 50)
- `store_id`: ID de tienda específica
- `store_name`: Nombre de tienda específica
- `is_new`: Productos nuevos (true/false)
- `min_price`: Precio mínimo
- `max_price`: Precio máximo
- `in_stock`: En stock (true/false)
- `search`: Búsqueda en nombre del producto
- `sort_by`: Campo para ordenar (default: updated_at)
- `sort_order`: Orden asc/desc (default: desc)

### GET /api/scrape
Ejecutar scraping manual

```bash
# Scrapear todas las tiendas
curl \"https://tu-app.vercel.app/api/scrape\"

# Scrapear tienda específica
curl \"https://tu-app.vercel.app/api/scrape?store_id=1\"

# Scraping de prueba sin notificaciones
curl \"https://tu-app.vercel.app/api/scrape?test=true&notify=false\"
```

**Parámetros:**
- `store_id`: ID de tienda específica
- `notify`: Enviar notificaciones (true/false, default: true)
- `test`: Modo test (true/false, default: false)

### GET /api/test
Ejecutar tests del sistema

```bash
# Test completo
curl \"https://tu-app.vercel.app/api/test\"

# Test específico
curl \"https://tu-app.vercel.app/api/test?test=database\"
curl \"https://tu-app.vercel.app/api/test?test=telegram\"
curl \"https://tu-app.vercel.app/api/test?test=scraper&store=Shiva Home\"
```

**Tests disponibles:**
- `all`: Todos los tests (default)
- `database`: Conexión a base de datos
- `telegram`: Notificaciones
- `scraper`: Funcionamiento del scraper
- `env`: Variables de entorno
- `api`: Endpoints de API

### POST /api/webhook
Webhook automático (solo Vercel cron)

Ejecuta automáticamente a las 6:00 y 18:00 (GMT-3).

## 📊 Estructura de la Base de Datos

### Tabla `stores`
Información de las tiendas monitoreadas

### Tabla `products`
Productos actuales con precios e información

### Tabla `price_history`
Historial completo de cambios de precios

Ver `sql/schema.sql` para detalles completos.

## 🔔 Notificaciones de Telegram

El sistema envía automáticamente:

- 🚀 **Inicio de scraping**: Cuando comienza el proceso
- 🆕 **Productos nuevos**: Máximo 20 por día
- 📈 **Cambios de precio**: Solo cambios significativos (>10% o >$1000)
- ✅ **Resumen final**: Estadísticas del scraping
- ❌ **Errores críticos**: Fallos del sistema

### Criterios para Notificaciones

**Productos nuevos:** Todos los productos detectados por primera vez

**Cambios significativos:**
- Cambios de stock (siempre)
- Cambios de precio ≥10%
- Cambios absolutos ≥$5000 (productos caros)
- Cambios absolutos ≥$1000 (productos <$10000)

## ⚙️ Configuración Avanzada

### Variables de Entorno Opcionales

```bash
# Configuración de scraping
SCRAPE_TIMEOUT=120000          # Timeout en ms (default: 120000)
MAX_CONCURRENT_PAGES=3         # Páginas concurrentes (default: 3)

# Configuración de notificaciones
ENABLE_TELEGRAM_NOTIFICATIONS=true  # Habilitar Telegram (default: true)
ENABLE_DEBUG_LOGS=false        # Logs detallados (default: false)
```

### Personalización del Scraper

El scraper está optimizado para TiendaNube pero puede adaptarse:

1. Modificar selectores CSS en `lib/scraper.js`
2. Ajustar lógica de paginación
3. Customizar extracción de datos

### Agregar Nuevas Tiendas

1. Agregar a la tabla `stores` en la base de datos
2. O modificar `sql/schema.sql` y redeployar

## 🐛 Troubleshooting

### Error de conexión a Supabase
- Verificar URL y API keys
- Confirmar que el esquema SQL se ejecutó correctamente
- Revisar políticas RLS si están habilitadas

### Telegram no funciona
- Verificar token del bot con [@BotFather](https://t.me/botfather)
- Confirmar chat ID con [@userinfobot](https://t.me/userinfobot)
- Revisar que `ENABLE_TELEGRAM_NOTIFICATIONS=true`

### Scraper no encuentra productos
- Ejecutar test específico: `/api/test?test=scraper&store=NombreTienda`
- Revisar logs en Vercel Dashboard
- La tienda puede haber cambiado su estructura

### Cron jobs no ejecutan
- Verificar configuración en `vercel.json`
- Confirmar que el proyecto está en plan Pro de Vercel (para crons)
- Revisar logs de Vercel Functions

### Timeouts en Vercel
- Los scraping pueden tomar tiempo, el límite es 300s
- Considerar reducir `MAX_CONCURRENT_PAGES`
- Filtrar tiendas problemáticas temporalmente

## 📈 Monitoreo y Métricas

### Ver logs en tiempo real
```bash
vercel logs --follow
```

### Endpoints de monitoreo
- `GET /api/test`: Estado general del sistema
- `GET /api/products?limit=1`: Verificar datos recientes

### Métricas importantes
- Productos nuevos por día
- Cambios de precio detectados
- Tiempo de respuesta por tienda
- Tasa de éxito del scraping

## 🔒 Seguridad

- ✅ Variables de entorno para credenciales
- ✅ Rate limiting implementado
- ✅ Validación de entrada en APIs
- ✅ Headers CORS configurados
- ✅ Logs sin información sensible

## 🤝 Contribuir

1. Fork el repositorio
2. Crear branch para feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m 'Agregar nueva funcionalidad'`
4. Push al branch: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

## 📝 Changelog

### v1.0.0 (2024-01-XX)
- Sistema base de scraping TiendaNube
- 8 tiendas argentinas integradas
- Notificaciones por Telegram
- API REST completa
- Deploy en Vercel con cron jobs

## 📄 Licencia

MIT License - ver archivo `LICENSE` para detalles.

---

**⭐ Si este proyecto te resulta útil, dale una estrella en GitHub!**

Para soporte técnico, abrir un issue en el repositorio.