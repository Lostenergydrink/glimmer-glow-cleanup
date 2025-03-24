# Supabase Integration Guide

## Overview

This document provides information about the Supabase integration in the GlimmerGlow website. Supabase is used for database storage, authentication, and file storage.

## Architecture

The Supabase integration is structured to provide a centralized, consistent interface for database access and authentication. The architecture follows these principles:

1. **Service-Based Architecture**: All Supabase interactions go through dedicated service classes.
2. **Graceful Fallback**: When Supabase is unavailable, the system falls back to local file-based storage.
3. **Consistent Error Handling**: All database operations include standardized error handling.
4. **Middleware Authentication**: Secure API endpoints with JWT-based authentication middleware.
5. **Backward Compatibility**: Maintains support for older authentication methods during transition.

## Directory Structure

The Supabase integration is organized as follows:

```
repo_cleanup/
├── config.js                          # Supabase configuration
├── server/
│   ├── services/
│   │   ├── index.js                   # Service factory and initialization
│   │   ├── database.service.js        # Database service
│   │   └── auth.service.js            # Authentication service
│   ├── middleware/
│   │   └── auth.middleware.js         # Authentication middleware
│   ├── api/
│   │   └── auth/
│   │       └── routes.js              # Authentication API routes
│   └── tests/
│       └── test-supabase-connection.js # Integration tests
└── test-supabase-integration.sh       # Test runner script
```

## Setup and Configuration

### Prerequisites

- Supabase account and project
- Supabase API URL and anon key
- Project tables must match the expected schema

### Configuration

1. Update `config.js` with your Supabase URL and anon key:

```javascript
export const SUPABASE_URL = 'https://your-project-id.supabase.co';
export const SUPABASE_ANON_KEY = 'your-anon-key';
```

2. Install required dependencies:

```bash
npm install @supabase/supabase-js jsonwebtoken
```

3. Test the integration:

```bash
./repo_cleanup/test-supabase-integration.sh
```

## Database Schema

The Supabase database should have the following tables:

### Products Table

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Product name |
| description | text | Product description |
| price | numeric | Product price |
| quantity | integer | Available quantity |
| type | text | Product type |
| imageUrl | text | URL to product image |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

### Transactions Table

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| customer | jsonb | Customer information |
| items | jsonb | Purchased items |
| amount | numeric | Transaction amount |
| paymentDetails | jsonb | Payment method details |
| created_at | timestamp | Transaction timestamp |

### Subscriptions Table

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| customer | jsonb | Customer information |
| plan | text | Subscription plan |
| amount | numeric | Subscription amount |
| status | text | Subscription status |
| paymentDetails | jsonb | Payment method details |
| created_at | timestamp | Start timestamp |
| cancelled_at | timestamp | Cancellation timestamp |

## Authentication

The authentication system uses Supabase Auth with JWT tokens. Key features include:

- User registration and login via email/password
- JWT tokens for authentication
- Role-based access control
- Password reset functionality
- Backward compatibility with admin key auth

## API Endpoints

The following authentication API endpoints are available:

- `POST /api/auth/signup`: Register a new user
- `POST /api/auth/login`: Login and get JWT token
- `POST /api/auth/logout`: Logout the current user
- `GET /api/auth/me`: Get current user profile
- `POST /api/auth/reset-password`: Request password reset
- `POST /api/auth/update-password`: Update user password
- `POST /api/auth/admin/login`: Admin login (legacy)

## Testing

The Supabase integration includes comprehensive testing:

1. Database connection test
2. CRUD operations tests
3. Authentication flow tests

Run the tests using:

```bash
./repo_cleanup/test-supabase-integration.sh
```

## Troubleshooting

### Common Issues

1. **Connection Failures**
   - Check your Supabase URL and key
   - Verify network connectivity
   - Check that your IP is allowed in Supabase

2. **Authentication Errors**
   - Ensure JWT_SECRET is properly set
   - Verify that user roles are correctly configured
   - Check if the user exists in Supabase Auth

3. **Database Operation Errors**
   - Verify table schema matches expectations
   - Check column types and constraints
   - Ensure proper permissions are set in Supabase 