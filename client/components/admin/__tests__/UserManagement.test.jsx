import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

describe('UserManagement', () => {
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

  it('renders user management interface', async () => {
    render(<UserManagement />);

    // Check for main elements
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('Add User')).toBeInTheDocument();

    // Wait for users to be loaded
    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      expect(screen.getByText('user2@example.com')).toBeInTheDocument();
    });
  });

  it('opens add user dialog when clicking Add User button', () => {
    render(<UserManagement />);

    fireEvent.click(screen.getByText('Add User'));

    expect(screen.getByText('Add New User')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('handles user creation successfully', async () => {
    render(<UserManagement />);

    // Open add user dialog
    fireEvent.click(screen.getByText('Add User'));

    // Fill form
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'newuser@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' }
    });
    fireEvent.change(screen.getByLabelText('Display Name'), {
      target: { value: 'New User' }
    });

    // Submit form
    fireEvent.click(screen.getByText('Create'));

    // Verify service was called
    await waitFor(() => {
      expect(userService.createUser).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
        displayName: 'New User'
      });
    });
  });

  it('handles user deletion with confirmation', async () => {
    render(<UserManagement />);

    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    });

    // Click delete button for first user
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    // Confirm deletion
    fireEvent.click(screen.getByText('Confirm'));

    // Verify service was called
    await waitFor(() => {
      expect(userService.deleteUser).toHaveBeenCalledWith(1);
    });
  });

  it('handles search and filtering', async () => {
    render(<UserManagement />);

    // Enter search term
    fireEvent.change(screen.getByPlaceholderText('Search users...'), {
      target: { value: 'user1' }
    });

    // Wait for search to be applied
    await waitFor(() => {
      expect(userService.listUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'user1'
        })
      );
    });
  });

  it('handles pagination', async () => {
    render(<UserManagement />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    });

    // Click next page
    fireEvent.click(screen.getByTitle('Go to next page'));

    // Verify service was called with correct page
    await waitFor(() => {
      expect(userService.listUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2
        })
      );
    });
  });

  it('displays error message when API call fails', async () => {
    // Mock API error
    userService.listUsers.mockRejectedValue(new Error('Failed to fetch users'));

    render(<UserManagement />);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch users')).toBeInTheDocument();
    });
  });
});
