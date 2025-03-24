# User Management Components

## Overview

The user management system provides a complete interface for managing users in the admin panel. It includes features for listing, creating, updating, and deleting users, along with search, filtering, and pagination capabilities.

## Components

### UserManagement

The main component that provides the user management interface.

#### Features

- User listing with pagination
- Search functionality
- Role and status filtering
- Create, update, and delete operations
- Loading states and progress indicators
- Error handling and notifications
- Confirmation dialogs for destructive actions

#### Usage

```jsx
import { UserManagement } from '../components/admin/UserManagement';

function AdminPanel() {
  return (
    <div>
      <h1>Admin Panel</h1>
      <UserManagement />
    </div>
  );
}
```

### UserForm

A reusable form component for creating and editing users.

#### Features

- Form validation
- Error handling
- Password management (optional for updates)
- Role and status selection
- Loading state support

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| initialData | Object | No | User data for editing mode |
| onSubmit | Function | Yes | Callback for form submission |
| onCancel | Function | Yes | Callback for cancellation |
| disabled | Boolean | No | Disables form inputs |

#### Usage

```jsx
import { UserForm } from '../components/admin/UserForm';

function CreateUser() {
  const handleSubmit = (userData) => {
    // Handle user creation
  };

  const handleCancel = () => {
    // Handle cancellation
  };

  return (
    <UserForm
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}

function EditUser({ user }) {
  const handleSubmit = (userData) => {
    // Handle user update
  };

  const handleCancel = () => {
    // Handle cancellation
  };

  return (
    <UserForm
      initialData={user}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}
```

## Custom Hooks

### useNotification

A hook for managing notifications throughout the application.

#### Features

- Success and error notifications
- Configurable duration
- Consistent styling
- Auto-dismissing

#### Usage

```jsx
import { useNotification } from '../hooks/useNotification';

function MyComponent() {
  const { showNotification, NotificationComponent } = useNotification();

  const handleAction = async () => {
    try {
      await performAction();
      showNotification({
        message: 'Action completed successfully',
        severity: 'success'
      });
    } catch (error) {
      showNotification({
        message: error.message,
        severity: 'error'
      });
    }
  };

  return (
    <div>
      <button onClick={handleAction}>Perform Action</button>
      <NotificationComponent />
    </div>
  );
}
```

### useConfirmDialog

A hook for managing confirmation dialogs.

#### Features

- Promise-based API
- Customizable content
- Support for different severities
- Configurable button text

#### Usage

```jsx
import { useConfirmDialog } from '../hooks/useConfirmDialog';

function MyComponent() {
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();

  const handleDelete = async () => {
    const confirmed = await showConfirmDialog({
      title: 'Delete Item',
      message: 'Are you sure you want to delete this item?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      severity: 'error'
    });

    if (confirmed) {
      // Proceed with deletion
    }
  };

  return (
    <div>
      <button onClick={handleDelete}>Delete</button>
      <ConfirmDialog />
    </div>
  );
}
```

## API Integration

The user management system integrates with the following API endpoints:

### User Service

```javascript
// List users with pagination and filters
GET /api/admin/users
Query parameters:
- page: number
- limit: number
- search: string
- role: string
- status: string

// Create user
POST /api/admin/users
Body: {
  email: string
  password: string
  displayName: string
  firstName?: string
  lastName?: string
  role: string
  status: string
}

// Update user
PUT /api/admin/users/:id
Body: {
  displayName?: string
  firstName?: string
  lastName?: string
  role?: string
  status?: string
  password?: string
}

// Delete user
DELETE /api/admin/users/:id
```

## Testing

The components are thoroughly tested with both unit and integration tests:

### Unit Tests

- `UserManagement.test.jsx`: Tests individual component functionality
- `UserForm.test.jsx`: Tests form behavior and validation

### Integration Tests

- `UserManagement.integration.test.jsx`: Tests complete user management workflows

Run tests using:

```bash
npm test
```

## Error Handling

The system handles various error scenarios:

- Network errors
- Validation errors
- Server errors
- Authentication errors
- Authorization errors

Errors are displayed using the notification system and inline form validation messages.

## Loading States

Loading states are managed for all asynchronous operations:

- Table loading indicator
- Form submission loading
- Delete operation loading
- Disabled states for interactive elements

## Best Practices

1. Always use the provided hooks for notifications and confirmations
2. Handle loading states appropriately
3. Validate user input before submission
4. Use proper error handling
5. Test all user interactions
6. Follow the established patterns for new features

## Contributing

When contributing to the user management system:

1. Follow the existing code style
2. Add appropriate tests
3. Update documentation
4. Handle error cases
5. Consider loading states
6. Use TypeScript for new components
7. Add proper JSDoc comments
