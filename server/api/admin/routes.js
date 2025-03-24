/**
 * Admin API Routes
 * Main router for admin functionality
 */

import express from 'express';
import { authenticateJWT, requirePermission } from '../../auth/middleware/auth.middleware.js';
import * as validation from '../../middleware/validation.middleware.js';
import * as auditLog from '../../services/audit-log.service.js';

const router = express.Router();

// Apply authentication to all admin routes
router.use(authenticateJWT);

// Helper middleware to log admin actions
const logAdminAction = (action) => {
  return async (req, res, next) => {
    try {
      await auditLog.recordAdminAction(req.user.id, action, {
        ip: req.ip,
        method: req.method,
        path: req.path,
        body: req.body
      });
      next();
    } catch (error) {
      console.error('Failed to log admin action:', error);
      next(); // Continue even if logging fails
    }
  };
};

// Admin dashboard data
router.get('/dashboard', 
  requirePermission('admin:read'),
  async (req, res) => {
    try {
      // Get counts of key entities for dashboard
      const dashboardData = {
        stats: {
          products: 0, // TODO: Get actual product count
          orders: 0,   // TODO: Get actual order count
          users: 0,    // TODO: Get actual user count
          revenue: 0   // TODO: Get actual revenue
        },
        recentOrders: [], // TODO: Get recent orders
        lowStockProducts: [] // TODO: Get low stock products
      };
      
      res.json(dashboardData);
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      res.status(500).json({ error: 'Failed to retrieve dashboard data' });
    }
});

// Get admin activity logs
router.get('/activity-logs',
  requirePermission('admin:read'),
  async (req, res) => {
    try {
      const logs = await auditLog.getAdminActivityLogs();
      res.json(logs);
    } catch (error) {
      console.error('Error getting activity logs:', error);
      res.status(500).json({ error: 'Failed to retrieve activity logs' });
    }
});

// PayPal Settings endpoints
router.get('/paypal-settings',
  requirePermission('admin:read'),
  async (req, res) => {
    try {
      // TODO: Get PayPal settings from database
      const paypalSettings = {
        clientId: process.env.PAYPAL_CLIENT_ID || '',
        sandbox: process.env.PAYPAL_SANDBOX === 'true'
      };
      
      res.json(paypalSettings);
    } catch (error) {
      console.error('Error getting PayPal settings:', error);
      res.status(500).json({ error: 'Failed to retrieve PayPal settings' });
    }
});

// Update PayPal Settings
router.post('/paypal-settings',
  requirePermission('admin:write'),
  logAdminAction('update_paypal_settings'),
  validation.validateBody({
    clientId: validation.string().required(),
    clientSecret: validation.string().required(),
    sandbox: validation.boolean().optional()
  }),
  async (req, res) => {
    try {
      const { clientId, clientSecret, sandbox } = req.body;
      
      // TODO: Save PayPal settings to database
      // For now, we'll simulate a successful update
      
      res.json({ 
        success: true, 
        message: 'PayPal settings updated successfully'
      });
    } catch (error) {
      console.error('Error updating PayPal settings:', error);
      res.status(500).json({ error: 'Failed to update PayPal settings' });
    }
});

// Get all subscriptions
router.get('/subscriptions',
  requirePermission('admin:read'),
  async (req, res) => {
    try {
      // TODO: Get subscriptions from database
      const subscriptions = [];
      
      res.json(subscriptions);
    } catch (error) {
      console.error('Error getting subscriptions:', error);
      res.status(500).json({ error: 'Failed to retrieve subscriptions' });
    }
});

// Export subscriptions (CSV)
router.get('/subscriptions/export',
  requirePermission('admin:read'),
  logAdminAction('export_subscriptions'),
  async (req, res) => {
    try {
      // TODO: Get subscriptions from database
      const subscriptions = [];
      
      // Create CSV content
      const headers = ['Email', 'Name', 'Date Subscribed', 'Status'];
      const csvContent = [
        headers.join(','),
        ...subscriptions.map(sub => 
          [sub.email, sub.name, sub.date, sub.status].join(',')
        )
      ].join('\n');
      
      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=subscriptions.csv');
      
      res.send(csvContent);
    } catch (error) {
      console.error('Error exporting subscriptions:', error);
      res.status(500).json({ error: 'Failed to export subscriptions' });
    }
});

