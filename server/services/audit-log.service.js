/**
 * Audit Log Service
 * Records admin actions for accountability and security review
 */

import { createClient } from '@supabase/supabase-js';

// We'll use environment variables for Supabase connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Initialize Supabase client (only when needed)
let supabase = null;

const getSupabaseClient = () => {
  if (!supabase) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials are not configured');
    }
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
};

/**
 * Record an admin action in the audit log
 * @param {string} userId - ID of the admin user performing the action
 * @param {string} action - Type of action being performed
 * @param {Object} details - Additional details about the action
 * @returns {Promise<Object>} The created audit log entry
 */
export const recordAdminAction = async (userId, action, details = {}) => {
  try {
    const client = getSupabaseClient();
    
    const logEntry = {
      user_id: userId,
      action,
      details,
      ip_address: details.ip || null,
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await client
      .from('admin_audit_logs')
      .insert(logEntry)
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error recording admin action:', error);
    // We don't want to throw here as this is a non-critical operation
    // Failing to log shouldn't break the actual action
    return null;
  }
};

/**
 * Get admin activity logs with optional filtering
 * @param {Object} filters - Optional filters for the logs
 * @param {string} filters.userId - Filter by specific user ID
 * @param {string} filters.action - Filter by specific action type
 * @param {string} filters.startDate - Filter by start date (ISO format)
 * @param {string} filters.endDate - Filter by end date (ISO format)
 * @param {number} limit - Maximum number of logs to return (default: 100)
 * @param {number} offset - Offset for pagination (default: 0)
 * @returns {Promise<Array>} List of audit log entries
 */
export const getAdminActivityLogs = async (filters = {}, limit = 100, offset = 0) => {
  try {
    const client = getSupabaseClient();
    
    let query = client
      .from('admin_audit_logs')
      .select(`
        id,
        user_id,
        action,
        details,
        ip_address,
        created_at,
        users:user_id (id, email, display_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);
    
    // Apply filters
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    
    if (filters.action) {
      query = query.eq('action', filters.action);
    }
    
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error getting admin activity logs:', error);
    throw error;
  }
};

/**
 * Delete old audit logs based on retention policy
 * @param {number} daysToRetain - Number of days to retain logs (default: 90)
 * @returns {Promise<number>} Number of deleted log entries
 */
export const cleanupOldLogs = async (daysToRetain = 90) => {
  try {
    const client = getSupabaseClient();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToRetain);
    
    const { data, error } = await client
      .from('admin_audit_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select('count');
    
    if (error) throw error;
    
    return data?.[0]?.count || 0;
  } catch (error) {
    console.error('Error cleaning up old audit logs:', error);
    throw error;
  }
};

/**
 * Export audit logs to CSV format
 * @param {Object} filters - Optional filters (same as getAdminActivityLogs)
 * @returns {Promise<string>} CSV content as string
 */
export const exportLogsToCSV = async (filters = {}) => {
  try {
    const logs = await getAdminActivityLogs(filters, 1000, 0);
    
    if (!logs || logs.length === 0) {
      return 'No logs found matching the criteria';
    }
    
    // Create CSV header
    const headers = ['ID', 'User', 'Action', 'IP Address', 'Date/Time', 'Details'];
    
    // Create CSV rows
    const rows = logs.map(log => [
      log.id,
      log.users?.email || log.user_id,
      log.action,
      log.ip_address || 'N/A',
      log.created_at,
      JSON.stringify(log.details)
    ]);
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    return csvContent;
  } catch (error) {
    console.error('Error exporting logs to CSV:', error);
    throw error;
  }
};

export default {
  recordAdminAction,
  getAdminActivityLogs,
  cleanupOldLogs,
  exportLogsToCSV
}; 