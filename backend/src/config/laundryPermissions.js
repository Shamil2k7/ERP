/**
 * Centralized Role and Permission Configuration for Laundry ERP
 */

export const LAUNDRY_ROLES = {
  MANAGER: "MANAGER",
  CASHIER: "CASHIER",
  PROCESSING_STAFF: "PROCESSING_STAFF",
  DELIVERY_DRIVER: "DELIVERY_DRIVER",
};

/**
 * Normalizes any free-form string into a standard Laundry Role
 */
export const normalizeLaundryRole = (roleStr) => {
  if (!roleStr) return LAUNDRY_ROLES.PROCESSING_STAFF;
  const upper = String(roleStr).trim().toUpperCase().replace(/[\s-]+/g, "_");

  if (upper.includes("MANAGER") || upper === "ADMIN" || upper === "SUPER_ADMIN" || upper === "OWNER") {
    return LAUNDRY_ROLES.MANAGER;
  }
  if (upper.includes("CASHIER") || upper.includes("BILLING") || upper.includes("COUNTER") || upper.includes("POS")) {
    return LAUNDRY_ROLES.CASHIER;
  }
  if (upper.includes("DELIVERY") || upper.includes("DRIVER") || upper.includes("RIDER") || upper.includes("COURIER")) {
    return LAUNDRY_ROLES.DELIVERY_DRIVER;
  }
  if (upper.includes("PROCESS") || upper.includes("WASHER") || upper.includes("OPERATOR") || upper.includes("STAFF") || upper.includes("IRON")) {
    return LAUNDRY_ROLES.PROCESSING_STAFF;
  }

  return LAUNDRY_ROLES.PROCESSING_STAFF;
};

/**
 * Module access codes assigned to each role
 */
export const LAUNDRY_ROLE_MODULES = {
  [LAUNDRY_ROLES.MANAGER]: [
    "DASHBOARD",
    "LAUNDRY",
    "LAUNDRY_DASHBOARD",
    "LAUNDRY_POS",
    "LAUNDRY_ORDERS",
    "LAUNDRY_SERVICES",
    "LAUNDRY_GARMENTS",
    "LAUNDRY_PROCESSING",
    "LAUNDRY_READY",
    "LAUNDRY_DELIVERY",
    "CUSTOMERS",
    "BRANCHES",
    "EMPLOYEES",
    "LAUNDRY_REPORTS",
    "REPORTS",
    "SETTINGS",
  ],
  [LAUNDRY_ROLES.CASHIER]: [
    "LAUNDRY",
    "LAUNDRY_POS",
    "LAUNDRY_ORDERS",
    "CUSTOMERS",
    "LAUNDRY_DELIVERY",
  ],
  [LAUNDRY_ROLES.PROCESSING_STAFF]: [
    "LAUNDRY",
    "LAUNDRY_ORDERS",
    "LAUNDRY_GARMENTS",
    "LAUNDRY_PROCESSING",
    "LAUNDRY_READY",
  ],
  [LAUNDRY_ROLES.DELIVERY_DRIVER]: [
    "LAUNDRY",
    "LAUNDRY_READY",
    "LAUNDRY_DELIVERY",
  ],
};

/**
 * Allowed roles per laundry API capability
 */
export const LAUNDRY_ENDPOINT_PERMISSIONS = {
  // Profiles & Outlets
  MANAGE_OUTLETS: [LAUNDRY_ROLES.MANAGER, "ADMIN", "SUPER_ADMIN", "OWNER"],
  // Services & Categories
  MANAGE_SERVICES: [LAUNDRY_ROLES.MANAGER, "ADMIN", "SUPER_ADMIN", "OWNER"],
  // POS Order Creation
  CREATE_ORDER: [LAUNDRY_ROLES.MANAGER, LAUNDRY_ROLES.CASHIER, "ADMIN", "SUPER_ADMIN", "OWNER"],
  // View Orders List
  VIEW_ORDERS: [LAUNDRY_ROLES.MANAGER, LAUNDRY_ROLES.CASHIER, LAUNDRY_ROLES.PROCESSING_STAFF, "ADMIN", "SUPER_ADMIN", "OWNER"],
  // Update Order Status (e.g. Processing -> Ready)
  UPDATE_ORDER_STATUS: [LAUNDRY_ROLES.MANAGER, LAUNDRY_ROLES.CASHIER, LAUNDRY_ROLES.PROCESSING_STAFF, "ADMIN", "SUPER_ADMIN", "OWNER"],
  // Garment Barcode Scanning & Item Status
  SCAN_GARMENTS: [LAUNDRY_ROLES.MANAGER, LAUNDRY_ROLES.PROCESSING_STAFF, "ADMIN", "SUPER_ADMIN", "OWNER"],
  // Delivery & Pickup Assignment / Status
  UPDATE_DELIVERY: [LAUNDRY_ROLES.MANAGER, LAUNDRY_ROLES.CASHIER, LAUNDRY_ROLES.DELIVERY_DRIVER, "ADMIN", "SUPER_ADMIN", "OWNER"],
  // Employees Management
  MANAGE_EMPLOYEES: [LAUNDRY_ROLES.MANAGER, "ADMIN", "SUPER_ADMIN", "OWNER"],
  // Reports & Analytics
  VIEW_REPORTS: [LAUNDRY_ROLES.MANAGER, "ADMIN", "SUPER_ADMIN", "OWNER"],
  // Dashboard Metrics (Manager & Admin only)
  VIEW_DASHBOARD: [LAUNDRY_ROLES.MANAGER, "ADMIN", "SUPER_ADMIN", "OWNER"],
};

/**
 * Returns allowed modules for a given role
 */
export const getLaundryRoleModules = (roleStr) => {
  const norm = normalizeLaundryRole(roleStr);
  return LAUNDRY_ROLE_MODULES[norm] || LAUNDRY_ROLE_MODULES[LAUNDRY_ROLES.PROCESSING_STAFF];
};
