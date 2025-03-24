import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserForm } from '../UserForm';

describe('UserForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel
  };

  const mockUser = {
    email: 'test@example.com',
    displayName: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    status: 'active'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty form for new user', () => {
    render(<UserForm {...defaultProps} />);

    // Check for form fields
    expect(screen.getByLabelText('Email *')).toBeInTheDocument();
    expect(screen.getByLabelText('Password *')).toBeInTheDocument();
    expect(screen.getByLabelText('Display Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Role *')).toBeInTheDocument();
    expect(screen.getByLabelText('Status *')).toBeInTheDocument();

    // Check button labels for new user
    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders form with initial data for editing', () => {
    render(<UserForm {...defaultProps} initialData={mockUser} />);

    // Check if fields are populated with initial data
    expect(screen.getByLabelText('Email *')).toHaveValue(mockUser.email);
    expect(screen.getByLabelText('Display Name *')).toHaveValue(mockUser.displayName);
    expect(screen.getByLabelText('First Name')).toHaveValue(mockUser.firstName);
    expect(screen.getByLabelText('Last Name')).toHaveValue(mockUser.lastName);
    expect(screen.getByLabelText('Role *')).toHaveValue(mockUser.role);
    expect(screen.getByLabelText('Status *')).toHaveValue(mockUser.status);

    // Password field should be empty when editing
    expect(screen.getByLabelText('Password *')).toHaveValue('');

    // Check button labels for editing
    expect(screen.getByText('Update')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<UserForm {...defaultProps} />);

    // Try to submit empty form
    fireEvent.click(screen.getByText('Create'));

    // Check for error messages
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
      expect(screen.getByText('Display Name is required')).toBeInTheDocument();
      expect(screen.getByText('Role is required')).toBeInTheDocument();
      expect(screen.getByText('Status is required')).toBeInTheDocument();
    });

    // Verify onSubmit was not called
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    render(<UserForm {...defaultProps} />);

    // Enter invalid email
    fireEvent.change(screen.getByLabelText('Email *'), {
      target: { value: 'invalid-email' }
    });

    // Try to submit
    fireEvent.click(screen.getByText('Create'));

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });
  });

  it('validates password length', async () => {
    render(<UserForm {...defaultProps} />);

    // Enter short password
    fireEvent.change(screen.getByLabelText('Password *'), {
      target: { value: '123' }
    });

    // Try to submit
    fireEvent.click(screen.getByText('Create'));

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    render(<UserForm {...defaultProps} />);

    // Fill form with valid data
    fireEvent.change(screen.getByLabelText('Email *'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Password *'), {
      target: { value: 'password123' }
    });
    fireEvent.change(screen.getByLabelText('Display Name *'), {
      target: { value: 'Test User' }
    });
    fireEvent.change(screen.getByLabelText('First Name'), {
      target: { value: 'Test' }
    });
    fireEvent.change(screen.getByLabelText('Last Name'), {
      target: { value: 'User' }
    });
    fireEvent.change(screen.getByLabelText('Role *'), {
      target: { value: 'user' }
    });
    fireEvent.change(screen.getByLabelText('Status *'), {
      target: { value: 'active' }
    });

    // Submit form
    fireEvent.click(screen.getByText('Create'));

    // Verify onSubmit was called with form data
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        status: 'active'
      });
    });
  });

  it('handles form cancellation', () => {
    render(<UserForm {...defaultProps} />);

    // Click cancel button
    fireEvent.click(screen.getByText('Cancel'));

    // Verify onCancel was called
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('clears errors when field is updated', async () => {
    render(<UserForm {...defaultProps} />);

    // Submit empty form to trigger errors
    fireEvent.click(screen.getByText('Create'));

    // Wait for error messages
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    // Update field
    fireEvent.change(screen.getByLabelText('Email *'), {
      target: { value: 'test@example.com' }
    });

    // Verify error message is cleared
    await waitFor(() => {
      expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
    });
  });
});
