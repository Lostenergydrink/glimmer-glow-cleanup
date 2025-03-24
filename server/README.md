# Glimmer Glow Backend - Hybrid Architecture

This document explains the hybrid architecture implementation for the Glimmer Glow backend, which combines the flexibility of a Node.js API server with the robustness of Supabase, providing a fallback mechanism for database operations.

## Architecture Overview

The backend follows a hybrid architecture pattern that consists of:

1. **Node.js API Server**: A standard Express.js server that handles API requests, authentication, and business logic.
2. **Database Provider System**: An abstraction layer that provides a unified interface for database operations.
3. **Fallback Mechanism**: A system that automatically switches to an alternative database connection if the primary one fails.

## Key Components

### Database Provider System

The database provider system uses the following pattern:

- **Base Provider Interface**: Defines the contract for all database operations.
- **Implementation Providers**: Concrete implementations for different database types.
- **Provider Factory**: Creates and configures provider instances.
- **Fallback Wrapper**: Adds resilience through automatic failover.

### Directory Structure

```
server/
├── controllers/     # API controllers
├── db/
│   ├── providers/   # Database provider implementations
│   │   ├── base-provider.js     # Base class/interface
│   │   ├── supabase-provider.js # Supabase implementation
│   │   └── postgres-provider.js # Direct PostgreSQL implementation
│   ├── connection.js      # Database connection management
│   └── provider-factory.js # Factory for creating providers
├── middleware/      # Express middleware
├── routes/          # API route definitions
├── index.js         # Main server entry point
└── README.md        # This file
```

## How It Works

### Provider Interface

The `DatabaseProvider` class in `db/providers/base-provider.js` defines the interface that all database providers must implement. This ensures that providers can be swapped without affecting the rest of the application.

```javascript
class DatabaseProvider {
  async getProducts() { throw new Error('Not implemented'); }
  async getProduct(id) { throw new Error('Not implemented'); }
  // ... other methods
}
```

### Provider Implementations

We have two main provider implementations:

1. **SupabaseDatabaseProvider**: Uses the Supabase client to interact with a Supabase backend.
2. **PostgresqlDatabaseProvider**: Uses direct PostgreSQL connections.

### Provider Factory

The `DatabaseProviderFactory` in `db/provider-factory.js` creates provider instances and wraps them with fallback functionality:

```javascript
class DatabaseProviderFactory {
  static createProvider(type, config) {
    // Create a provider based on type
  }

  static createHybridProvider(primaryConfig, fallbackConfig) {
    // Create a provider with fallback capability
  }
}
```

### Fallback Mechanism

The fallback mechanism uses JavaScript's Proxy to intercept method calls. If the primary provider fails, it automatically tries the fallback provider:

```javascript
return new Proxy(primary, {
  get(target, prop) {
    // ... intercept method calls
    return async function(...args) {
      try {
        // Try primary provider
        return await originalProp.apply(target, args);
      } catch (error) {
        // If primary fails, try fallback provider
        return await fallback[prop].apply(fallback, args);
      }
    };
  }
});
```

## Configuration

The system is configured through environment variables:

```
# Supabase configuration (primary database)
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# PostgreSQL configuration (fallback database)
DATABASE_URL=postgresql://user:password@localhost:5432/database
```

## Usage in Controllers

Controllers simply import the database provider and use it without knowing the implementation details:

```javascript
const { getProvider } = require('../db/connection');

async function getAllProducts(req, res) {
  try {
    const db = getProvider();
    const products = await db.getProducts();
    // ... handle response
  } catch (error) {
    // ... handle error
  }
}
```

## Benefits

This hybrid architecture provides several benefits:

1. **Resilience**: If Supabase is unavailable, the system can automatically fall back to direct PostgreSQL connections.
2. **Flexibility**: New database providers can be added without changing existing code.
3. **Separation of Concerns**: Business logic is decoupled from data access details.
4. **Testability**: Easy to mock providers for testing.

## Getting Started

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and configure your database credentials
3. Start the server: `npm run start`
