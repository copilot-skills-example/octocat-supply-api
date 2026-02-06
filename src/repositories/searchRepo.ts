/**
 * Repository for search functionality
 */

import { getDatabase, DatabaseConnection } from '../db/sqlite';
import { SearchSuggestion } from '../models/searchSuggestion';
import { handleDatabaseError } from '../utils/errors';
import { objectToCamelCase, DatabaseRow } from '../utils/sql';

type EntityType = 'products' | 'suppliers' | 'orders';

export class SearchRepository {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  /**
   * Search products by name or SKU
   */
  async searchProducts(query: string, limit: number): Promise<SearchSuggestion[]> {
    try {
      const searchPattern = `%${query}%`;
      const exactPattern = query.toLowerCase();
      
      // Search for products matching name or SKU, ordering by relevance
      const sql = `
        SELECT 
          product_id,
          name,
          sku,
          price,
          CASE
            WHEN LOWER(name) = ? OR LOWER(sku) = ? THEN 1
            WHEN LOWER(name) LIKE ? OR LOWER(sku) LIKE ? THEN 2
            ELSE 3
          END AS relevance
        FROM products
        WHERE LOWER(name) LIKE ? OR LOWER(sku) LIKE ?
        ORDER BY relevance, name
        LIMIT ?
      `;
      
      const rows = await this.db.all<DatabaseRow>(sql, [
        exactPattern,
        exactPattern,
        `${exactPattern}%`,
        `${exactPattern}%`,
        searchPattern,
        searchPattern,
        limit
      ]);

      return rows.map(row => {
        const product = objectToCamelCase<{
          productId: number;
          name: string;
          sku: string;
          price: number;
        }>(row);
        return {
          type: 'product' as const,
          id: product.productId,
          text: product.name,
          subtext: `SKU: ${product.sku} | $${product.price}`,
          metadata: {
            price: product.price,
            sku: product.sku
          }
        };
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Search suppliers by name
   */
  async searchSuppliers(query: string, limit: number): Promise<SearchSuggestion[]> {
    try {
      const searchPattern = `%${query}%`;
      const exactPattern = query.toLowerCase();
      
      // Search for suppliers matching name, ordering by relevance
      const sql = `
        SELECT 
          supplier_id,
          name,
          email,
          CASE
            WHEN LOWER(name) = ? THEN 1
            WHEN LOWER(name) LIKE ? THEN 2
            ELSE 3
          END AS relevance
        FROM suppliers
        WHERE LOWER(name) LIKE ?
        ORDER BY relevance, name
        LIMIT ?
      `;
      
      const rows = await this.db.all<DatabaseRow>(sql, [
        exactPattern,
        `${exactPattern}%`,
        searchPattern,
        limit
      ]);

      return rows.map(row => {
        const supplier = objectToCamelCase<{
          supplierId: number;
          name: string;
          email: string;
        }>(row);
        return {
          type: 'supplier' as const,
          id: supplier.supplierId,
          text: supplier.name,
          subtext: supplier.email || ''
        };
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Search orders by name
   */
  async searchOrders(query: string, limit: number): Promise<SearchSuggestion[]> {
    try {
      const searchPattern = `%${query}%`;
      const exactPattern = query.toLowerCase();
      
      // Search for orders matching name, ordering by relevance
      const sql = `
        SELECT 
          order_id,
          name,
          order_date,
          status,
          CASE
            WHEN LOWER(name) = ? THEN 1
            WHEN LOWER(name) LIKE ? THEN 2
            ELSE 3
          END AS relevance
        FROM orders
        WHERE LOWER(name) LIKE ?
        ORDER BY relevance, order_date DESC
        LIMIT ?
      `;
      
      const rows = await this.db.all<DatabaseRow>(sql, [
        exactPattern,
        `${exactPattern}%`,
        searchPattern,
        limit
      ]);

      return rows.map(row => {
        const order = objectToCamelCase<{
          orderId: number;
          name: string;
          orderDate: string;
          status: string;
        }>(row);
        return {
          type: 'order' as const,
          id: order.orderId,
          text: order.name,
          subtext: `Status: ${order.status} | ${new Date(order.orderDate).toLocaleDateString()}`
        };
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Get search suggestions across entities
   */
  async getSuggestions(
    query: string,
    entityType?: EntityType,
    limit: number = 10
  ): Promise<SearchSuggestion[]> {
    try {
      // If entity type is specified, only search that entity
      if (entityType === 'products') {
        return await this.searchProducts(query, limit);
      }
      if (entityType === 'suppliers') {
        return await this.searchSuppliers(query, limit);
      }
      if (entityType === 'orders') {
        return await this.searchOrders(query, limit);
      }

      // Search all entities and balance results
      const perEntityLimit = Math.ceil(limit / 3);
      
      const [products, suppliers, orders] = await Promise.all([
        this.searchProducts(query, perEntityLimit),
        this.searchSuppliers(query, perEntityLimit),
        this.searchOrders(query, perEntityLimit)
      ]);

      // Interleave results to balance entity types
      const allSuggestions: SearchSuggestion[] = [];
      const maxLength = Math.max(products.length, suppliers.length, orders.length);
      
      for (let i = 0; i < maxLength; i++) {
        if (i < products.length) allSuggestions.push(products[i]);
        if (i < suppliers.length) allSuggestions.push(suppliers[i]);
        if (i < orders.length) allSuggestions.push(orders[i]);
        
        if (allSuggestions.length >= limit) break;
      }

      return allSuggestions.slice(0, limit);
    } catch (error) {
      handleDatabaseError(error);
    }
  }
}

// Factory function to create repository instance
export async function createSearchRepository(
  isTest: boolean = false,
): Promise<SearchRepository> {
  const db = await getDatabase(isTest);
  return new SearchRepository(db);
}

// Singleton instance for default usage
let searchRepo: SearchRepository | null = null;

export async function getSearchRepository(isTest: boolean = false): Promise<SearchRepository> {
  const isTestEnv = isTest || process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
  if (isTestEnv) {
    return createSearchRepository(true);
  }
  if (!searchRepo) {
    searchRepo = await createSearchRepository(false);
  }
  return searchRepo;
}
