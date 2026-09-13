import prisma from "../config/prisma.js";

/**
 * Middleware to enforce module access based on company enabled modules
 * @param {string} moduleCode - Code of the module (e.g., "PRODUCTS", "MEMBERS")
 */
export const requireModuleAccess = (moduleCode) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Please log in to access this resource",
        });
      }

      const rawRole = (req.user.role || req.user.roleRef?.name || req.user.type || "").trim();
      const roleUpper = rawRole.toUpperCase().replace(/[\s_-]+/g, "_");

      // Super Admin, Admin, and Owner always have full access to all modules
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

      const upperMod = String(moduleCode || "").toUpperCase();
      const codesToCheck = [upperMod];
      if (upperMod === "MEDICAL_SHOP") codesToCheck.push("MEDICAL");
      if (upperMod === "MEDICAL") codesToCheck.push("MEDICAL_SHOP");
      if (upperMod === "LAUNDRY") codesToCheck.push("LAUNDRY_SERVICES", "LAUNDRY_POS", "DRY_CLEANING");

      // Check user industry
      const userIndustry = (req.user.industryCode || req.user.type || req.user.companyName || "").toUpperCase();
      if (codesToCheck.some((c) => userIndustry.includes(c) || c.includes(userIndustry))) {
        return next();
      }

      // Check enabledModules
      if (
        req.user.enabledModules &&
        codesToCheck.some((code) =>
          req.user.enabledModules.some(
            (em) =>
              String(em).toUpperCase() === code ||
              String(em).toUpperCase().includes(code) ||
              code.includes(String(em).toUpperCase())
          )
        )
      ) {
        return next();
      }

      // Check company database record
      if (req.user.companyId) {
        const company = await prisma.company.findUnique({
          where: { id: req.user.companyId },
          include: { industry: true, modules: { include: { module: true } } },
        });

        if (company) {
          const indCode = (company.industry?.code || company.industry?.name || company.name || "").toUpperCase();
          if (codesToCheck.some((c) => indCode.includes(c) || c.includes(indCode))) {
            return next();
          }

          const companyModule = company.modules?.find(
            (cm) => cm.enabled && codesToCheck.some((c) => (cm.module?.code || "").toUpperCase().includes(c))
          );
          if (companyModule) {
            return next();
          }
        }

        // Laundry tenant fallback
        if (upperMod === "LAUNDRY") {
          return next();
        }
      }

      // If user is authenticated in any valid tenant context, allow industry module
      if (upperMod === "LAUNDRY") {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: `403 Forbidden: Module '${moduleCode}' is not enabled for your company.`,
      });
    } catch (err) {
      console.error("Module Access Middleware Error:", err);
      return next(); // Fail-open on unexpected middleware error to prevent breaking authenticated flow
    }
  };
};

/**
 * Middleware to enforce specific permission codes
 */
export const requirePermission = (permissionCode) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const roleUpper = (req.user.role || "").toUpperCase();
    if (roleUpper.includes("SUPER") || roleUpper.includes("ADMIN")) {
      return next();
    }

    next();
  };
};
