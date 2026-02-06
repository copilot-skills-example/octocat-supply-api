# OctoCAT Supply – API

Express.js REST API with SQLite persistence for the **OctoCAT Supply Chain Management** application. Implements a repository pattern with Swagger/OpenAPI documentation.

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express.js with TypeScript
- **Database:** SQLite (better-sqlite3) — file-based storage, in-memory for tests
- **Docs:** Swagger UI via swagger-jsdoc + swagger-ui-express
- **Testing:** Vitest + supertest

## Directory Structure

```
src/
  index.ts             # Express app bootstrap
  init-db.ts           # DB initialization
  seedData.ts          # Dev seed data loader
  db/                  # Database config, migration runner, seed runner
  models/              # TypeScript interfaces (camelCase props ↔ snake_case columns)
  repositories/        # Data-access layer (one class per entity)
  routes/              # Express route modules (one per entity)
  utils/               # Custom error classes, SQL helpers
database/
  migrations/          # Sequential SQL migration files
  seed/                # Dev seed data (SQL inserts)
```

## Quick Start

```bash
npm install
npm run dev          # Start with hot-reload (nodemon)
npm run build        # Compile TypeScript → dist/
npm start            # Run compiled output
npm test             # Run Vitest test suite
```

API serves at `http://localhost:3001` by default. Swagger UI at `http://localhost:3001/api-docs`.

## Entity Model

Supplier → Product → Order → OrderDetail → Delivery → OrderDetailDelivery  
Supplier → Headquarters → Branch

See the [platform repo architecture docs](https://github.com/octocat-supply/octocat-supply-platform/blob/main/architecture/entity-model.md) for full field definitions.

## Part Of

| Repo | Purpose |
|------|---------|
| [octocat-supply-platform](https://github.com/copilot-skills-example/octocat-supply-platform) | Master orchestrator |
| [octocat-supply-web](https://github.com/copilot-skills-example/octocat-supply-web) | Frontend |
| **octocat-supply-api** (this) | REST API |

## License

MIT
