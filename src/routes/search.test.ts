import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import searchRouter from './search';
import { runMigrations } from '../db/migrate';
import { closeDatabase, getDatabase } from '../db/sqlite';
import { errorHandler } from '../utils/errors';

let app: express.Express;

describe('Search API - Auto-Complete Suggestions', () => {
  beforeEach(async () => {
    // Ensure a fresh in-memory database for each test
    await closeDatabase();
    await getDatabase(true);
    await runMigrations(true);

    const db = await getDatabase();

    // Seed required foreign keys
    await db.run('INSERT INTO headquarters (headquarters_id, name) VALUES (?, ?)', [1, 'HQ One']);
    await db.run(
      'INSERT INTO branches (branch_id, headquarters_id, name, description, address, contact_person, email, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [1, 1, 'Branch One', 'Main branch', '123 Main St', 'John Doe', 'john@octo.com', '555-0100'],
    );

    // Seed suppliers
    await db.run(
      'INSERT INTO suppliers (supplier_id, name, email, contact_person, description, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [1, 'Widget Supplier Inc.', 'john@widget.com', 'John Widget', 'Widget supplier', '555-0200']
    );
    await db.run(
      'INSERT INTO suppliers (supplier_id, name, email, contact_person, description, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [2, 'Gadget Corp', 'contact@gadget.com', 'Jane Gadget', 'Gadget supplier', '555-0300']
    );
    await db.run(
      'INSERT INTO suppliers (supplier_id, name, email, contact_person, description, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [3, 'Widget Masters', 'support@widgetmasters.com', 'Bob Masters', 'Widget expert', '555-0400']
    );

    // Seed products
    await db.run(
      'INSERT INTO products (product_id, supplier_id, name, description, price, sku, unit) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [5, 1, 'Widget A', 'First widget', 29.99, 'WDG-001', 'piece'],
    );
    await db.run(
      'INSERT INTO products (product_id, supplier_id, name, description, price, sku, unit) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [12, 2, 'Gadget B', 'Second gadget', 49.99, 'GDG-002', 'box'],
    );
    await db.run(
      'INSERT INTO products (product_id, supplier_id, name, description, price, sku, unit) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [15, 1, 'Super Widget', 'Premium widget', 99.99, 'WDG-SUPER', 'piece'],
    );
    await db.run(
      'INSERT INTO products (product_id, supplier_id, name, description, price, sku, unit) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [20, 2, 'Mini Gadget', 'Small gadget', 19.99, 'GDG-MINI', 'piece'],
    );

    // Seed orders
    await db.run(
      'INSERT INTO orders (order_id, branch_id, name, description, order_date, status) VALUES (?, ?, ?, ?, ?, ?)',
      [1, 1, 'Widget Order', 'Order for widgets', '2024-01-01', 'pending'],
    );
    await db.run(
      'INSERT INTO orders (order_id, branch_id, name, description, order_date, status) VALUES (?, ?, ?, ?, ?, ?)',
      [2, 1, 'Gadget Order', 'Order for gadgets', '2024-01-02', 'processing'],
    );
    await db.run(
      'INSERT INTO orders (order_id, branch_id, name, description, order_date, status) VALUES (?, ?, ?, ?, ?, ?)',
      [3, 1, 'Widget Restock', 'Restocking widgets', '2024-01-03', 'delivered'],
    );

    // Set up express app
    app = express();
    app.use(express.json());
    app.use('/search', searchRouter);
    app.use(errorHandler);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('should return suggestions for valid query', async () => {
    const response = await request(app).get('/search/suggestions?q=widget');

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
    expect(response.body.query).toBe('widget');
    expect(response.body.suggestions).toBeDefined();
    expect(Array.isArray(response.body.suggestions)).toBe(true);
    expect(response.body.suggestions.length).toBeGreaterThan(0);
  });

  it('should return 400 when query is too short', async () => {
    const response = await request(app).get('/search/suggestions?q=ab');

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toContain('at least 3 characters');
  });

  it('should return 400 when query is missing', async () => {
    const response = await request(app).get('/search/suggestions');

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toContain('required');
  });

  it('should return 400 for invalid entity type', async () => {
    const response = await request(app).get('/search/suggestions?q=widget&entity=invalid');

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toContain('Invalid entity type');
  });

  it('should return 400 when limit exceeds maximum', async () => {
    const response = await request(app).get('/search/suggestions?q=widget&limit=25');

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toContain('cannot exceed 20');
  });

  it('should filter by entity type - products', async () => {
    const response = await request(app).get('/search/suggestions?q=widget&entity=products');

    expect(response.status).toBe(200);
    expect(response.body.suggestions).toBeDefined();
    
    // All results should be products
    response.body.suggestions.forEach((suggestion: any) => {
      expect(suggestion.type).toBe('product');
    });
  });

  it('should filter by entity type - suppliers', async () => {
    const response = await request(app).get('/search/suggestions?q=widget&entity=suppliers');

    expect(response.status).toBe(200);
    expect(response.body.suggestions).toBeDefined();
    
    // All results should be suppliers
    response.body.suggestions.forEach((suggestion: any) => {
      expect(suggestion.type).toBe('supplier');
    });
  });

  it('should filter by entity type - orders', async () => {
    const response = await request(app).get('/search/suggestions?q=widget&entity=orders');

    expect(response.status).toBe(200);
    expect(response.body.suggestions).toBeDefined();
    
    // All results should be orders
    response.body.suggestions.forEach((suggestion: any) => {
      expect(suggestion.type).toBe('order');
    });
  });

  it('should respect limit parameter', async () => {
    const response = await request(app).get('/search/suggestions?q=widget&limit=2');

    expect(response.status).toBe(200);
    expect(response.body.suggestions.length).toBeLessThanOrEqual(2);
  });

  it('should perform case-insensitive matching', async () => {
    const response = await request(app).get('/search/suggestions?q=WIDGET');

    expect(response.status).toBe(200);
    expect(response.body.suggestions.length).toBeGreaterThan(0);
  });

  it('should return empty array for no matches', async () => {
    const response = await request(app).get('/search/suggestions?q=nonexistent');

    expect(response.status).toBe(200);
    expect(response.body.suggestions).toBeDefined();
    expect(response.body.suggestions.length).toBe(0);
  });

  it('should find products by name', async () => {
    const response = await request(app).get('/search/suggestions?q=widget&entity=products');

    expect(response.status).toBe(200);
    const products = response.body.suggestions;
    expect(products.length).toBeGreaterThan(0);
    
    const widgetA = products.find((p: any) => p.text === 'Widget A');
    expect(widgetA).toBeDefined();
    expect(widgetA.type).toBe('product');
    expect(widgetA.id).toBe(5);
    expect(widgetA.subtext).toContain('WDG-001');
    expect(widgetA.subtext).toContain('29.99');
    expect(widgetA.metadata).toBeDefined();
    expect(widgetA.metadata.price).toBe(29.99);
    expect(widgetA.metadata.sku).toBe('WDG-001');
  });

  it('should find products by SKU', async () => {
    const response = await request(app).get('/search/suggestions?q=GDG&entity=products');

    expect(response.status).toBe(200);
    const products = response.body.suggestions;
    expect(products.length).toBeGreaterThan(0);
    
    // Should find products with GDG in SKU
    const gadgets = products.filter((p: any) => p.metadata.sku.includes('GDG'));
    expect(gadgets.length).toBeGreaterThan(0);
  });

  it('should find suppliers by name', async () => {
    const response = await request(app).get('/search/suggestions?q=widget&entity=suppliers');

    expect(response.status).toBe(200);
    const suppliers = response.body.suggestions;
    expect(suppliers.length).toBeGreaterThan(0);
    
    const widgetSupplier = suppliers.find((s: any) => s.text === 'Widget Supplier Inc.');
    expect(widgetSupplier).toBeDefined();
    expect(widgetSupplier.type).toBe('supplier');
    expect(widgetSupplier.id).toBe(1);
    expect(widgetSupplier.subtext).toBe('john@widget.com');
  });

  it('should find orders by name', async () => {
    const response = await request(app).get('/search/suggestions?q=widget&entity=orders');

    expect(response.status).toBe(200);
    const orders = response.body.suggestions;
    expect(orders.length).toBeGreaterThan(0);
    
    const widgetOrder = orders.find((o: any) => o.text === 'Widget Order');
    expect(widgetOrder).toBeDefined();
    expect(widgetOrder.type).toBe('order');
    expect(widgetOrder.id).toBe(1);
    expect(widgetOrder.subtext).toContain('pending');
  });

  it('should balance results across entity types when searching all', async () => {
    const response = await request(app).get('/search/suggestions?q=widget');

    expect(response.status).toBe(200);
    const suggestions = response.body.suggestions;
    
    // Should have results from multiple entity types
    const types = new Set(suggestions.map((s: any) => s.type));
    expect(types.size).toBeGreaterThan(1);
  });

  it('should prioritize exact matches in relevance', async () => {
    // Search for "Widget A" - exact name match
    const response = await request(app).get('/search/suggestions?q=Widget A&entity=products');

    expect(response.status).toBe(200);
    const products = response.body.suggestions;
    
    // Exact match should be first
    if (products.length > 0) {
      expect(products[0].text).toBe('Widget A');
    }
  });

  it('should prioritize starts-with matches over contains', async () => {
    const response = await request(app).get('/search/suggestions?q=wid&entity=products');

    expect(response.status).toBe(200);
    const products = response.body.suggestions;
    
    // Products starting with "wid" should come before those just containing it
    if (products.length > 0) {
      const firstProduct = products[0];
      expect(firstProduct.text.toLowerCase().startsWith('wid')).toBe(true);
    }
  });
});
