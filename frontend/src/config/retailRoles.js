/**
 * Centralized Role-Based Access Control (RBAC) Configuration for Retail ERP Mode
 */

export const RETAIL_ROLES = {
  STORE_MANAGER: "Store Manager",
  CASHIER: "Cashier",
  INVENTORY_MANAGER: "Inventory Manager",
  PURCHASE_MANAGER: "Purchase Manager",
  ACCOUNTANT: "Accountant",
};

export const RETAIL_ROLE_ACCESS = {
  STORE_MANAGER: [
    "DASHBOARD",
    "POS",
    "POS_HISTORY",
    "BARCODE_PRINT",
    "PRODUCTS",
    "CATEGORIES",
    "BRANDS",
    "UNITS",
    "INVENTORY",
    "WAREHOUSE",
    "STOCK_TRANSFER",
    "CUSTOMERS",
    "SUPPLIERS",
    "PURCHASES",
    "SALES",
    "INVOICES",
    "BRANCHES",
    "EMPLOYEES",
    "REPORTS",
  ],
  CASHIER: [
    "DASHBOARD",
    "POS",
    "POS_HISTORY",
    "CUSTOMERS",
    "BARCODE_PRINT",
    "INVOICES",
    "SALES",
  ],
  INVENTORY_MANAGER: [
    "DASHBOARD",
    "PRODUCTS",
    "CATEGORIES",
    "BRANDS",
    "UNITS",
    "BARCODE_PRINT",
    "INVENTORY",
    "WAREHOUSE",
    "STOCK_TRANSFER",
  ],
  PURCHASE_MANAGER: [
    "DASHBOARD",
    "PRODUCTS",
    "CATEGORIES",
    "BRANDS",
    "UNITS",
    "SUPPLIERS",
    "PURCHASES",
    "INVENTORY",
    "WAREHOUSE",
  ],
  ACCOUNTANT: [
    "DASHBOARD",
    "POS_HISTORY",
    "SALES",
    "INVOICES",
    "PURCHASES",
    "CUSTOMERS",
    "SUPPLIERS",
    "REPORTS",
  ],
};

export const normalizeRetailRole = (roleStr = "") => {
  if (!roleStr) return null;
  const clean = String(roleStr).toUpperCase().replace(/[\s\-_]+/g, "_");
  if (clean.includes("STORE_MANAGER") || clean.includes("STORE_OPERATIONS")) return "STORE_MANAGER";
  if (clean.includes("CASHIER") || clean.includes("BILLING") || clean.includes("COUNTER")) return "CASHIER";
  if (clean.includes("INVENTORY_MANAGER") || clean.includes("WAREHOUSE_MANAGER") || clean.includes("STOCK_MANAGER")) return "INVENTORY_MANAGER";
  if (clean.includes("PURCHASE_MANAGER") || clean.includes("PROCUREMENT_MANAGER") || clean.includes("BUYER")) return "PURCHASE_MANAGER";
  if (clean.includes("ACCOUNTANT") || clean.includes("FINANCE") || clean.includes("BOOKKEEPER")) return "ACCOUNTANT";
  return null;
};
