import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  IconButton,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  LinearProgress,
  Backdrop
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { useSnackbar } from '../../hooks/useSnackbar';
import { userService } from '../../services/user.service';
import { useNotification } from '../../hooks/useNotification';

const UserManagement = () => {
  // State
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);

  // Custom hooks
  const { showConfirmDialog } = useConfirmDialog();
  const { showSnackbar } = useSnackbar();
  const { showNotification, NotificationComponent } = useNotification();

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await userService.listUsers({
        page: page + 1,
        limit: rowsPerPage,
        search: search,
        role: roleFilter,
        status: statusFilter
      });
      setUsers(response.users);
      setTotalUsers(response.total);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
      showNotification({
        message: err.message || 'Failed to fetch users',
        severity: 'error'
      });
      setUsers([]);
      setTotalUsers(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, rowsPerPage, search, roleFilter, statusFilter, showNotification]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(0);
  };

  const handleRoleFilterChange = (event) => {
    setRoleFilter(event.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleAddUser = () => {
    setIsAddDialogOpen(true);
  };

  const handleEditUser = (user) => {
    setEditUser(user);
  };

  const handleDeleteUser = async (user) => {
    const confirmed = await showConfirmDialog({
      title: 'Delete User',
      message: `Are you sure you want to delete ${user.email}?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      severity: 'error'
    });

    if (confirmed) {
      setIsDeleting(true);
      try {
        await userService.deleteUser(user.id);
        showNotification({
          message: 'User deleted successfully',
          severity: 'success'
        });
        fetchUsers();
      } catch (err) {
        showNotification({
          message: err.message || 'Failed to delete user',
          severity: 'error'
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleSaveUser = async (userData) => {
    setIsSaving(true);
    try {
      if (editUser) {
        await userService.updateUser(editUser.id, userData);
        showNotification({
          message: 'User updated successfully',
          severity: 'success'
        });
      } else {
        await userService.createUser(userData);
        showNotification({
          message: 'User created successfully',
          severity: 'success'
        });
      }
      setEditUser(null);
      setIsAddDialogOpen(false);
      fetchUsers();
    } catch (err) {
      showNotification({
        message: err.message || 'Failed to save user',
        severity: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Render functions
  const renderUserDialog = () => {
    const isEdit = Boolean(editUser);
    return (
      <Dialog
        open={isAddDialogOpen || isEdit}
        onClose={() => {
          setIsAddDialogOpen(false);
          setEditUser(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {isEdit ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <UserForm
            initialData={editUser}
            onSubmit={handleSaveUser}
            onCancel={() => {
              setIsAddDialogOpen(false);
              setEditUser(null);
            }}
            disabled={isSaving}
          />
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2, position: 'relative' }}>
        {/* Loading indicator for initial load and filtering */}
        {isLoading && (
          <LinearProgress
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1
            }}
          />
        )}

        {/* Toolbar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2 }}>
          <Typography variant="h5" component="h1">
            User Management
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddUser}
            disabled={isLoading}
          >
            Add User
          </Button>
        </Box>

        {/* Filters */}
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Search"
              variant="outlined"
              size="small"
              value={search}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              disabled={isLoading}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={roleFilter}
                onChange={handleRoleFilterChange}
                label="Role"
                disabled={isLoading}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="editor">Editor</MenuItem>
                <MenuItem value="user">User</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                label="Status"
                disabled={isLoading}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Error message */}
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {/* User table */}
        <TableContainer>
          <Table
            sx={{ minWidth: 750 }}
            aria-labelledby="tableTitle"
            size="medium"
          >
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      {user.displayName || `${user.firstName} ${user.lastName}`.trim() || '-'}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        color={user.role === 'admin' ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.status}
                        color={
                          user.status === 'active'
                            ? 'success'
                            : user.status === 'suspended'
                              ? 'error'
                              : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleEditUser(user)}
                        title="Edit user"
                        disabled={isLoading || isSaving || isDeleting}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteUser(user)}
                        title="Delete user"
                        disabled={isLoading || isSaving || isDeleting}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={totalUsers}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          disabled={isLoading}
        />
      </Paper>

      {/* User dialog */}
      {renderUserDialog()}

      {/* Global loading overlay */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isSaving || isDeleting}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Notification component */}
      <NotificationComponent />
    </Box>
  );
};

export default UserManagement;
