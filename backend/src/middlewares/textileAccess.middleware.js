import { isTextileModuleAllowed, normalizeTextileRole } from "../config/textileRoles.js";

/**
 * Middleware to enforce Textile ERP Role-Based Access Control
 * @param {string} moduleCode - Code of the module (e.g. "PRODUCTS", "PRODUCTION", "RAW_MATERIALS", "QUALITY_CONTROL", "EMPLOYEES", "REPORTS")
 */
export const requireTextileModule = (moduleCode) => {
  return (req, res, next) => {
    try {
      const user = req.user;
      // If unauthenticated or no role passed, check header or fallback
      const roleStr = user?.role || user?.roleRef?.name || user?.designation || req.headers["x-user-role"] || "ADMIN";
      const normalizedRole = normalizeTextileRole(roleStr) || "ADMIN";

      // Super Admins & Admins have full access
      if (normalizedRole === "ADMIN") {
        req.textileRole = "ADMIN";
        return next();
      }

      const isAllowed = isTextileModuleAllowed(normalizedRole, moduleCode);
      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          message: `403 Forbidden: Your role '${roleStr}' is not authorized to access Textile '${moduleCode}'.`,
        });
      }

      req.textileRole = normalizedRole;
      return next();
    } catch (err) {
      console.error("Textile Access Middleware Error:", err);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error checking textile authorization",
      });
    }
  };
};
