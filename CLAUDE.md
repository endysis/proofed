# Proofed - Recipe Experimentation Log

A modular recipe experimentation log for home bakers.

## Project Structure

```
proofed/
├── packages/
│   ├── frontend/          # React app (TypeScript)
│   ├── backend/           # Lambda handlers (TypeScript)
│   └── shared/            # Shared types/utils
├── infra/                 # CDK infrastructure
├── package.json           # Workspace root
└── tsconfig.base.json     # Shared TS config
```

## Quick Start

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run frontend locally
npm run dev:frontend

# Deploy to AWS
npm run deploy
```

## Architecture

- **Frontend**: React + TypeScript, hosted on S3
- **Backend**: Lambda + API Gateway (HTTP API)
- **Database**: DynamoDB (5 tables: Items, Recipes, Variants, Attempts, ProofedItems)
- **Photos**: S3 bucket with presigned URLs for direct upload

## Entity Hierarchy

```
Item (e.g., "Vanilla Sponge")
└── Recipe (e.g., "Creaming Method")
    └── Variant (e.g., "+15% Oil")

Attempt (baking session) → references Item + Recipe + Variant combinations
ProofedItem (captured successful attempt) → proven recipe combinations
```

## API Endpoints

- `/items` - CRUD for base items
- `/items/:itemId/recipes` - CRUD for recipes under an item
- `/items/:itemId/recipes/:recipeId/variants` - CRUD for variants
- `/attempts` - CRUD for baking attempts
- `/attempts/:attemptId/capture` - Capture attempt as proofed item
- `/proofed-items` - CRUD for proofed items
- `/photos/upload-url` - Get presigned URL for photo upload

## Single-User MVP

Currently single-user mode with hardcoded userId. Data model supports future multi-user expansion.
