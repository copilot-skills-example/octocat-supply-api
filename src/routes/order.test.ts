import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import orderRouter from './order';
import { runMigrations } from '../db/migrate';
import { closeDatabase, getDatabase } from '../db/sqlite';
import { errorHandler } from '../utils/errors';

let app: express.Express;

describe('Order API - Cart Order Creation', () => {
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
    await db.run('INSERT INTO suppliers (supplier_id, name) VALUES (?, ?)', [1, 'Supplier One']);
    await db.run('INSERT INTO suppliers (supplier_id, name) VALUES (?, ?)', [2, 'Supplier Two']);

    // Seed products
    await db.run(
      'INSERT INTO products (product_id, supplier_id, name, description, price, sku, unit) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [5, 1, 'Widget A', 'First widget', 29.99, 'WDG-001', 'piece'],
    );
    await db.run(
      'INSERT INTO products (product_id, supplier_id, name, description, price, sku, unit) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [12, 2, 'Gadget B', 'Second gadget', 49.99, 'GDG-002', 'box'],
    );

    // Set up express app
    app = express();
    app.use(express.json());
    app.use('/orders', orderRouter);
    app.use(errorHandler);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('should create an order from shopping cart successfully', async () => {
    const cartOrderRequest = {
      branchId: 1,
      items: [
        { productId: 5, quantity: 2 },
        { productId: 12, quantity: 1 },
      ],
    };

    const response = await request(app).post('/orders').send(cartOrderRequest);

    expect(response.status).toBe(201);
    expect(response.body).toBeDefined();
    expect(response.body.orderId).toBeDefined();
    expect(response.body.branchId).toBe(1);
    expect(response.body.status).toBe('pending');
    expect(response.body.orderDate).toBeDefined();
    expect(response.body.details).toBeDefined();
    expect(response.body.details.length).toBe(2);

    // Verify first order detail
    const detail1 = response.body.details.find((d: any) => d.productId === 5);
    expect(detail1).toBeDefined();
    expect(detail1.quantity).toBe(2);
    expect(detail1.unitPrice).toBe(29.99);
    expect(detail1.product).toBeDefined();
    expect(detail1.product.name).toBe('Widget A');
    expect(detail1.product.sku).toBe('WDG-001');

    // Verify second order detail
    const detail2 = response.body.details.find((d: any) => d.productId === 12);
    expect(detail2).toBeDefined();
    expect(detail2.quantity).toBe(1);
    expect(detail2.unitPrice).toBe(49.99);
    expect(detail2.product).toBeDefined();
    expect(detail2.product.name).toBe('Gadget B');
    expect(detail2.product.sku).toBe('GDG-002');
  });

  it('should return 400 when branchId is missing', async () => {
    const invalidRequest = {
      items: [{ productId: 5, quantity: 2 }],
    };

    const response = await request(app).post('/orders').send(invalidRequest);

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toContain('branchId is required');
  });

  it('should return 400 when items array is empty', async () => {
    const invalidRequest = {
      branchId: 1,
      items: [],
    };

    const response = await request(app).post('/orders').send(invalidRequest);

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toContain('items array must not be empty');
  });

  it('should return 400 when items array is missing', async () => {
    const invalidRequest = {
      branchId: 1,
    };

    const response = await request(app).post('/orders').send(invalidRequest);

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toContain('items array must not be empty');
  });

  it('should return 400 when product does not exist', async () => {
    const invalidRequest = {
      branchId: 1,
      items: [
        { productId: 5, quantity: 2 },
        { productId: 999, quantity: 1 }, // Non-existent product
      ],
    };

    const response = await request(app).post('/orders').send(invalidRequest);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Product not found');
    expect(response.body.productId).toBe(999);
  });

  it('should rollback transaction when order detail creation fails', async () => {
    const db = await getDatabase();

    // First, create a valid cart order to verify setup
    const validRequest = {
      branchId: 1,
      items: [{ productId: 5, quantity: 2 }],
    };

    const response = await request(app).post('/orders').send(validRequest);
    expect(response.status).toBe(201);

    // Count orders before invalid request
    const ordersBefore = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM orders');
    const detailsBefore = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM order_details');

    // Try to create order with non-existent product (should fail and rollback)
    const invalidRequest = {
      branchId: 1,
      items: [{ productId: 888, quantity: 1 }],
    };

    const failResponse = await request(app).post('/orders').send(invalidRequest);
    expect(failResponse.status).toBe(400);

    // Verify no new orders or details were created (transaction rolled back)
    const ordersAfter = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM orders');
    const detailsAfter = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM order_details');

    expect(ordersAfter?.count).toBe(ordersBefore?.count);
    expect(detailsAfter?.count).toBe(detailsBefore?.count);
  });

  it('should capture current product price as unitPrice', async () => {
    const db = await getDatabase();

    // Create order with current price
    const cartRequest = {
      branchId: 1,
      items: [{ productId: 5, quantity: 1 }],
    };

    const response = await request(app).post('/orders').send(cartRequest);
    expect(response.status).toBe(201);
    expect(response.body.details[0].unitPrice).toBe(29.99);

    // Update product price
    await db.run('UPDATE products SET price = ? WHERE product_id = ?', [39.99, 5]);

    // Create another order - should capture new price
    const cartRequest2 = {
      branchId: 1,
      items: [{ productId: 5, quantity: 1 }],
    };

    const response2 = await request(app).post('/orders').send(cartRequest2);
    expect(response2.status).toBe(201);
    expect(response2.body.details[0].unitPrice).toBe(39.99);

    // Verify first order still has old price
    const firstOrderId = response.body.orderId;
    const orderDetailRow = await db.get<{ unit_price: number }>(
      'SELECT unit_price FROM order_details WHERE order_id = ?',
      [firstOrderId],
    );
    expect(orderDetailRow?.unit_price).toBe(29.99);
  });
});
