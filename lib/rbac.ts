// RBAC Permission System
export enum Permission {
  // User Management
  MANAGE_USERS = 'manage_users',
  VIEW_USERS = 'view_users',

  // POS
  USE_POS = 'use_pos',
  APPROVE_DISCOUNT = 'approve_discount',

  // Products & Inventory
  MANAGE_PRODUCTS = 'manage_products',
  VIEW_PRODUCTS = 'view_products',
  MANAGE_INVENTORY = 'manage_inventory',
  VIEW_INVENTORY = 'view_inventory',
  MANAGE_STOCK_TRANSFER = 'manage_stock_transfer',

  // Customers
  MANAGE_CUSTOMERS = 'manage_customers',
  VIEW_CUSTOMERS = 'view_customers',
  MANAGE_LOYALTY = 'manage_loyalty',

  // Financial
  VIEW_FINANCIAL = 'view_financial',
  VIEW_PROFIT = 'view_profit',
  MANAGE_CASH_SESSION = 'manage_cash_session',
  VIEW_OWN_CASH_SESSION = 'view_own_cash_session',

  // Reports & Analytics
  VIEW_REPORTS = 'view_reports',
  VIEW_ANALYTICS = 'view_analytics',

  // Settings
  MANAGE_SETTINGS = 'manage_settings',
  MANAGE_TAX = 'manage_tax',
  MANAGE_PROMOTIONS = 'manage_promotions',

  // System
  BACKUP_RESTORE = 'backup_restore',
  VIEW_AUDIT_LOG = 'view_audit_log',

  // Purchase Orders
  MANAGE_PURCHASE_ORDERS = 'manage_purchase_orders',
  VIEW_PURCHASE_ORDERS = 'view_purchase_orders',

  // Suppliers
  MANAGE_SUPPLIERS = 'manage_suppliers',
  VIEW_SUPPLIERS = 'view_suppliers',

  // Attendance
  MANAGE_ATTENDANCE = 'manage_attendance',
  VIEW_OWN_ATTENDANCE = 'view_own_attendance',
}

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'CASHIER' | 'WAREHOUSE' | 'SALES'

