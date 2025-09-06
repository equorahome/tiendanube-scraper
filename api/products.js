const Database = require('../lib/database');

module.exports = async (req, res) => {
  // Configurar headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Método no permitido'
    });
  }

  try {
    const database = new Database();
    
    // Verificar conexión
    const connected = await database.testConnection();
    if (!connected) {
      throw new Error('No se pudo conectar a la base de datos');
    }

    // Obtener parámetros de consulta
    const {
      page = '1',
      limit = '50',
      store_id,
      store_name,
      is_new,
      min_price,
      max_price,
      in_stock,
      search,
      sort_by = 'updated_at',
      sort_order = 'desc'
    } = req.query;

    // Validar parámetros
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Máximo 100, mínimo 1

    // Construir filtros
    const filters = {
      page: pageNum,
      limit: limitNum,
      sort_by,
      sort_order
    };

    if (store_id) {
      filters.store_id = parseInt(store_id);
    }

    if (is_new !== undefined) {
      filters.is_new = is_new === 'true';
    }

    if (min_price) {
      filters.min_price = parseFloat(min_price);
    }

    if (max_price) {
      filters.max_price = parseFloat(max_price);
    }

    if (in_stock !== undefined) {
      filters.in_stock = in_stock === 'true';
    }

    if (search) {
      filters.search = search.trim();
    }

    // Si se especifica store_name, obtener productos por nombre de tienda
    if (store_name) {
      const products = await database.getProductsByStore(store_name);
      
      return res.status(200).json({
        success: true,
        data: {
          products: products.slice(0, limitNum),
          pagination: {
            page: 1,
            limit: limitNum,
            total: products.length,
            total_pages: Math.ceil(products.length / limitNum)
          }
        },
        filters: { store_name },
        timestamp: new Date().toISOString()
      });
    }

    // Obtener productos con filtros
    const result = await database.getProducts(filters);
    
    const response = {
      success: true,
      data: {
        products: result.products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: result.total,
          total_pages: Math.ceil(result.total / limitNum),
          has_next: pageNum * limitNum < result.total,
          has_prev: pageNum > 1
        }
      },
      filters,
      timestamp: new Date().toISOString()
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Error en API products:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};