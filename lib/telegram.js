const axios = require('axios');

class TelegramNotifier {
  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.chatId = process.env.TELEGRAM_CHAT_ID;
    this.enabled = process.env.ENABLE_TELEGRAM_NOTIFICATIONS !== 'false';
    
    if (this.enabled && (!this.botToken || !this.chatId)) {
      console.warn('⚠️ Telegram no configurado: TOKEN o CHAT_ID faltantes');
      this.enabled = false;
    }

    if (this.enabled) {
      console.log('📱 Notificaciones de Telegram habilitadas');
    }
  }

  async sendMessage(text, options = {}) {
    if (!this.enabled) {
      console.log('📱 Telegram deshabilitado, mensaje no enviado');
      return false;
    }

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      
      const payload = {
        chat_id: this.chatId,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: options.disablePreview || true,
        ...options
      };

      const response = await axios.post(url, payload, {
        timeout: 10000
      });

      if (response.data.ok) {
        console.log('✅ Mensaje enviado a Telegram');
        return true;
      } else {
        console.error('❌ Error enviando mensaje:', response.data.description);
        return false;
      }

    } catch (error) {
      console.error('❌ Error con API de Telegram:', error.message);
      return false;
    }
  }

  async notifyScrapingStart(stores) {
    const message = `
🚀 <b>Iniciando scraping</b>

📊 <b>${stores.length} tiendas</b> programadas
⏰ ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}

<i>Te notificaré cuando encuentre cambios...</i>
    `.trim();

    return await this.sendMessage(message);
  }

  async notifyScrapingComplete(results) {
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    const totalProducts = results.reduce((sum, r) => sum + r.products.length, 0);
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    let message = `
✅ <b>Scraping completado</b>

📈 <b>Resultados:</b>
• ${successful}/${results.length} tiendas exitosas
• ${totalProducts} productos procesados
• ⏱️ ${totalDuration.toFixed(1)}s total

⏰ ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}
    `.trim();

    if (failed > 0) {
      const failedStores = results
        .filter(r => !r.success)
        .map(r => r.store.name)
        .join(', ');
      
      message += `\n\n⚠️ <b>Tiendas con error:</b>\n${failedStores}`;
    }

    return await this.sendMessage(message);
  }

  async notifyNewProducts(newProducts) {
    if (!newProducts || newProducts.length === 0) return true;

    const grouped = this.groupProductsByStore(newProducts);
    
    for (const [storeName, products] of Object.entries(grouped)) {
      const message = this.formatNewProductsMessage(storeName, products);
      await this.sendMessage(message);
      
      // Pausa entre mensajes para evitar rate limiting
      if (Object.keys(grouped).indexOf(storeName) < Object.keys(grouped).length - 1) {
        await this.delay(1000);
      }
    }

    return true;
  }

  async notifyPriceChanges(priceChanges) {
    if (!priceChanges || priceChanges.length === 0) return true;

    const grouped = this.groupChangesByType(priceChanges);
    
    for (const [changeType, changes] of Object.entries(grouped)) {
      const message = this.formatPriceChangesMessage(changeType, changes);
      await this.sendMessage(message);
      
      // Pausa entre mensajes
      if (Object.keys(grouped).indexOf(changeType) < Object.keys(grouped).length - 1) {
        await this.delay(1000);
      }
    }

    return true;
  }

  formatNewProductsMessage(storeName, products) {
    const count = products.length;
    const emoji = this.getStoreEmoji(storeName);
    
    let message = `
🆕 <b>${count} nuevo${count > 1 ? 's' : ''} producto${count > 1 ? 's' : ''}</b>
${emoji} <b>${storeName}</b>

`;

    // Mostrar máximo 5 productos por mensaje
    const displayProducts = products.slice(0, 5);
    
    for (const product of displayProducts) {
      const price = this.formatPrice(product.current_price);
      const name = this.truncateText(product.name, 50);
      
      message += `💰 <b>${price}</b> - ${name}\n`;
      
      if (product.url) {
        message += `🔗 <a href="${product.url}">Ver producto</a>\n`;
      }
      message += '\n';
    }

    if (products.length > 5) {
      message += `<i>... y ${products.length - 5} más</i>\n`;
    }

    message += `⏰ ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`;

    return message.trim();
  }

  formatPriceChangesMessage(changeType, changes) {
    const count = changes.length;
    const emoji = this.getChangeTypeEmoji(changeType);
    const title = this.getChangeTypeTitle(changeType);
    
    let message = `
${emoji} <b>${title}</b> (${count})

`;

    // Agrupar por tienda para mejor organización
    const groupedByStore = this.groupProductsByStore(changes);
    
    for (const [storeName, storeChanges] of Object.entries(groupedByStore)) {
      const storeEmoji = this.getStoreEmoji(storeName);
      message += `${storeEmoji} <b>${storeName}</b>\n`;
      
      // Mostrar máximo 3 productos por tienda
      const displayChanges = storeChanges.slice(0, 3);
      
      for (const change of displayChanges) {
        const name = this.truncateText(change.name, 40);
        const currentPrice = this.formatPrice(change.current_price);
        const previousPrice = change.previous_price ? this.formatPrice(change.previous_price) : null;
        
        if (changeType === 'price_up' || changeType === 'price_down') {
          const percentage = change.change_percentage ? `(${change.change_percentage > 0 ? '+' : ''}${change.change_percentage}%)` : '';
          message += `  • ${name}\n    ${previousPrice} → <b>${currentPrice}</b> ${percentage}\n`;
        } else {
          message += `  • ${name} - <b>${currentPrice}</b>\n`;
        }
        
        if (change.url) {
          message += `    🔗 <a href="${change.url}">Ver</a>\n`;
        }
      }
      
      if (storeChanges.length > 3) {
        message += `  <i>... y ${storeChanges.length - 3} más</i>\n`;
      }
      message += '\n';
    }

    message += `⏰ ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`;

    return message.trim();
  }

  async notifyError(error, context = '') {
    if (!this.enabled) return false;

    const message = `
❌ <b>Error en scraping</b>

🔍 <b>Contexto:</b> ${context || 'General'}
📝 <b>Error:</b> ${error}

⏰ ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}
    `.trim();

    return await this.sendMessage(message);
  }

  async notifyDailySummary(stats) {
    const message = `
📊 <b>Resumen diario</b>

🏪 <b>Tiendas activas:</b> ${stats.stores?.length || 0}
📦 <b>Total productos:</b> ${stats.totalProducts || 0}
🔄 <b>Cambios últimas 24h:</b> ${stats.recentChanges || 0}

⏰ ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}
    `.trim();

    return await this.sendMessage(message);
  }

  groupProductsByStore(products) {
    const grouped = {};
    
    for (const product of products) {
      const storeName = product.stores?.name || product.store_name || 'Desconocida';
      
      if (!grouped[storeName]) {
        grouped[storeName] = [];
      }
      
      grouped[storeName].push(product);
    }
    
    return grouped;
  }

  groupChangesByType(changes) {
    const grouped = {};
    
    for (const change of changes) {
      const type = change.change_type || 'unknown';
      
      if (!grouped[type]) {
        grouped[type] = [];
      }
      
      // Incluir datos del producto
      grouped[type].push({
        ...change,
        name: change.products?.name || change.name || 'Sin nombre',
        url: change.products?.url || change.url,
        current_price: change.price || change.current_price,
        store_name: change.products?.stores?.name || change.store_name
      });
    }
    
    return grouped;
  }

  getStoreEmoji(storeName) {
    const emojis = {
      'Shiva Home': '🏠',
      'Bazar Nuba': '🛍️',
      'Nimba': '🌟',
      'Vienna Hogar': '🏰',
      'Magnolias Deco': '🌸',
      'Duvet': '🛏️',
      'Ganga Home': '💰',
      'Binah Deco': '✨'
    };
    
    return emojis[storeName] || '🏪';
  }

  getChangeTypeEmoji(changeType) {
    const emojis = {
      'price_up': '📈',
      'price_down': '📉',
      'back_in_stock': '✅',
      'out_of_stock': '❌',
      'new_product': '🆕'
    };
    
    return emojis[changeType] || '🔄';
  }

  getChangeTypeTitle(changeType) {
    const titles = {
      'price_up': 'Precios subieron',
      'price_down': 'Precios bajaron',
      'back_in_stock': 'Volvió stock',
      'out_of_stock': 'Sin stock',
      'new_product': 'Productos nuevos'
    };
    
    return titles[changeType] || 'Cambios';
  }

  formatPrice(price) {
    if (!price) return '$0';
    
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Método para test
  async testConnection() {
    if (!this.enabled) {
      console.log('📱 Telegram deshabilitado');
      return false;
    }

    const testMessage = `
🧪 <b>Test de conexión</b>

✅ Bot configurado correctamente
⏰ ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}
    `.trim();

    return await this.sendMessage(testMessage);
  }
}

module.exports = TelegramNotifier;