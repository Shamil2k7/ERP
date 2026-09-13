import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

/**
 * Middleware that extracts JWT token from Authorization header or cookies,
 * looks up the user in the DB with company relation, and attaches user info to `req.user`.
 */
export const attachUserIfAuthenticated = async (req, res, next) => {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      const secret = process.env.JWT_SECRET || "supersecretkey";
      const decoded = jwt.verify(token, secret);

      if (decoded && decoded.id) {
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          include: {
            roleRef: true,
            branch: true,
            company: {
              include: {
                industry: true,
                modules: {
                  include: {
                    module: true,
                  },
                },
              },
            },
          },
        });

        if (user) {
          const companyModules =
            user.company?.modules
              ?.filter((cm) => cm.enabled)
              .map((cm) => cm.module.code) || [];

          let userModules = companyModules;
          if (user.permissions) {
            try {
              const parsed = JSON.parse(user.permissions);
              if (Array.isArray(parsed) && parsed.length > 0) {
                userModules = parsed;
              }
            } catch (e) {
              if (typeof user.permissions === "string" && user.permissions.trim().length > 0) {
                userModules = user.permissions.split(",").map((s) => s.trim().toUpperCase());
              }
            }
          }

          let overriddenCompanyId = user.companyId || user.company?.id || null;
          let overriddenCompanyName = user.company?.name || "Default Company";
          let overriddenBranchId = user.branchId;
          let industryCode = (user.company?.industry?.code || user.type || "RETAIL").toUpperCase();
          let industryName = user.company?.industry?.name || "Retail";

          const roleName = (user.roleRef?.name || user.role || "ADMIN").trim();
          const roleUpper = roleName.toUpperCase().replace(/\s+/g, "_");
          const isSuper = roleUpper.includes("SUPER");

          // Retail default role permissions automated mapping
          if (industryCode.includes("RETAIL") && !isSuper && !roleUpper.includes("ADMIN") && !roleUpper.includes("SUPER")) {
            if (roleUpper.includes("STORE_MANAGER") || roleUpper.includes("STORE_OPERATIONS")) {
              userModules = [
                "DASHBOARD",
                "POS",
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
              ];
            } else if (roleUpper === "CASHIER" || roleUpper.includes("CASHIER") || roleUpper.includes("BILLING")) {
              userModules = ["DASHBOARD", "POS", "CUSTOMERS", "BARCODE_PRINT", "INVOICES", "SALES"];
            } else if (roleUpper.includes("INVENTORY_MANAGER") || roleUpper.includes("WAREHOUSE_MANAGER")) {
              userModules = [
                "DASHBOARD",
                "PRODUCTS",
                "CATEGORIES",
                "BRANDS",
                "UNITS",
                "BARCODE_PRINT",
                "INVENTORY",
                "WAREHOUSE",
                "STOCK_TRANSFER",
              ];
            } else if (roleUpper.includes("PURCHASE_MANAGER") || roleUpper.includes("PROCUREMENT_MANAGER")) {
              userModules = [
                "DASHBOARD",
                "PRODUCTS",
                "CATEGORIES",
                "BRANDS",
                "UNITS",
                "SUPPLIERS",
                "PURCHASES",
                "INVENTORY",
                "WAREHOUSE",
              ];
            } else if (roleUpper.includes("ACCOUNTANT") || roleUpper.includes("FINANCE")) {
              userModules = [
                "DASHBOARD",
                "POS_HISTORY",
                "SALES",
                "INVOICES",
                "PURCHASES",
                "CUSTOMERS",
                "SUPPLIERS",
                "REPORTS",
              ];
            }
          }

          // Laundry default role permissions fallback
          if (industryCode.includes("LAUNDRY") && !isSuper && !roleUpper.includes("ADMIN")) {
            const { getLaundryRoleModules } = await import("../config/laundryPermissions.js");
            userModules = getLaundryRoleModules(roleUpper);
          }

          // Restaurant default role permissions fallback
          if (industryCode.includes("RESTAURANT") && !isSuper && !roleUpper.includes("ADMIN")) {
            if (roleUpper.includes("MANAGER")) {
              userModules = [
                "DASHBOARD",
                "RESTAURANT",
                "PRODUCTS",
                "CATEGORIES",
                "BRANDS",
                "UNITS",
                "INVENTORY",
                "SUPPLIERS",
                "EMPLOYEES",
                "REPORTS",
                "SETTINGS",
              ];
            } else if (roleUpper.includes("CASHIER")) {
              userModules = ["DASHBOARD", "RESTAURANT", "POS", "SALES", "ORDERS", "CUSTOMERS", "INVOICES"];
            } else if (roleUpper.includes("WAITER") || roleUpper.includes("STEWARD") || roleUpper.includes("SERVER")) {
              userModules = ["RESTAURANT", "POS", "TABLES", "RESERVATIONS", "ORDERS"];
            } else if (roleUpper.includes("KITCHEN") || roleUpper.includes("CHEF") || roleUpper.includes("COOK")) {
              userModules = ["RESTAURANT", "KITCHEN", "KDS"];
            }
          }


          if (isSuper) {
            const clientCompanyHeader = req.headers["x-company-override"];
            const clientBranchHeader = req.headers["x-branch-override"];

            if (clientCompanyHeader) {
              overriddenCompanyId = clientCompanyHeader;
              // Fetch overridden company modules
              const dbCompany = await prisma.company.findUnique({
                where: { id: overriddenCompanyId },
                include: {
                  industry: true,
                  modules: {
                    include: { module: true },
                  },
                },
              });

              if (dbCompany) {
                userModules = dbCompany.modules?.filter((cm) => cm.enabled).map((cm) => cm.module.code) || [];
                industryCode = dbCompany.industry?.code || "RETAIL";
                industryName = dbCompany.industry?.name || "Retail";
                overriddenCompanyName = dbCompany.name;
              }
            }

            if (clientBranchHeader) {
              overriddenBranchId = clientBranchHeader;
            }
          }

          req.user = {
            id: user.id,
            fullName: user.fullName || user.email,
            email: user.email,
            employeeId: user.employeeId,
            role: roleName,
            companyId: overriddenCompanyId,
            companyName: overriddenCompanyName,
            industryCode: industryCode,
            industryName: industryName,
            enabledModules: userModules,
            permissions: user.permissions,
            branchId: overriddenBranchId,
          };
          req.companyId = req.user.companyId;
          req.tenantId = req.user.companyId;
          req.branchId = overriddenBranchId;
        }
      }
    }
  } catch (err) {
    // Non-blocking catch to ensure requests aren't broken if token is expired or malformed
  }

  next();
};

