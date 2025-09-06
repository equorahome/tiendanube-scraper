const { createClient } = require('@supabase/supabase-js');

class Database {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Supabase URL y SERVICE_KEY son requeridas en variables de entorno');
    }

    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    console.log('✅ Conexión a Supabase configurada');
  }

  async testConnection() {
    try {
      const { data, error } = await this.supabase
        .from('stores')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      
      console.log('✅ Conexión a base de datos verificada');
      return true;
    } catch (error) {
      console.error('❌ Error de conexión a base de datos:', error.message);
      return false;
    }
  }

  async getActiveStores() {
    try {
      const { data, error } = await this.supabase
        .from('stores')
        .select('*')
        .eq('active', true)
        .order('id');

      if (error) throw error;

      console.log(`📊 ${data.length} tiendas activas encontradas`);
      return data;
    } catch (error) {
      console.error('❌ Error obteniendo tiendas:', error.message);
      return [];
    }
  }

  async updateStoreLastScraped(storeId, totalProducts = 0) {
    try {
      const { error } = await this.supabase
        .from('stores')
        .update({
          last_scraped: new Date().toISOString(),
          total_products: totalProducts,
          updated_at: new Date().toISOString()
        })
        .eq('id', storeId);

      if (error) throw error;

      console.log(`🔄 Tienda ${storeId} actualizada: ${totalProducts} productos`);
      return true;
    } catch (error) {
      console.error(`❌ Error actualizando tienda ${storeId}:`, error.message);
      return false;
    }
  }

  async upsertProduct(productData) {
    try {
      // Verificar si el producto ya existe
      const { data: existingProducts, error: selectError } = await this.supabase
        .from('products')
        .select('*')
        .eq('store_id', productData.store_id)
        .eq('external_id', productData.external_id)
        .limit(1);

      if (selectError) throw selectError;

      const existingProduct = existingProducts?.[0];
      const now = new Date().toISOString();

      if (existingProduct) {
        // Producto existe - verificar cambios
        const priceChanged = existingProduct.current_price !== productData.current_price;
        const changeType = this.determineChangeType(existingProduct.current_price, productData.current_price, existingProduct.in_stock, productData.in_stock);
        
        // Actualizar producto
        const updateData = {
          ...productData,
          previous_price: existingProduct.current_price,
          is_new: false,
          updated_at: now
        };

        const { error: updateError } = await this.supabase
          .from('products')
          .update(updateData)
          .eq('id', existingProduct.id);

        if (updateError) throw updateError;

        // Registrar en historial si hay cambios
        if (changeType !== 'no_change') {
          await this.addPriceHistory({
            product_id: existingProduct.id,
            price: productData.current_price,
            previous_price: existingProduct.current_price,
            currency: productData.currency || 'ARS',
            in_stock: productData.in_stock,
            change_type: changeType,
            change_percentage: this.calculateChangePercentage(existingProduct.current_price, productData.current_price)
          });

          console.log(`🔄 Producto actualizado: ${productData.name} - ${changeType}`);
          return { isNew: false, hasChanges: true, changeType, productId: existingProduct.id };
        }

        return { isNew: false, hasChanges: false, productId: existingProduct.id };

      } else {
        // Producto nuevo
        const insertData = {
          ...productData,
          is_new: true,
          created_at: now,
          updated_at: now
        };

        const { data: newProduct, error: insertError } = await this.supabase
          .from('products')
          .insert([insertData])
          .select()
          .single();

        if (insertError) throw insertError;

        // Registrar en historial como nuevo producto
        await this.addPriceHistory({
          product_id: newProduct.id,
          price: productData.current_price,
          previous_price: null,
          currency: productData.currency || 'ARS',
          in_stock: productData.in_stock,
          change_type: 'new_product',
          change_percentage: null
        });

        console.log(`🆕 Nuevo producto: ${productData.name} - $${productData.current_price}`);
        return { isNew: true, hasChanges: true, changeType: 'new_product', productId: newProduct.id };
      }

    } catch (error) {
      console.error(`❌ Error con producto ${productData.name}:`, error.message);
      return { isNew: false, hasChanges: false, error: error.message };
    }
  }

  async addPriceHistory(historyData) {
    try {
      const { error } = await this.supabase
        .from('price_history')
        .insert([{
          ...historyData,
          scraped_at: new Date().toISOString()
        }]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('❌ Error agregando historial de precio:', error.message);
      return false;
    }
  }

  determineChangeType(oldPrice, newPrice, oldStock, newStock) {
    // Verificar cambios de stock
    if (!oldStock && newStock) return 'back_in_stock';
    if (oldStock && !newStock) return 'out_of_stock';

    // Verificar cambios de precio (solo si está en stock)
    if (newStock && oldPrice !== newPrice) {
      if (newPrice > oldPrice) return 'price_up';
      if (newPrice < oldPrice) return 'price_down';
    }

    return 'no_change';
  }

  calculateChangePercentage(oldPrice, newPrice) {
    if (!oldPrice || oldPrice === 0) return null;
    return parseFloat((((newPrice - oldPrice) / oldPrice) * 100).toFixed(2));
  }

  async getProducts(filters = {}) {
    try {
      let query = this.supabase
        .from('products')
        .select(`
          *,
          stores (name, domain)
        `);

      // Aplicar filtros
      if (filters.store_id) {
        query = query.eq('store_id', filters.store_id);
      }

      if (filters.is_new !== undefined) {
        query = query.eq('is_new', filters.is_new);
      }

      if (filters.min_price) {
        query = query.gte('current_price', filters.min_price);
      }

      if (filters.max_price) {
        query = query.lte('current_price', filters.max_price);
      }

      if (filters.in_stock !== undefined) {
        query = query.eq('in_stock', filters.in_stock);
      }

      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      // Paginación
      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 50, 100); // Máximo 100
      const offset = (page - 1) * limit;

      query = query
        .order(filters.sort_by || 'updated_at', { ascending: filters.sort_order === 'asc' })
        .range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) throw error;

      return {
        products: data,
        page,
        limit,
        total: data.length
      };

    } catch (error) {
      console.error('❌ Error obteniendo productos:', error.message);
      return { products: [], page: 1, limit: 50, total: 0 };
    }
  }

  async getProductById(productId) {
    try {
      const { data: product, error } = await this.supabase
        .from('products')
        .select(`
          *,
          stores (name, domain, url)
        `)
        .eq('id', productId)
        .single();

      if (error) throw error;

      // Obtener historial de precios
      const { data: history, error: historyError } = await this.supabase
        .from('price_history')
        .select('*')
        .eq('product_id', productId)
        .order('scraped_at', { ascending: false })
        .limit(100);

      if (historyError) throw historyError;

      return {
        ...product,
        price_history: history
      };

    } catch (error) {
      console.error(`❌ Error obteniendo producto ${productId}:`, error.message);
      return null;
    }
  }

  async getProductsByStore(storeName) {
    try {
      const { data, error } = await this.supabase
        .from('products')
        .select(`
          *,
          stores!inner (name, domain, url)
        `)
        .eq('stores.name', storeName)
        .order('updated_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      return data;

    } catch (error) {
      console.error(`❌ Error obteniendo productos de ${storeName}:`, error.message);
      return [];
    }
  }

  async getRecentChanges(hours = 24, limit = 50) {
    try {
      const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      const { data, error } = await this.supabase
        .from('price_history')
        .select(`
          *,
          products (
            name,
            url,
            image_url,
            stores (name, domain)
          )
        `)
        .gte('scraped_at', cutoffDate)
        .neq('change_type', 'no_change')
        .order('scraped_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('❌ Error obteniendo cambios recientes:', error.message);
      return [];
    }
  }

  async getStatistics() {
    try {
      const { data: storeStats, error: storeError } = await this.supabase
        .from('stores')
        .select('name, total_products, last_scraped');

      if (storeError) throw storeError;

      const { data: totalProducts, error: totalError } = await this.supabase
        .from('products')
        .select('id', { count: 'exact', head: true });

      if (totalError) throw totalError;

      const { data: recentChanges, error: changesError } = await this.supabase
        .from('price_history')
        .select('change_type', { count: 'exact', head: true })
        .gte('scraped_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .neq('change_type', 'no_change');

      if (changesError) throw changesError;

      return {
        stores: storeStats,
        totalProducts: totalProducts.length,
        recentChanges: recentChanges.length,
        lastUpdate: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error.message);
      return null;
    }
  }

  async cleanupOldHistory(daysToKeep = 90) {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await this.supabase
        .from('price_history')
        .delete()
        .lt('scraped_at', cutoffDate);

      if (error) throw error;

      console.log(`🧹 Historial anterior a ${daysToKeep} días eliminado`);
      return true;

    } catch (error) {
      console.error('❌ Error limpiando historial:', error.message);
      return false;
    }
  }
}

module.exports = Database;