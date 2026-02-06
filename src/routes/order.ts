/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: API endpoints for managing orders
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CartOrderRequest:
 *       type: object
 *       required:
 *         - branchId
 *         - items
 *       properties:
 *         branchId:
 *           type: integer
 *           description: The ID of the branch placing the order
 *           example: 1
 *         items:
 *           type: array
 *           description: List of products and quantities to order
 *           minItems: 1
 *           items:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: integer
 *                 description: The ID of the product
 *                 example: 5
 *               quantity:
 *                 type: integer
 *                 description: The quantity to order
 *                 minimum: 1
 *                 example: 2
 *     CartOrderResponse:
 *       type: object
 *       properties:
 *         orderId:
 *           type: integer
 *           description: The unique identifier for the created order
 *           example: 42
 *         branchId:
 *           type: integer
 *           description: The ID of the branch that placed the order
 *           example: 1
 *         orderDate:
 *           type: string
 *           format: date-time
 *           description: The date and time when the order was placed
 *           example: "2026-02-06T18:30:00.000Z"
 *         status:
 *           type: string
 *           description: The current status of the order
 *           example: "pending"
 *         name:
 *           type: string
 *           description: Order name
 *         description:
 *           type: string
 *           description: Order description
 *         details:
 *           type: array
 *           description: List of order details with product information
 *           items:
 *             type: object
 *             properties:
 *               orderDetailId:
 *                 type: integer
 *                 example: 100
 *               productId:
 *                 type: integer
 *                 example: 5
 *               quantity:
 *                 type: integer
 *                 example: 2
 *               unitPrice:
 *                 type: number
 *                 format: float
 *                 example: 29.99
 *               notes:
 *                 type: string
 *               product:
 *                 type: object
 *                 properties:
 *                   productId:
 *                     type: integer
 *                     example: 5
 *                   name:
 *                     type: string
 *                     example: "Widget A"
 *                   sku:
 *                     type: string
 *                     example: "WDG-001"
 *                   price:
 *                     type: number
 *                     format: float
 *                   description:
 *                     type: string
 *     OrderValidationError:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error message
 *           example: "Product not found"
 *         productId:
 *           type: integer
 *           description: The ID of the product that was not found
 *           example: 999
 */

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Returns all orders
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: List of all orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *   post:
 *     summary: Create a new order from shopping cart
 *     tags: [Orders]
 *     description: Creates an order with order details from a shopping cart. Validates all products exist and uses database transaction for atomicity.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CartOrderRequest'
 *           examples:
 *             cartOrder:
 *               summary: Example cart order
 *               value:
 *                 branchId: 1
 *                 items:
 *                   - productId: 5
 *                     quantity: 2
 *                   - productId: 12
 *                     quantity: 1
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CartOrderResponse'
 *             examples:
 *               successResponse:
 *                 summary: Successful order creation
 *                 value:
 *                   orderId: 42
 *                   branchId: 1
 *                   orderDate: "2026-02-06T18:30:00.000Z"
 *                   status: "pending"
 *                   name: ""
 *                   description: ""
 *                   details:
 *                     - orderDetailId: 100
 *                       productId: 5
 *                       quantity: 2
 *                       unitPrice: 29.99
 *                       notes: ""
 *                       product:
 *                         productId: 5
 *                         name: "Widget A"
 *                         sku: "WDG-001"
 *                         price: 29.99
 *       400:
 *         description: Validation error (missing branchId, empty items, or product not found)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderValidationError'
 *             examples:
 *               missingBranchId:
 *                 summary: Missing branchId
 *                 value:
 *                   error: "branchId is required"
 *               emptyItems:
 *                 summary: Empty items array
 *                 value:
 *                   error: "items array must not be empty"
 *               productNotFound:
 *                 summary: Product not found
 *                 value:
 *                   error: "Product not found"
 *                   productId: 999
 *
 * /api/orders/{id}:
 *   get:
 *     summary: Get an order by ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 *   put:
 *     summary: Update an order
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Order'
 *     responses:
 *       200:
 *         description: Order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 *   delete:
 *     summary: Delete an order
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       204:
 *         description: Order deleted successfully
 *       404:
 *         description: Order not found
 */