export const requireTenant = (req, res, next) => {
  const companyId = req.companyId || req.user?.companyId;
  if (!companyId) {
    return res.status(403).json({
      success: false,
      message: "Tenant context required. Access denied.",
    });
  }
  next();
};

export const requireRoles = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Please log in to access this resource",
      });
    }

    const rawRole = (req.user.role || req.user.roleRef?.name || req.user.type || "").trim();
    const roleUpper = rawRole.toUpperCase().replace(/[\s_-]+/g, "_");

    // Super Admin, Admin, and Owner always have full unrestricted access across all modules
    if (
      roleUpper === "SUPER_ADMIN" ||
      roleUpper === "SUPERADMIN" ||
      roleUpper.includes("SUPER") ||
      roleUpper === "ADMIN" ||
      roleUpper === "ADMINISTRATOR" ||
      roleUpper.includes("ADMIN") ||
      roleUpper === "OWNER" ||
      roleUpper.includes("OWNER")
    ) {
      return next();
    }

    const normalizedAllowed = (Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]).map((r) =>
      String(r).trim().toUpperCase().replace(/[\s_-]+/g, "_")
    );

    const hasRole = normalizedAllowed.some((allowed) => {
      return (
        roleUpper === allowed ||
        roleUpper.includes(allowed) ||
        allowed.includes(roleUpper) ||
        (allowed.includes("STAFF") &&
          (roleUpper.includes("STAFF") ||
            roleUpper.includes("PROCESS") ||
            roleUpper.includes("WASHER") ||
            roleUpper.includes("IRON") ||
            roleUpper.includes("OPERATOR"))) ||
        (allowed.includes("MANAGER") && roleUpper.includes("MANAGER")) ||
        (allowed.includes("CASHIER") && roleUpper.includes("CASHIER")) ||
        (allowed.includes("DRIVER") &&
          (roleUpper.includes("DRIVER") || roleUpper.includes("DELIVERY")))
      );
    });

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `403 Forbidden: You do not have the required role to access this resource.`,
      });
    }

    next();
  };
};

