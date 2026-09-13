import {
  LAUNDRY_ROLES,
  normalizeLaundryRole,
  getLaundryRoleModules,
} from "../src/config/laundryPermissions.js";

function runTests() {
  console.log("=== RUNNING LAUNDRY RBAC CONFIG TESTS ===");

  // 1. Role Normalization
  console.assert(normalizeLaundryRole("Manager") === LAUNDRY_ROLES.MANAGER, "Manager normalized");
  console.assert(normalizeLaundryRole("Laundry Manager") === LAUNDRY_ROLES.MANAGER, "Laundry Manager normalized");
  console.assert(normalizeLaundryRole("Cashier") === LAUNDRY_ROLES.CASHIER, "Cashier normalized");
  console.assert(normalizeLaundryRole("Processing Staff") === LAUNDRY_ROLES.PROCESSING_STAFF, "Processing Staff normalized");
  console.assert(normalizeLaundryRole("Delivery Driver") === LAUNDRY_ROLES.DELIVERY_DRIVER, "Delivery Driver normalized");

  // 2. Manager Modules
  const mgrModules = getLaundryRoleModules("Manager");
  console.assert(mgrModules.includes("LAUNDRY_SERVICES"), "Manager has services module");
  console.assert(mgrModules.includes("EMPLOYEES"), "Manager has employees module");
  console.assert(mgrModules.includes("LAUNDRY_REPORTS"), "Manager has reports module");
  console.assert(mgrModules.includes("LAUNDRY_POS"), "Manager has POS module");
  console.assert(mgrModules.includes("LAUNDRY_PROCESSING"), "Manager has processing module");

  // 3. Cashier Modules
  const cashierModules = getLaundryRoleModules("Cashier");
  console.assert(cashierModules.includes("LAUNDRY_POS"), "Cashier has POS module");
  console.assert(cashierModules.includes("CUSTOMERS"), "Cashier has customers module");
  console.assert(cashierModules.includes("LAUNDRY_DELIVERY"), "Cashier has delivery module");
  console.assert(!cashierModules.includes("LAUNDRY_SERVICES"), "Cashier does not have services");
  console.assert(!cashierModules.includes("EMPLOYEES"), "Cashier does not have employees");
  console.assert(!cashierModules.includes("LAUNDRY_REPORTS"), "Cashier does not have reports");

  // 4. Processing Staff Modules
  const procModules = getLaundryRoleModules("Processing Staff");
  console.assert(procModules.includes("LAUNDRY_ORDERS"), "Processing has orders module");
  console.assert(procModules.includes("LAUNDRY_GARMENTS"), "Processing has garments module");
  console.assert(procModules.includes("LAUNDRY_PROCESSING"), "Processing has processing queue module");
  console.assert(procModules.includes("LAUNDRY_READY"), "Processing has ready module");
  console.assert(!procModules.includes("LAUNDRY_POS"), "Processing does not have POS");
  console.assert(!procModules.includes("CUSTOMERS"), "Processing does not have customers");
  console.assert(!procModules.includes("EMPLOYEES"), "Processing does not have employees");
  console.assert(!procModules.includes("LAUNDRY_REPORTS"), "Processing does not have reports");

  // 5. Delivery Driver Modules
  const driverModules = getLaundryRoleModules("Delivery Driver");
  console.assert(driverModules.includes("LAUNDRY_READY"), "Driver has ready module");
  console.assert(driverModules.includes("LAUNDRY_DELIVERY"), "Driver has delivery module");
  console.assert(!driverModules.includes("LAUNDRY_POS"), "Driver does not have POS");
  console.assert(!driverModules.includes("LAUNDRY_GARMENTS"), "Driver does not have garments");
  console.assert(!driverModules.includes("LAUNDRY_SERVICES"), "Driver does not have services");
  console.assert(!driverModules.includes("EMPLOYEES"), "Driver does not have employees");
  console.assert(!driverModules.includes("LAUNDRY_REPORTS"), "Driver does not have reports");

  console.log("All Laundry RBAC tests passed successfully!");
}

runTests();