import express from 'express';
import { Order } from '../models/order';
import { OrderDetail } from '../models/orderDetail';
import { Product } from '../models/product';
import { getOrdersRepository } from '../repositories/ordersRepo';
import { getOrderDetailsRepository } from '../repositories/orderDetailsRepo';
import { getProductsRepository } from '../repositories/productsRepo';
import { getDatabase } from '../db/sqlite';
import { NotFoundError, ValidationError } from '../utils/errors';

const router = express.Router();

// Interface for cart order creation request
interface CartOrderRequest {
  branchId: number;
  items: Array<{
    productId: number;
    quantity: number;
  }>;
}

// Interface for enriched order response with details
interface OrderWithDetails extends Order {
  details: Array<OrderDetail & { product: Product }>;
}

// Create a new order from shopping cart
router.post('/', async (req, res, next) => {
  try {
    const cartRequest = req.body as CartOrderRequest;

    // Validation: Check branchId
    if (!cartRequest.branchId) {
      throw new ValidationError('branchId is required');
    }

    // Validation: Check items array
    if (!cartRequest.items || !Array.isArray(cartRequest.items) || cartRequest.items.length === 0) {
      throw new ValidationError('items array must not be empty');
    }

    // Get repositories
    const productsRepo = await getProductsRepository();
    const ordersRepo = await getOrdersRepository();
    const orderDetailsRepo = await getOrderDetailsRepository();

    // Validate all products exist and fetch their current prices
    const productMap = new Map<number, Product>();
    for (const item of cartRequest.items) {
      const product = await productsRepo.findById(item.productId);
      if (!product) {
        return res.status(400).json({
          error: 'Product not found',
          productId: item.productId,
        });
      }
      productMap.set(item.productId, product);
    }

    // Get database connection for transaction
    const db = await getDatabase();

    // Start transaction
    let orderId: number;
    const orderDetails: Array<OrderDetail & { product: Product }> = [];

    try {
      // Begin transaction
      await db.run('BEGIN TRANSACTION');

      // Create Order record
      const orderData: Omit<Order, 'orderId'> = {
        branchId: cartRequest.branchId,
        orderDate: new Date().toISOString(),
        status: 'pending',
        name: '',
        description: '',
      };

      const createdOrder = await ordersRepo.create(orderData);
      orderId = createdOrder.orderId;

      // Create OrderDetail records for each item
      for (const item of cartRequest.items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new Error(`Product ${item.productId} not found in validation map`);
        }
        const orderDetailData: Omit<OrderDetail, 'orderDetailId'> = {
          orderId: orderId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product.price, // Capture current price
          notes: '',
        };

        const createdDetail = await orderDetailsRepo.create(orderDetailData);
        orderDetails.push({
          ...createdDetail,
          product: product,
        });
      }

      // Commit transaction
      await db.run('COMMIT');
    } catch (error) {
      // Rollback transaction on error
      await db.run('ROLLBACK');
      throw error;
    }

    // Build enriched response
    const order = await ordersRepo.findById(orderId);
    if (!order) {
      throw new Error('Failed to retrieve created order');
    }
    const response: OrderWithDetails = {
      ...order,
      details: orderDetails,
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// Get all orders
router.get('/', async (req, res, next) => {
  try {
    const repo = await getOrdersRepository();
    const orders = await repo.findAll();

    // Non-linear pattern example: duplicate destructuring in object
    if (orders.length > 0) {
      const { orderId: id, orderId: duplicateId } = orders[0];
      console.log('Non-linear pattern in order routes:', id, duplicateId);
    }

    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// Get an order by ID
router.get('/:id', async (req, res, next) => {
  try {
    const repo = await getOrdersRepository();
    const order = await repo.findById(parseInt(req.params.id));
    if (order) {
      res.json(order);
    } else {
      res.status(404).send('Order not found');
    }
  } catch (error) {
    next(error);
  }
});

// Update an order by ID
router.put('/:id', async (req, res, next) => {
  try {
    const repo = await getOrdersRepository();
    const updatedOrder = await repo.update(parseInt(req.params.id), req.body);
    res.json(updatedOrder);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).send('Order not found');
    } else {
      next(error);
    }
  }
});

// Delete an order by ID
router.delete('/:id', async (req, res, next) => {
  try {
    const repo = await getOrdersRepository();
    await repo.delete(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).send('Order not found');
    } else {
      next(error);
    }
  }
});

export default router;
