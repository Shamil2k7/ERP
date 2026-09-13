import {
  createAuditLog,
  findAuditLogs,
  countAuditLogs,
  findAuditLogById,
  deleteAuditLog,
} from "./audit.repository.js";

export const getAuditLogsService = async (query = {}) => {
  const page = Math.max(1, parseInt(query.page || 1, 10));
  const limit = Math.max(1, Math.min(100, parseInt(query.limit || 20, 10)));
  const skip = (page - 1) * limit;

  const { search, action, entity, userId, startDate, endDate } = query;

  const [logs, total] = await Promise.all([
    findAuditLogs({ search, action, entity, userId, startDate, endDate, skip, take: limit }),
    countAuditLogs({ search, action, entity, userId, startDate, endDate }),
  ]);

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getAuditLogByIdService = async (id) => {
  const log = await findAuditLogById(id);
  if (!log) {
    const error = new Error("Audit log not found");
    error.status = 404;
    throw error;
  }
  return log;
};

/**
 * Helper utility to record audit log entries asynchronously
 * Usage:
 * recordAuditLog(req, {
 *   action: "CREATE",
 *   entity: "Employee",
 *   entityId: employee.id,
 *   details: { name: employee.fullName, email: employee.email }
 * })
 */
export const recordAuditLog = async (req, { action, entity, entityId, details, user }) => {
  try {
    const currentUser = user || (req && req.user) || null;
    const ipAddress = req
      ? (req.headers && req.headers["x-forwarded-for"]) || req.ip || req.socket?.remoteAddress || null
      : null;
    const userAgent = req ? req.headers && req.headers["user-agent"] : null;

    const logData = {
      userId: currentUser?.id || currentUser?.userId || null,
      userName:
        currentUser?.fullName ||
        currentUser?.name ||
        currentUser?.userName ||
        currentUser?.email ||
        "System / Guest",
      userEmail: currentUser?.email || null,
      action: action ? String(action).toUpperCase() : "UNKNOWN",
      entity: entity ? String(entity) : "System",
      entityId: entityId ? String(entityId) : null,
      details: details ? (typeof details === "object" ? details : { info: details }) : null,
      ipAddress: ipAddress ? String(ipAddress) : null,
      userAgent: userAgent ? String(userAgent) : null,
    };

    await createAuditLog(logData);
  } catch (err) {
    // Non-blocking: log error to console so primary business operation never fails due to audit log
    console.error("Failed to record audit log:", err);
  }
};
