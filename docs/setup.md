# 🔧 Guía Completa de Configuración

Esta guía te llevará paso a paso para configurar el TiendaNube Scraper desde cero hasta tenerlo funcionando en producción.

## 📋 Prerrequisitos

- Cuenta en [GitHub](https://github.com)
- Cuenta en [Vercel](https://vercel.com)
- Cuenta en [Supabase](https://supabase.com)
- Cuenta en [Telegram](https://telegram.org) (opcional)
- Node.js 18+ instalado localmente (para desarrollo)

## 🗄️ Paso 1: Configurar Supabase

### 1.1 Crear Proyecto

1. Ve a [Supabase](https://supabase.com) y registrarte/inicia sesión
2. Clic en **"New Project"**
3. Completa los datos:
   - **Name**: `tiendanube-scraper`
   - **Database Password**: Generar una contraseña segura (guárdala)
   - **Region**: Seleccionar la más cercana a Argentina
4. Clic en **"Create new project"**
5. Esperar a que se complete la configuración (2-3 minutos)

### 1.2 Configurar Base de Datos

1. En el dashboard de tu proyecto, ir a **SQL Editor**
2. Clic en **"New query"**
3. Copiar todo el contenido del archivo `sql/schema.sql`
4. Pegar en el editor SQL
5. Clic en **"Run"**
6. Verificar que aparezca: **"Success. No rows returned"**

### 1.3 Obtener Credenciales

1. Ir a **Settings** > **API**
2. Copiar y guardar:
   - **Project URL** (será tu `SUPABASE_URL`)
   - **anon/public** key (será tu `SUPABASE_ANON_KEY`)
   - **service_role** key (será tu `SUPABASE_SERVICE_KEY`)

⚠️ **Importante**: La `service_role` key tiene permisos completos. Mantenla secreta.

### 1.4 Verificar Tablas

1. Ir a **Table Editor**
2. Verificar que existan 3 tablas:
   - `stores` (con 8 tiendas insertadas)
   - `products` (vacía inicialmente)
   - `price_history` (vacía inicialmente)

## 📱 Paso 2: Configurar Telegram (Opcional pero Recomendado)

### 2.1 Crear Bot

1. Abrir Telegram y buscar [@BotFather](https://t.me/botfather)
2. Enviar `/start`
3. Enviar `/newbot`
4. Seguir instrucciones:
   - **Bot name**: `TiendaNube Scraper` (o el que prefieras)
   - **Username**: `tu_usuario_scraper_bot` (debe terminar en 'bot')
5. Guardar el **token** que aparece (será tu `TELEGRAM_BOT_TOKEN`)

### 2.2 Obtener Chat ID

Método 1 - Usando bot:
1. Buscar [@userinfobot](https://t.me/userinfobot)
2. Enviar `/start`
3. Copiar el **ID** que aparece (será tu `TELEGRAM_CHAT_ID`)

Método 2 - Manual:
1. Enviar un mensaje a tu bot desde tu cuenta personal
2. Abrir: `https://api.telegram.org/bot<TU_BOT_TOKEN>/getUpdates`
3. Buscar `\"chat\":{\"id\":NUMERO` y copiar ese número

### 2.3 Probar Bot

1. Enviar `/start` a tu bot
2. Si no responde, es normal (aún no está programado)
3. Lo importante es que no aparezca \"Bot doesn't exist\"

## 🚀 Paso 3: Deploy en Vercel

### 3.1 Preparar Repositorio

1. Crear nuevo repositorio en GitHub
2. Subir todo el código del proyecto:
```bash
git init
git add .
git commit -m \"Initial commit\"
git branch -M main
git remote add origin https://github.com/tu-usuario/tu-repo.git
git push -u origin main
```

### 3.2 Conectar con Vercel

1. Ir a [Vercel](https://vercel.com) e iniciar sesión
2. Clic en **\"New Project\"**
3. Seleccionar tu repositorio de GitHub
4. En **Configure Project**:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (raíz)
   - **Build Command**: `npm run build` (o dejar vacío)
   - **Output Directory**: Dejar vacío

### 3.3 Configurar Variables de Entorno

1. En la sección **Environment Variables**, agregar una por una:

```bash
# Variables requeridas
SUPABASE_URL = https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY = eyJ... (tu anon key)
SUPABASE_SERVICE_KEY = eyJ... (tu service key)

# Variables opcionales de Telegram
TELEGRAM_BOT_TOKEN = 123456:ABC... (tu bot token)
TELEGRAM_CHAT_ID = 123456789 (tu chat ID)

# Variables de configuración
NODE_ENV = production
ENABLE_TELEGRAM_NOTIFICATIONS = true
SCRAPE_TIMEOUT = 120000
MAX_CONCURRENT_PAGES = 3
```

2. Clic en **\"Deploy\"**
3. Esperar a que termine el deploy (2-3 minutos)

### 3.4 Verificar Deploy

1. Cuando termine, clic en **\"Visit\"**
2. Ir a: `https://tu-app.vercel.app/api/test`
3. Verificar que aparezcan tests exitosos

## 🧪 Paso 4: Probar el Sistema

### 4.1 Test General

```bash
curl https://tu-app.vercel.app/api/test
```

Debe retornar algo como:
```json
{
  \"success\": true,
  \"tests\": {
    \"database\": { \"status\": \"success\" },
    \"telegram\": { \"status\": \"success\" },
    \"scraper\": { \"status\": \"success\" },
    \"environment\": { \"status\": \"success\" }
  }
}
```

### 4.2 Test de Scraping

```bash
curl \"https://tu-app.vercel.app/api/scrape?test=true&notify=false\"
```

Debe retornar productos encontrados de las tiendas.

### 4.3 Test de Base de Datos

```bash
curl https://tu-app.vercel.app/api/products
```

Debe retornar lista de productos (inicialmente vacía).

### 4.4 Test de Telegram

```bash
curl \"https://tu-app.vercel.app/api/test?test=telegram\"
```

Debes recibir un mensaje de prueba en Telegram.

## ⚙️ Paso 5: Configuración Avanzada

### 5.1 Verificar Cron Jobs

1. En Vercel Dashboard, ir a **Functions**
2. Verificar que aparezca `/api/webhook`
3. En **Cron Jobs** debe aparecer: `0 6,18 * * *`

⚠️ **Nota**: Los cron jobs requieren plan Pro de Vercel. En plan Hobby no funcionan.

### 5.2 Monitorear Logs

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Ver logs en vivo
vercel logs --follow
```

### 5.3 Configurar Alertas

En Supabase:
1. Ir a **Settings** > **Notifications**
2. Configurar alertas por email para:
   - Database errors
   - High resource usage

## 🔧 Paso 6: Personalización

### 6.1 Modificar Frecuencia de Scraping

Editar `vercel.json`:
```json
{
  \"crons\": [
    {
      \"path\": \"/api/webhook\",
      \"schedule\": \"0 8,20 * * *\"  // 8:00 y 20:00
    }
  ]
}
```

### 6.2 Agregar Nueva Tienda

En Supabase SQL Editor:
```sql
INSERT INTO stores (name, url, domain) VALUES
('Nueva Tienda', 'https://nuevatienda.com', 'nuevatienda.com');
```

### 6.3 Personalizar Notificaciones

Editar `lib/telegram.js` para cambiar:
- Formato de mensajes
- Emojis utilizados
- Criterios de notificación

## 📊 Paso 7: Monitoreo y Mantenimiento

### 7.1 Dashboard de Supabase

- **Table Editor**: Ver productos y cambios
- **SQL Editor**: Ejecutar consultas personalizadas
- **Logs**: Ver errores de base de datos
- **Metrics**: Monitorear uso de recursos

### 7.2 Dashboard de Vercel

- **Functions**: Ver ejecuciones y duraciones
- **Analytics**: Tráfico y rendimiento
- **Logs**: Errores y debugging

### 7.3 Consultas Útiles

Ver productos nuevos del día:
```sql
SELECT p.name, p.current_price, s.name as store_name
FROM products p
JOIN stores s ON p.store_id = s.id
WHERE p.created_at >= CURRENT_DATE
ORDER BY p.created_at DESC;
```

Ver cambios de precio recientes:
```sql
SELECT ph.*, p.name, s.name as store_name
FROM price_history ph
JOIN products p ON ph.product_id = p.id
JOIN stores s ON p.store_id = s.id
WHERE ph.scraped_at >= NOW() - INTERVAL '24 hours'
AND ph.change_type != 'no_change'
ORDER BY ph.scraped_at DESC;
```

## ❗ Solución de Problemas Comunes

### Error: \"Database connection failed\"
- Verificar SUPABASE_URL y SUPABASE_SERVICE_KEY
- Confirmar que el proyecto Supabase esté activo
- Revisar que se ejecutó el schema SQL

### Error: \"Telegram not configured\"
- Verificar TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID
- Probar enviar mensaje manual al bot
- Confirmar que ENABLE_TELEGRAM_NOTIFICATIONS=true

### Error: \"Puppeteer launch failed\"
- Es normal en desarrollo local
- En Vercel debería funcionar automáticamente
- Verificar que no exceda límites de memoria

### Cron jobs no ejecutan
- Verificar plan de Vercel (requiere Pro)
- Revisar configuración en vercel.json
- Ver logs de Functions en dashboard

### Timeouts frecuentes
- Reducir MAX_CONCURRENT_PAGES
- Aumentar SCRAPE_TIMEOUT
- Desactivar tiendas problemáticas temporalmente

## 📞 Soporte

Si tienes problemas:

1. **Revisar logs**: `vercel logs --follow`
2. **Ejecutar tests**: `curl tu-app.vercel.app/api/test`
3. **Verificar variables de entorno** en Vercel Dashboard
4. **Consultar documentación** de Supabase/Vercel
5. **Abrir issue** en el repositorio GitHub

## ✅ Checklist Final

- [ ] Proyecto Supabase creado y configurado
- [ ] Schema SQL ejecutado correctamente
- [ ] Bot de Telegram creado y configurado
- [ ] Repositorio GitHub creado
- [ ] Deploy en Vercel completado
- [ ] Variables de entorno configuradas
- [ ] Tests pasando correctamente
- [ ] Primera notificación de Telegram recibida
- [ ] Cron jobs programados (si tienes plan Pro)
- [ ] Monitoreo configurado

¡Felicidades! Tu TiendaNube Scraper está listo para funcionar 🎉