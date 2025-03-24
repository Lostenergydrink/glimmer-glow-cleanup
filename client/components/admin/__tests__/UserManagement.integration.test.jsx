import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserManagement } from '../UserManagement';
import { userService } from '../../../services/user.service';

// Mock the user service
jest.mock('../../../services/user.service');

// Mock data
const mockUsers = [
  {
    id: 1,
    email: 'user1@example.com',
    displayName: 'User One',
    firstName: 'User',
    lastName: 'One',
    role: 'user',
    status: 'active'
  },
  {
    id: 2,
    email: 'user2@example.com',
    displayName: 'User Two',
    firstName: 'User',
    lastName: 'Two',
    role: 'admin',
    status: 'inactive'
  }
];

describe('UserManagement Integration', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementations
    userService.listUsers.mockResolvedValue({
      users: mockUsers,
      total: mockUsers.length,
      page: 1,
      limit: 10
    });
    userService.createUser.mockResolvedValue(mockUsers[0]);
    userService.updateUser.mockResolvedValue(mockUsers[0]);
    userService.deleteUser.mockResolvedValue({ success: true });
  });

  it('completes full user management workflow', async () => {
    render(<UserManagement />);

    // 1. Initial load
    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      expect(screen.getByText('user2@example.com')).toBeInTheDocument();
    });

    // 2. Create new user
    fireEvent.click(screen.getByText('Add User'));

    const newUserData = {
      email: 'newuser@example.com',
      password: 'password123',
      displayName: 'New User',
      firstName: 'New',
      lastName: 'User',
      role: 'user',
      status: 'active'
    };

    // Fill form
    fireEvent.change(screen.getByLabelText('Email *'), {
      target: { value: newUserData.email }
    });
    fireEvent.change(screen.getByLabelText('Password *'), {
      target: { value: newUserData.password }
    });
    fireEvent.change(screen.getByLabelText('Display Name *'), {
      target: { value: newUserData.displayName }
    });
    fireEvent.change(screen.getByLabelText('First Name'), {
      target: { value: newUserData.firstName }
    });
    fireEvent.change(screen.getByLabelText('Last Name'), {
      target: { value: newUserData.lastName }
    });
    fireEvent.change(screen.getByLabelText('Role *'), {
      target: { value: newUserData.role }
    });
    fireEvent.change(screen.getByLabelText('Status *'), {
      target: { value: newUserData.status }
    });

    // Submit form
    fireEvent.click(screen.getByText('Create'));

    // Verify service call and success notification
    await waitFor(() => {
      expect(userService.createUser).toHaveBeenCalledWith(newUserData);
      expect(screen.getByText('User created successfully')).toBeInTheDocument();
    });

    // 3. Search and filter
    fireEvent.change(screen.getByPlaceholderText('Search users...'), {
      target: { value: 'user1' }
    });

    await waitFor(() => {
      expect(userService.listUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'user1'
        })
      );
    });

    // Apply role filter
    const roleSelect = screen.getByLabelText('Role');
    fireEvent.mouseDown(roleSelect);
    const roleOptions = screen.getByRole('listbox');
    fireEvent.click(within(roleOptions).getByText('Admin'));

    await waitFor(() => {
      expect(userService.listUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'admin'
        })
      );
    });

    // 4. Edit user
    const editButtons = screen.getAllByTitle('Edit user');
    fireEvent.click(editButtons[0]);

    // Update user data
    const updatedData = {
      displayName: 'Updated User',
      role: 'admin'
    };

    fireEvent.change(screen.getByLabelText('Display Name *'), {
      target: { value: updatedData.displayName }
    });
    fireEvent.change(screen.getByLabelText('Role *'), {
      target: { value: updatedData.role }
    });

    // Submit update
    fireEvent.click(screen.getByText('Update'));

    // Verify update service call and success notification
    await waitFor(() => {
      expect(userService.updateUser).toHaveBeenCalledWith(
        mockUsers[0].id,
        expect.objectContaining(updatedData)
      );
      expect(screen.getByText('User updated successfully')).toBeInTheDocument();
    });

    // 5. Delete user
    const deleteButtons = screen.getAllByTitle('Delete user');
    fireEvent.click(deleteButtons[0]);

    // Confirm deletion
    fireEvent.click(screen.getByText('Delete'));

    // Verify delete service call and success notification
    await waitFor(() => {
      expect(userService.deleteUser).toHaveBeenCalledWith(mockUsers[0].id);
      expect(screen.getByText('User deleted successfully')).toBeInTheDocument();
    });

    // 6. Pagination
    fireEvent.click(screen.getByTitle('Go to next page'));

    await waitFor(() => {
      expect(userService.listUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2
        })
      );
    });

    // 7. Error handling
    userService.listUsers.mockRejectedValueOnce(new Error('Network error'));

    // Trigger a refresh
    fireEvent.click(screen.getByTitle('Go to previous page'));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('handles server errors gracefully', async () => {
    // Mock API errors
    userService.createUser.mockRejectedValueOnce(new Error('Failed to create user'));
    userService.updateUser.mockRejectedValueOnce(new Error('Failed to update user'));
    userService.deleteUser.mockRejectedValueOnce(new Error('Failed to delete user'));

    render(<UserManagement />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    });

    // Test create error
    fireEvent.click(screen.getByText('Add User'));
    fireEvent.change(screen.getByLabelText('Email *'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Password *'), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(screen.getByText('Failed to create user')).toBeInTheDocument();
    });

    // Test update error
    const editButtons = screen.getAllByTitle('Edit user');
    fireEvent.click(editButtons[0]);
    fireEvent.change(screen.getByLabelText('Display Name *'), {
      target: { value: 'Updated Name' }
    });
    fireEvent.click(screen.getByText('Update'));

    await waitFor(() => {
      expect(screen.getByText('Failed to update user')).toBeInTheDocument();
    });

    // Test delete error
    const deleteButtons = screen.getAllByTitle('Delete user');
    fireEvent.click(deleteButtons[0]);
    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(screen.getByText('Failed to delete user')).toBeInTheDocument();
    });
  });

  it('validates form submissions', async () => {
    render(<UserManagement />);

    // Open create user form
    fireEvent.click(screen.getByText('Add User'));

    // Try to submit empty form
    fireEvent.click(screen.getByText('Create'));

    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
      expect(screen.getByText('Display Name is required')).toBeInTheDocument();
      expect(screen.getByText('Role is required')).toBeInTheDocument();
      expect(screen.getByText('Status is required')).toBeInTheDocument();
    });

    // Enter invalid email
    fireEvent.change(screen.getByLabelText('Email *'), {
      target: { value: 'invalid-email' }
    });

    // Check for email validation error
    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });

    // Enter short password
    fireEvent.change(screen.getByLabelText('Password *'), {
      target: { value: '123' }
    });

    // Check for password validation error
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });
  });
});
