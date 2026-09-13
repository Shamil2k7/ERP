import * as reportService from "./restaurantReport.service.js";

export const getRestaurantAnalytics = async (req, res, next) => {
  try {
    const userRole = (req.user?.role || req.user?.roleRef?.name || "").toUpperCase();

    // Block unauthorized roles (Waiter, Kitchen Staff)
    if (userRole === "WAITER" || userRole === "KITCHEN" || userRole === "KITCHEN_STAFF") {
      return res.status(403).json({
        success: false,
        message: "Access Denied: Reports & Analytics is restricted for this role.",
      });
    }

    const companyId = req.companyId || req.user?.companyId;
    const branchId = req.branchId || req.user?.branchId;

    const { restaurantId, startDate, endDate, period } = req.query;

    const params = {
      companyId,
      branchId: userRole === "SUPERADMIN" || userRole === "ADMIN" ? undefined : branchId,
      restaurantId,
      startDate,
      endDate,
      period,
    };

    const analytics = await reportService.getRestaurantAnalytics(params);

    return res.status(200).json({
      success: true,
      message: "Restaurant reports & analytics fetched successfully",
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};
