/**
 * Centralized Role-Based Access Control Configuration for Laundry ERP (Frontend)
 */

export const LAUNDRY_ROLES = {
  MANAGER: "MANAGER",
  CASHIER: "CASHIER",
  PROCESSING_STAFF: "PROCESSING_STAFF",
  DELIVERY_DRIVER: "DELIVERY_DRIVER",
};

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
 * Permitted Frontend Routes per Role
 */
export const LAUNDRY_ROLE_ROUTES = {
  [LAUNDRY_ROLES.MANAGER]: [
    "/laundry/dashboard",
    "/laundry/pos",
    "/laundry/orders",
    "/admin/branches",
    "/laundry/services",
    "/laundry/garments",
    "/laundry/processing",
    "/laundry/ready",
    "/laundry/delivery",
    "/customers",
    "/admin/employees",
    "/admin/employees/view",
    "/admin/employees/add",
    "/laundry/reports",
  ],
  [LAUNDRY_ROLES.CASHIER]: [
    "/laundry/pos",
    "/laundry/orders",
    "/customers",
    "/laundry/delivery",
  ],
  [LAUNDRY_ROLES.PROCESSING_STAFF]: [
    "/laundry/orders",
    "/laundry/garments",
    "/laundry/processing",
    "/laundry/ready",
  ],
  [LAUNDRY_ROLES.DELIVERY_DRIVER]: [
    "/laundry/ready",
    "/laundry/delivery",
  ],
};

/**
 * Checks whether a given user can access a specific route in Laundry ERP
 */
export const canAccessLaundryRoute = (user, routePath) => {
  if (!user || !routePath) return false;
  const roleUpper = (user?.role || user?.roleRef?.name || user?.type || "").toUpperCase().replace(/[\s-]+/g, "_");

  // Super Admin / System Admin bypass
  if (roleUpper === "SUPER_ADMIN" || roleUpper === "SUPERADMIN" || roleUpper === "ADMIN" || roleUpper === "OWNER") {
    return true;
  }

  const role = normalizeLaundryRole(user.role || user.roleRef?.name);
  const allowedRoutes = LAUNDRY_ROLE_ROUTES[role] || [];

  return allowedRoutes.some((allowed) => {
    if (routePath === allowed) return true;
    if (routePath.startsWith(allowed + "/")) return true;
    return false;
  });
};

/**
 * Helper to check permission capability
 */
export const hasLaundryPermission = (user, permissionKey) => {
  if (!user) return false;
  const roleUpper = (user?.role || user?.roleRef?.name || user?.type || "").toUpperCase().replace(/[\s-]+/g, "_");
  if (roleUpper === "SUPER_ADMIN" || roleUpper === "SUPERADMIN" || roleUpper === "ADMIN" || roleUpper === "OWNER") {
    return true;
  }
  const role = normalizeLaundryRole(user.role || user.roleRef?.name);

  switch (permissionKey) {
    case "employees.manage":
    case "branches.manage":
    case "services.manage":
    case "reports.view":
      return role === LAUNDRY_ROLES.MANAGER;
    case "pos.create":
      return role === LAUNDRY_ROLES.MANAGER || role === LAUNDRY_ROLES.CASHIER;
    case "orders.view":
      return role === LAUNDRY_ROLES.MANAGER || role === LAUNDRY_ROLES.CASHIER || role === LAUNDRY_ROLES.PROCESSING_STAFF;
    case "garments.scan":
    case "processing.queue":
      return role === LAUNDRY_ROLES.MANAGER || role === LAUNDRY_ROLES.PROCESSING_STAFF;
    case "delivery.manage":
      return role === LAUNDRY_ROLES.MANAGER || role === LAUNDRY_ROLES.CASHIER || role === LAUNDRY_ROLES.DELIVERY_DRIVER;
    case "customers.view":
      return role === LAUNDRY_ROLES.MANAGER || role === LAUNDRY_ROLES.CASHIER;
    case "dashboard.view":
      return true;
    default:
      return false;
  }
};
