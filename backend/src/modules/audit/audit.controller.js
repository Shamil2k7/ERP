import {
  getAuditLogsService,
  getAuditLogByIdService,
  recordAuditLog,
} from "./audit.service.js";


export const getAuditLogs = async (req, res, next) => {
  try {
    const result = await getAuditLogsService(req.query);
    res.status(200).json({
      success: true,
      message: "Audit logs fetched successfully",
      data: result.logs,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};


export const getAuditLogById = async (req, res, next) => {
  try {
    const log = await getAuditLogByIdService(req.params.id);
    res.status(200).json({
      success: true,
      message: "Audit log details fetched successfully",
      data: log,
    });
  } catch (error) {
    next(error);
  }
};

export const createAuditLogManual = async (req, res, next) => {
  try {
    const { action, entity, entityId, details } = req.body;
    await recordAuditLog(req, { action, entity, entityId, details });

    res.status(201).json({
      success: true,
      message: "Audit log recorded successfully",
    });
  } catch (error) {
    next(error);
  }
};
