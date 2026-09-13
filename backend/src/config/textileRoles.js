/**
 * Centralized Role-Based Access Control (RBAC) Configuration for Textile ERP Mode (Backend)
 */

export const TEXTILE_ROLES = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  WEAVER: "Weaver",
  DYER: "Dyer",
  QUALITY_INSPECTOR: "Quality Inspector",
};

export const TEXTILE_ROLE_ACCESS = {
  ADMIN: [
    "DASHBOARD",
    "PRODUCTS",
    "CATEGORIES",
    "BRANDS",
    "RAW_MATERIALS",
    "SUPPLIERS",
    "CUSTOMERS",
    "PURCHASES",
    "PRODUCTION",
    "INVENTORY",
    "STOCK_MOVEMENTS",
    "STOCK_TRANSFER",
    "WAREHOUSES",
    "WAREHOUSE",
    "QUALITY_CONTROL",
    "BRANCHES",
    "MANUFACTURING_UNITS",
    "SALES",
    "EXPORT_MANAGEMENT",
    "EXPORTS",
    "UNITS",
    "EMPLOYEES",
    "REPORTS",
    "SETTINGS",
  ],
  MANAGER: [
    "DASHBOARD",
    "PRODUCTS",
    "CATEGORIES",
    "BRANDS",
    "RAW_MATERIALS",
    "SUPPLIERS",
    "CUSTOMERS",
    "PURCHASES",
    "PRODUCTION",
    "INVENTORY",
    "STOCK_MOVEMENTS",
    "STOCK_TRANSFER",
    "WAREHOUSES",
    "WAREHOUSE",
    "QUALITY_CONTROL",
    "BRANCHES",
    "MANUFACTURING_UNITS",
    "SALES",
    "EXPORT_MANAGEMENT",
    "EXPORTS",
    "UNITS",
    "REPORTS",
  ],
  WEAVER: [
    "DASHBOARD",
    "PRODUCTION",
  ],
  DYER: [
    "DASHBOARD",
    "PRODUCTION",
  ],
  QUALITY_INSPECTOR: [
    "DASHBOARD",
    "QUALITY_CONTROL",
  ],
};

export const normalizeTextileRole = (roleStr = "") => {
  if (!roleStr) return null;
  const clean = String(roleStr).toUpperCase().replace(/[\s\-_]+/g, "_");

  if (clean.includes("ADMIN") || clean.includes("OWNER") || clean.includes("SUPER")) return "ADMIN";
  if (clean.includes("MANAGER") || clean.includes("SUPERVISOR") || clean.includes("LEAD")) return "MANAGER";
  if (clean.includes("WEAVER") || clean.includes("LOOM")) return "WEAVER";
  if (clean.includes("DYER") || clean.includes("DYE")) return "DYER";
  if (clean.includes("QUALITY") || clean.includes("INSPECT") || clean.includes("QC")) return "QUALITY_INSPECTOR";

  return null;
};

export const isTextileModuleAllowed = (roleStr, moduleCode) => {
  const normalized = normalizeTextileRole(roleStr) || "ADMIN";
  const allowed = TEXTILE_ROLE_ACCESS[normalized] || TEXTILE_ROLE_ACCESS.ADMIN;
  const target = String(moduleCode).toUpperCase().replace(/[\s\-_]+/g, "_");
  return allowed.includes(target);
};
