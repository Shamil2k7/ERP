import * as dashboardService from "./dashboard.service.js";

/**
 * GET /api/dashboard/overview
 */
export const getDashboardOverview = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const branchId = req.query.branchId || req.headers["x-branch-override"] || req.user?.branchId;
    const userRole = (req.user?.role || req.user?.roleRef?.name || "").toUpperCase();
    const userId = req.user?.id;
    const { period, startDate, endDate } = req.query;

    const data = await dashboardService.getDashboardOverview({
      companyId,
      branchId,
      userRole,
      userId,
      period,
      startDate,
      endDate,
    });

    return res.status(200).json({
      success: true,
      message: "Dashboard overview fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Notice Board Endpoints
 */
export const getNotices = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const branchId = req.query.branchId || req.user?.branchId;
    const notices = await dashboardService.getNotices({ companyId, branchId });

    return res.status(200).json({
      success: true,
      data: notices,
    });
  } catch (error) {
    next(error);
  }
};

export const createNotice = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const branchId = req.body.branchId || req.user?.branchId;
    const createdBy = req.user?.fullName || req.user?.email || "Admin";

    const notice = await dashboardService.createNotice({
      companyId,
      branchId,
      title: req.body.title,
      description: req.body.description,
      expiryDate: req.body.expiryDate,
      createdBy,
    });

    return res.status(201).json({
      success: true,
      message: "Notice created successfully",
      data: notice,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * To-Do Tasks Endpoints
 */
export const getTodos = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const branchId = req.query.branchId || req.user?.branchId;
    const userId = req.user?.id;

    const todos = await dashboardService.getTodos({ companyId, branchId, userId });

    return res.status(200).json({
      success: true,
      data: todos,
    });
  } catch (error) {
    next(error);
  }
};

export const createTodo = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const branchId = req.body.branchId || req.user?.branchId;
    const assignedTo = req.body.assignedTo || req.user?.id;

    const todo = await dashboardService.createTodo({
      companyId,
      branchId,
      title: req.body.title,
      description: req.body.description,
      assignedTo,
      dueDate: req.body.dueDate,
      priority: req.body.priority,
    });

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: todo,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleTodo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const todo = await dashboardService.toggleTodoStatus(id, status);

    return res.status(200).json({
      success: true,
      message: "Task status updated",
      data: todo,
    });
  } catch (error) {
    next(error);
  }
};
