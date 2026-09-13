import * as reportsService from "./reports.service.js";

/**
 * GET Sales Report
 */
export const getSalesReport = async (req, res, next) => {
  try {
    const companyId = req.user?.companyId;
    const { startDate, endDate, groupBy, customerId } = req.query;

    let start;
    if (startDate) {
      start = new Date(startDate);
    } else {
      start = new Date();
      start.setDate(start.getDate() - 30);
    }
    start.setUTCHours(0, 0, 0, 0);

    let end;
    if (endDate) {
      end = new Date(endDate);
    } else {
      end = new Date();
    }
    end.setUTCHours(23, 59, 59, 999);

    const report = await reportsService.getSalesReport(
      start,
      end,
      groupBy || "day",
      customerId || null,
      companyId
    );

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET Purchase Report
 */
export const getPurchaseReport = async (req, res, next) => {
  try {
    const companyId = req.user?.companyId;
    const { startDate, endDate, groupBy, supplierId } = req.query;

    let start;
    if (startDate) {
      start = new Date(startDate);
    } else {
      start = new Date();
      start.setDate(start.getDate() - 30);
    }
    start.setUTCHours(0, 0, 0, 0);

    let end;
    if (endDate) {
      end = new Date(endDate);
    } else {
      end = new Date();
    }
    end.setUTCHours(23, 59, 59, 999);

    const report = await reportsService.getPurchaseReport(
      start,
      end,
      groupBy || "day",
      supplierId || null,
      companyId
    );

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET Inventory Report
 */
export const getInventoryReport = async (req, res, next) => {
  try {
    const companyId = req.user?.companyId;
    const { warehouseId } = req.query;
    const report = await reportsService.getInventoryReport(warehouseId || null, companyId);

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET Report Filters
 */
export const getReportFilters = async (req, res, next) => {
  try {
    const companyId = req.user?.companyId;
    const filters = await reportsService.getReportFilters(companyId);

    res.status(200).json({
      success: true,
      data: filters,
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardSummary = async (req, res, next) => {
  try {
    const companyId = req.user?.companyId;
    const summary = await reportsService.getDashboardSummary(companyId);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};
