---
name: api-endpoint
description: Generate REST API endpoints for the OctoCAT Supply Chain application following established patterns. Use this skill when creating new CRUD endpoints, adding routes, implementing repository classes, or defining TypeScript models with Swagger documentation. Triggers on requests to add API features, create endpoints, implement data access layers, or extend the Express.js backend.
---

# API Endpoint Development

This skill guides the creation of REST API endpoints following the OctoCAT Supply Chain application's established patterns.

## Architecture Overview

The API follows a layered architecture:
```
Routes (Express.js) → Repository (Data Access) → SQLite Database
     ↓                      ↓
   Models              SQL Utilities
```

## When to Use This Skill

- Creating new CRUD endpoints for entities
- Adding a new model/entity to the system
- Implementing repository classes for data access
- Writing Swagger/OpenAPI documentation
- Extending existing routes with new operations

## Workflow

### Step 1: Define the Model

Create a TypeScript interface in `src/models/{entity}.ts` with Swagger schema documentation.

**Pattern:**
```typescript
/**
 * @swagger
 * components:
 *   schemas:
 *     EntityName:
 *       type: object
 *       required:
 *         - entityNameId
 *         - name
 *       properties:
 *         entityNameId:
 *           type: integer
 *           description: The unique identifier
 *         name:
 *           type: string
 *           description: The name field
 */
export interface EntityName {
  entityNameId: number;
  name: string;
  // ... other fields using camelCase
}
```

**Key conventions:**
- Primary key: `{entityName}Id` (camelCase)
- Use `boolean` for flags, `string` for dates (ISO format)
- Include Swagger `@swagger` JSDoc comments above the interface

### Step 2: Create the Repository

Create `src/repositories/{entityName}sRepo.ts` following the repository pattern.

**Required imports:**
```typescript
import { getDatabase, DatabaseConnection } from '../db/sqlite';
import { EntityName } from '../models/entityName';
import { handleDatabaseError, NotFoundError } from '../utils/errors';
import { buildInsertSQL, buildUpdateSQL, objectToCamelCase, mapDatabaseRows, DatabaseRow } from '../utils/sql';
```

**Repository class structure:**
```typescript
export class EntityNamesRepository {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  async findAll(): Promise<EntityName[]> {
    try {
      const rows = await this.db.all<DatabaseRow>('SELECT * FROM entity_names ORDER BY entity_name_id');
      return mapDatabaseRows<EntityName>(rows);
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  async findById(id: number): Promise<EntityName | null> {
    try {
      const row = await this.db.get<DatabaseRow>('SELECT * FROM entity_names WHERE entity_name_id = ?', [id]);
      return row ? objectToCamelCase<EntityName>(row) : null;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  async create(entity: Omit<EntityName, 'entityNameId'>): Promise<EntityName> {
    try {
      const { sql, values } = buildInsertSQL('entity_names', entity);
      const result = await this.db.run(sql, values);
      const created = await this.findById(result.lastID || 0);
      if (!created) throw new Error('Failed to retrieve created entity');
      return created;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  async update(id: number, entity: Partial<Omit<EntityName, 'entityNameId'>>): Promise<EntityName> {
    try {
      const { sql, values } = buildUpdateSQL('entity_names', entity, 'entity_name_id = ?');
      const result = await this.db.run(sql, [...values, id]);
      if (result.changes === 0) throw new NotFoundError('EntityName', id);
      const updated = await this.findById(id);
      if (!updated) throw new Error('Failed to retrieve updated entity');
      return updated;
    } catch (error) {
      handleDatabaseError(error, 'EntityName', id);
    }
  }

  async delete(id: number): Promise<void> {
    try {
      const result = await this.db.run('DELETE FROM entity_names WHERE entity_name_id = ?', [id]);
      if (result.changes === 0) throw new NotFoundError('EntityName', id);
    } catch (error) {
      handleDatabaseError(error, 'EntityName', id);
    }
  }

  async exists(id: number): Promise<boolean> {
    try {
      const result = await this.db.get<{ count: number }>(
        'SELECT COUNT(*) as count FROM entity_names WHERE entity_name_id = ?', [id]
      );
      return (result?.count || 0) > 0;
    } catch (error) {
      handleDatabaseError(error);
    }
  }
}
```

**Add factory and singleton pattern:**
```typescript
export async function createEntityNamesRepository(isTest: boolean = false): Promise<EntityNamesRepository> {
  const db = await getDatabase(isTest);
  return new EntityNamesRepository(db);
}

let entityNamesRepo: EntityNamesRepository | null = null;

export async function getEntityNamesRepository(isTest: boolean = false): Promise<EntityNamesRepository> {
  if (!entityNamesRepo) {
    entityNamesRepo = await createEntityNamesRepository(isTest);
  }
  return entityNamesRepo;
}
```

### Step 3: Create the Route

Create `src/routes/{entityName}.ts` with Swagger documentation and Express handlers.