// Get transactions with filtering
router.get('/transactions',
  requirePermission('admin:read'),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      // TODO: Get transactions from database with filters
      const transactions = [];
      
      res.json(transactions);
    } catch (error) {
      console.error('Error getting transactions:', error);
      res.status(500).json({ error: 'Failed to retrieve transactions' });
    }
});

// Gallery items endpoints
router.get('/gallery',
  requirePermission('admin:read'),
  async (req, res) => {
    try {
      // TODO: Get gallery items from database
      const galleryItems = [];
      
      res.json(galleryItems);
    } catch (error) {
      console.error('Error getting gallery items:', error);
      res.status(500).json({ error: 'Failed to retrieve gallery items' });
    }
});

router.post('/gallery',
  requirePermission('admin:write'),
  logAdminAction('create_gallery_item'),
  validation.validateBody({
    title: validation.string().required(),
    description: validation.string().optional(),
    image: validation.any().optional() // This would be handled by multer
  }),
  async (req, res) => {
    try {
      // TODO: Create gallery item in database
      const newItem = {
        id: Date.now().toString(),
        ...req.body,
        imageUrl: req.file?.path || null
      };
      
      res.status(201).json(newItem);
    } catch (error) {
      console.error('Error creating gallery item:', error);
      res.status(500).json({ error: 'Failed to create gallery item' });
    }
});

router.put('/gallery/:id',
  requirePermission('admin:write'),
  logAdminAction('update_gallery_item'),
  validation.validateParams({
    id: validation.string().required()
  }),
  validation.validateBody({
    title: validation.string().optional(),
    description: validation.string().optional()
  }),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      // TODO: Update gallery item in database
      const updatedItem = {
        id,
        ...req.body
      };
      
      res.json(updatedItem);
    } catch (error) {
      console.error('Error updating gallery item:', error);
      res.status(500).json({ error: 'Failed to update gallery item' });
    }
});

router.delete('/gallery/:id',
  requirePermission('admin:write'),
  logAdminAction('delete_gallery_item'),
  validation.validateParams({
    id: validation.string().required()
  }),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      // TODO: Delete gallery item from database
      
      res.json({ success: true, message: 'Gallery item deleted successfully' });
    } catch (error) {
      console.error('Error deleting gallery item:', error);
      res.status(500).json({ error: 'Failed to delete gallery item' });
    }
});

// Calendar events endpoints
router.get('/events',
  requirePermission('admin:read'),
  async (req, res) => {
    try {
      // TODO: Get events from database
      const events = [];
      
      res.json(events);
    } catch (error) {
      console.error('Error getting events:', error);
      res.status(500).json({ error: 'Failed to retrieve events' });
    }
});

router.post('/events',
  requirePermission('admin:write'),
  logAdminAction('create_event'),
  validation.validateBody({
    title: validation.string().required(),
    date: validation.string().required(),
    price: validation.number().min(0).required(),
    recurring: validation.string().optional()
  }),
  async (req, res) => {
    try {
      // TODO: Create event in database
      const newEvent = {
        id: Date.now().toString(),
        ...req.body
      };
      
      res.status(201).json(newEvent);
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ error: 'Failed to create event' });
    }
});

router.put('/events/:id',
  requirePermission('admin:write'),
  logAdminAction('update_event'),
  validation.validateParams({
    id: validation.string().required()
  }),
  validation.validateBody({
    title: validation.string().optional(),
    date: validation.string().optional(),
    price: validation.number().min(0).optional(),
    recurring: validation.string().optional()
  }),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      // TODO: Update event in database
      const updatedEvent = {
        id,
        ...req.body
      };
      
      res.json(updatedEvent);
    } catch (error) {
      console.error('Error updating event:', error);
      res.status(500).json({ error: 'Failed to update event' });
    }
});

router.delete('/events/:id',
  requirePermission('admin:write'),
  logAdminAction('delete_event'),
  validation.validateParams({
    id: validation.string().required()
  }),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      // TODO: Delete event from database
      
      res.json({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
      console.error('Error deleting event:', error);
      res.status(500).json({ error: 'Failed to delete event' });
    }
});

export default router; 