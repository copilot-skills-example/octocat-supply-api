/**
 * @swagger
 * components:
 *   schemas:
 *     SearchSuggestion:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: [product, supplier, order]
 *           description: The type of entity
 *         id:
 *           type: integer
 *           description: The unique identifier for the entity
 *         text:
 *           type: string
 *           description: The main display text for the suggestion
 *         subtext:
 *           type: string
 *           description: Additional context information
 *         metadata:
 *           type: object
 *           description: Additional metadata specific to the entity type
 *     SearchResponse:
 *       type: object
 *       properties:
 *         query:
 *           type: string
 *           description: The search query that was executed
 *         suggestions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SearchSuggestion'
 */
export interface SearchSuggestion {
  type: 'product' | 'supplier' | 'order';
  id: number;
  text: string;
  subtext: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface SearchResponse {
  query: string;
  suggestions: SearchSuggestion[];
}