**Route handlers:**
```typescript
import express from 'express';
import { EntityName } from '../models/entityName';
import { getEntityNamesRepository } from '../repositories/entityNamesRepo';
import { NotFoundError } from '../utils/errors';

const router = express.Router();

// Create
router.post('/', async (req, res, next) => {
  try {
    const repo = await getEntityNamesRepository();
    const newEntity = await repo.create(req.body as Omit<EntityName, 'entityNameId'>);
    res.status(201).json(newEntity);
  } catch (error) {
    next(error);
  }
});

// Read all
router.get('/', async (req, res, next) => {
  try {
    const repo = await getEntityNamesRepository();
    const entities = await repo.findAll();
    res.json(entities);
  } catch (error) {
    next(error);
  }
});

// Read one
router.get('/:id', async (req, res, next) => {
  try {
    const repo = await getEntityNamesRepository();
    const entity = await repo.findById(parseInt(req.params.id));
    if (entity) {
      res.json(entity);
    } else {
      res.status(404).send('EntityName not found');
    }
  } catch (error) {
    next(error);
  }
});

// Update
router.put('/:id', async (req, res, next) => {
  try {
    const repo = await getEntityNamesRepository();
    const updated = await repo.update(parseInt(req.params.id), req.body);
    res.json(updated);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).send('EntityName not found');
    } else {
      next(error);
    }
  }
});

// Delete
router.delete('/:id', async (req, res, next) => {
  try {
    const repo = await getEntityNamesRepository();
    await repo.delete(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).send('EntityName not found');
    } else {
      next(error);
    }
  }
});

export default router;
```

### Step 4: Register the Route

In `src/index.ts`, add:
```typescript
import entityNameRoutes from './routes/entityName';
// ...
app.use('/api/entity-names', entityNameRoutes);
```

### Step 5: Create Database Migration

Create `database/migrations/{NNN}_{description}.sql` with the CREATE TABLE statement.

### Step 6: Create Seed Data

Create `database/seed/{NNN}_{entity_names}.sql` with 3-5 realistic examples.

### Step 7: Create Unit Tests

Create `src/repositories/{entity}sRepo.test.ts` covering all CRUD operations.

## Naming Conventions

| Context | Convention | Example |
|---------|------------|---------|
| TypeScript interface | PascalCase | `Supplier` |
| Interface property | camelCase | `supplierId` |
| Database table | snake_case, plural | `suppliers` |
| Database column | snake_case | `supplier_id` |
| Route path | kebab-case, plural | `/api/suppliers` |
| Repository class | PascalCase + Repository | `SuppliersRepository` |
| Route file | camelCase.ts | `supplier.ts` |

## Error Handling

Use custom error types from `utils/errors.ts`:
- `NotFoundError(entity, id)` - 404 responses
- `ValidationError(message)` - 400 responses
- `ConflictError(message)` - 409 responses
- `DatabaseError(message, code, statusCode)` - Generic DB errors

Always wrap repository calls in try/catch and use `handleDatabaseError()` for consistent error conversion.

## SQL Utilities

Available helpers from `utils/sql.ts`:
- `buildInsertSQL(table, data)` - Generate INSERT with placeholders
- `buildUpdateSQL(table, data, whereClause)` - Generate UPDATE with placeholders
- `objectToCamelCase<T>(row)` - Convert single DB row to typed model
- `mapDatabaseRows<T>(rows)` - Convert array of DB rows to typed models
- `toSnakeCase(str)` / `toCamelCase(str)` - String conversion

## File Locations

```
src/
├── models/{entity}.ts             # TypeScript interface + Swagger schema
├── repositories/{entity}sRepo.ts  # Data access layer
├── routes/{entity}.ts             # Express routes + Swagger docs
├── utils/
│   ├── errors.ts                  # Custom error types
│   └── sql.ts                     # SQL helper utilities
└── index.ts                       # Route registration
```

## Quick Reference: Complete Checklist

- [ ] **Model** (`src/models/{entity}.ts`) - TypeScript interface + Swagger schema
- [ ] **Repository** (`src/repositories/{entity}sRepo.ts`) - Data access with all CRUD methods
- [ ] **Route** (`src/routes/{entity}.ts`) - Express handlers + Swagger docs
- [ ] **Register** (`src/index.ts`) - Add route to Express app
- [ ] **Migration** (`database/migrations/{NNN}_{description}.sql`) - CREATE TABLE statement
- [ ] **Seed Data** (`database/seed/{NNN}_{entity_names}.sql`) - 3-5 realistic examples
- [ ] **Unit Tests** (`src/repositories/{entity}sRepo.test.ts`) - All CRUD operations, edge cases, errors
- [ ] **Route Tests** (`src/routes/{entity}.test.ts`) - Integration tests for HTTP endpoints

**Do not skip seed data or unit tests** — they are required for all new endpoints.
