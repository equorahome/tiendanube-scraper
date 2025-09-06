-- Eliminar tablas si existen (para recrear)
DROP TABLE IF EXISTS price_history CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS stores CASCADE;

-- Tabla de tiendas
CREATE TABLE stores (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  url VARCHAR(255) NOT NULL,
  domain VARCHAR(100) NOT NULL,
  active BOOLEAN DEFAULT true,
  last_scraped TIMESTAMP,
  total_products INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de productos
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  external_id VARCHAR(100) NOT NULL,
  name VARCHAR(500) NOT NULL,
  slug VARCHAR(255),
  category VARCHAR(100),
  url VARCHAR(1000) NOT NULL,
  image_url VARCHAR(1000),
  current_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  previous_price DECIMAL(12,2),
  currency VARCHAR(3) DEFAULT 'ARS',
  in_stock BOOLEAN DEFAULT true,
  is_new BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(store_id, external_id)
);

-- Tabla de historial de precios
CREATE TABLE price_history (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  price DECIMAL(12,2) NOT NULL,
  previous_price DECIMAL(12,2),
  currency VARCHAR(3) DEFAULT 'ARS',
  in_stock BOOLEAN DEFAULT true,
  change_type VARCHAR(20) CHECK (change_type IN ('new_product', 'price_up', 'price_down', 'back_in_stock', 'out_of_stock', 'no_change')),
  change_percentage DECIMAL(5,2),
  scraped_at TIMESTAMP DEFAULT NOW()
);

-- Insertar las 8 tiendas
INSERT INTO stores (name, url, domain) VALUES
('Shiva Home', 'https://www.shivahome.com.ar/', 'shivahome.com.ar'),
('Bazar Nuba', 'https://bazarnuba.com/', 'bazarnuba.com'),
('Nimba', 'https://www.nimba.com.ar/', 'nimba.com.ar'),
('Vienna Hogar', 'https://viennahogar.com.ar/', 'viennahogar.com.ar'),
('Magnolias Deco', 'https://www.magnoliasdeco.com.ar/', 'magnoliasdeco.com.ar'),
('Duvet', 'https://www.duvet.com.ar/', 'duvet.com.ar'),
('Ganga Home', 'https://www.gangahome.com.ar/', 'gangahome.com.ar'),
('Binah Deco', 'https://binahdeco.com.ar/', 'binahdeco.com.ar');

-- Índices para optimización
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_products_updated_at ON products(updated_at DESC);
CREATE INDEX idx_products_price ON products(current_price);
CREATE INDEX idx_price_history_product_id ON price_history(product_id);
CREATE INDEX idx_price_history_scraped_at ON price_history(scraped_at DESC);
CREATE INDEX idx_price_history_change_type ON price_history(change_type);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();