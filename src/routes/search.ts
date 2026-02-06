/**
 * @swagger
 * tags:
 *   name: Search
 *   description: API endpoints for search functionality
 */

/**
 * @swagger
 * /api/search/suggestions:
 *   get:
 *     summary: Get search suggestions for auto-complete
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 3
 *         description: Search query (minimum 3 characters)
 *         example: widget
 *       - in: query
 *         name: entity
 *         required: false
 *         schema:
 *           type: string
 *           enum: [products, suppliers, orders]
 *         description: Filter by entity type (default - all)
 *         example: products
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 10
 *         description: Maximum number of results to return (default - 10, max - 20)
 *         example: 10
 *     responses:
 *       200:
 *         description: Search suggestions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SearchResponse'
 *             example:
 *               query: widget
 *               suggestions:
 *                 - type: product
 *                   id: 5
 *                   text: Widget A
 *                   subtext: "SKU: WDG-001 | $29.99"
 *                   metadata:
 *                     price: 29.99
 *                     sku: WDG-001
 *                 - type: supplier
 *                   id: 2
 *                   text: Widget Supplier Inc.
 *                   subtext: john@widget.com
 *       400:
 *         description: Bad request - Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                     message:
 *                       type: string
 *             examples:
 *               queryTooShort:
 *                 value:
 *                   error:
 *                     code: VALIDATION_ERROR
 *                     message: "Validation error: Query must be at least 3 characters long"
 *               invalidEntity:
 *                 value:
 *                   error:
 *                     code: VALIDATION_ERROR
 *                     message: "Validation error: Invalid entity type. Must be one of: products, suppliers, orders"
 *               limitExceeded:
 *                 value:
 *                   error:
 *                     code: VALIDATION_ERROR
 *                     message: "Validation error: Limit cannot exceed 20"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                     message:
 *                       type: string
 */

import express from 'express';
import { getSearchRepository } from '../repositories/searchRepo';
import { ValidationError } from '../utils/errors';

const router = express.Router();

// Get search suggestions
router.get('/suggestions', async (req, res, next) => {
  try {
    const query = req.query.q as string;
    const entity = req.query.entity as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    // Validate query parameter
    if (!query) {
      throw new ValidationError('Query parameter "q" is required');
    }
    if (query.length < 3) {
      throw new ValidationError('Query must be at least 3 characters long');
    }

    // Validate entity parameter
    const validEntities = ['products', 'suppliers', 'orders'];
    if (entity && !validEntities.includes(entity)) {
      throw new ValidationError(`Invalid entity type. Must be one of: ${validEntities.join(', ')}`);
    }

    // Validate limit parameter
    if (isNaN(limit) || limit < 1) {
      throw new ValidationError('Limit must be a positive number');
    }
    if (limit > 20) {
      throw new ValidationError('Limit cannot exceed 20');
    }

    const repo = await getSearchRepository();
    const suggestions = await repo.getSuggestions(
      query,
      entity as 'products' | 'suppliers' | 'orders' | undefined,
      limit
    );

    res.json({
      query,
      suggestions
    });
  } catch (error) {
    next(error);
  }
});

export default router;