// Role Permissions Mapping
export const rolePermissions: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    // Full access to everything
    Permission.MANAGE_USERS,
    Permission.VIEW_USERS,
    Permission.USE_POS,
    Permission.APPROVE_DISCOUNT,
    Permission.MANAGE_PRODUCTS,
    Permission.VIEW_PRODUCTS,
    Permission.MANAGE_INVENTORY,
    Permission.VIEW_INVENTORY,
    Permission.MANAGE_STOCK_TRANSFER,
    Permission.MANAGE_CUSTOMERS,
    Permission.VIEW_CUSTOMERS,
    Permission.MANAGE_LOYALTY,
    Permission.VIEW_FINANCIAL,
    Permission.VIEW_PROFIT,
    Permission.MANAGE_CASH_SESSION,
    Permission.VIEW_OWN_CASH_SESSION,
    Permission.VIEW_REPORTS,
    Permission.VIEW_ANALYTICS,
    Permission.MANAGE_SETTINGS,
    Permission.MANAGE_TAX,
    Permission.MANAGE_PROMOTIONS,
    Permission.BACKUP_RESTORE,
    Permission.VIEW_AUDIT_LOG,
    Permission.MANAGE_PURCHASE_ORDERS,
    Permission.VIEW_PURCHASE_ORDERS,
    Permission.MANAGE_SUPPLIERS,
    Permission.VIEW_SUPPLIERS,
    Permission.MANAGE_ATTENDANCE,
    Permission.VIEW_OWN_ATTENDANCE,
  ],

  ADMIN: [
    // Same as SUPER_ADMIN but cannot manage other admins
    Permission.MANAGE_USERS,
    Permission.VIEW_USERS,
    Permission.USE_POS,
    Permission.APPROVE_DISCOUNT,
    Permission.MANAGE_PRODUCTS,
    Permission.VIEW_PRODUCTS,
    Permission.MANAGE_INVENTORY,
    Permission.VIEW_INVENTORY,
    Permission.MANAGE_STOCK_TRANSFER,
    Permission.MANAGE_CUSTOMERS,
    Permission.VIEW_CUSTOMERS,
    Permission.MANAGE_LOYALTY,
    Permission.VIEW_FINANCIAL,
    Permission.VIEW_PROFIT,
    Permission.MANAGE_CASH_SESSION,
    Permission.VIEW_OWN_CASH_SESSION,
    Permission.VIEW_REPORTS,
    Permission.VIEW_ANALYTICS,
    Permission.MANAGE_SETTINGS,
    Permission.MANAGE_TAX,
    Permission.MANAGE_PROMOTIONS,
    Permission.BACKUP_RESTORE,
    Permission.VIEW_AUDIT_LOG,
    Permission.MANAGE_PURCHASE_ORDERS,
    Permission.VIEW_PURCHASE_ORDERS,
    Permission.MANAGE_SUPPLIERS,
    Permission.VIEW_SUPPLIERS,
    Permission.MANAGE_ATTENDANCE,
    Permission.VIEW_OWN_ATTENDANCE,
  ],

  MANAGER: [
    // Operational management, no user management, can see revenue but not profit
    Permission.VIEW_USERS,
    Permission.USE_POS,
    Permission.APPROVE_DISCOUNT,
    Permission.MANAGE_PRODUCTS,
    Permission.VIEW_PRODUCTS,
    Permission.MANAGE_INVENTORY,
    Permission.VIEW_INVENTORY,
    Permission.MANAGE_STOCK_TRANSFER,
    Permission.MANAGE_CUSTOMERS,
    Permission.VIEW_CUSTOMERS,
    Permission.MANAGE_LOYALTY,
    Permission.VIEW_FINANCIAL, // Can see revenue
    // NO VIEW_PROFIT - cannot see cost/profit
    Permission.MANAGE_CASH_SESSION,
    Permission.VIEW_OWN_CASH_SESSION,
    Permission.VIEW_REPORTS,
    Permission.VIEW_ANALYTICS,
    Permission.MANAGE_TAX,
    Permission.MANAGE_PROMOTIONS,
    Permission.MANAGE_PURCHASE_ORDERS,
    Permission.VIEW_PURCHASE_ORDERS,
    Permission.MANAGE_SUPPLIERS,
    Permission.VIEW_SUPPLIERS,
    Permission.MANAGE_ATTENDANCE,
    Permission.VIEW_OWN_ATTENDANCE,
  ],

  CASHIER: [
    // POS only, limited access
    Permission.USE_POS,
    Permission.VIEW_PRODUCTS,
    Permission.VIEW_CUSTOMERS,
    Permission.VIEW_OWN_CASH_SESSION,
    Permission.VIEW_OWN_ATTENDANCE,
  ],

  WAREHOUSE: [
    // Inventory management only
    Permission.MANAGE_INVENTORY,
    Permission.VIEW_INVENTORY,
    Permission.MANAGE_STOCK_TRANSFER,
    Permission.VIEW_PRODUCTS,
    Permission.MANAGE_PURCHASE_ORDERS,
    Permission.VIEW_PURCHASE_ORDERS,
    Permission.VIEW_SUPPLIERS,
    Permission.VIEW_OWN_ATTENDANCE,
  ],

  SALES: [
    // Sales and customer management
    Permission.USE_POS,
    Permission.VIEW_PRODUCTS,
    Permission.MANAGE_CUSTOMERS,
    Permission.VIEW_CUSTOMERS,
    Permission.MANAGE_LOYALTY,
    Permission.VIEW_OWN_CASH_SESSION,
    Permission.VIEW_OWN_ATTENDANCE,
  ],
}

// Check if user has permission
export function hasPermission(userRole: Role, permission: Permission): boolean {
  const permissions = rolePermissions[userRole]
  return permissions.includes(permission)
}

// Check if user has any of the permissions
export function hasAnyPermission(userRole: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission))
}

// Check if user has all permissions
export function hasAllPermissions(userRole: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission))
}

// Get all permissions for a role
export function getRolePermissions(role: Role): Permission[] {
  return rolePermissions[role]
}

// Check if role can manage another role
export function canManageRole(managerRole: Role, targetRole: Role): boolean {
  // SUPER_ADMIN can manage everyone
  if (managerRole === 'SUPER_ADMIN') return true

  // ADMIN can manage everyone except SUPER_ADMIN
  if (managerRole === 'ADMIN' && targetRole !== 'SUPER_ADMIN') return true

  // Others cannot manage users
  return false
}

// Role hierarchy (higher number = more power)
const roleHierarchy: Record<Role, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 90,
  MANAGER: 50,
  SALES: 30,
  CASHIER: 20,
  WAREHOUSE: 20,
}

export function getRoleLevel(role: Role): number {
  return roleHierarchy[role]
}

export function isHigherRole(role1: Role, role2: Role): boolean {
  return getRoleLevel(role1) > getRoleLevel(role2)
}
