-- Migration 003: Add indexes for search functionality
-- Creates indexes to optimize search queries for auto-complete feature

-- Add index on products name for faster product name searches
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- Add index on products SKU for faster SKU searches
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- Add index on suppliers name for faster supplier name searches
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);

-- Add index on orders name for faster order name searches
CREATE INDEX IF NOT EXISTS idx_orders_name ON orders(name);
