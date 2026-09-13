import prisma from "../../config/prisma.js";

export const createAuditLog = async (data) => {
  return await prisma.auditLog.create({
    data,
  });
};


const buildWhereClause = ({ search, action, entity, userId, startDate, endDate, matchingUserIds = [] }) => {
  const where = {};

  if (action && action.trim() !== "" && action !== "ALL") {
    where.action = { equals: action.trim(), mode: "insensitive" };
  }

  if (entity && entity.trim() !== "" && entity !== "ALL") {
    where.entity = { equals: entity.trim(), mode: "insensitive" };
  }

  if (userId && userId.trim() !== "") {
    where.userId = userId;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate);
    }
  }

  if (search && search.trim() !== "") {
    const s = search.trim();
    const searchConditions = [
      { userName: { contains: s, mode: "insensitive" } },
      { userEmail: { contains: s, mode: "insensitive" } },
      { action: { contains: s, mode: "insensitive" } },
      { entity: { contains: s, mode: "insensitive" } },
      { entityId: { contains: s, mode: "insensitive" } },
      { details: { path: ["fullName"], string_contains: s } },
      { details: { path: ["email"], string_contains: s } },
      { details: { path: ["employeeId"], string_contains: s } },
      { details: { path: ["description"], string_contains: s } },
    ];

    if (matchingUserIds.length > 0) {
      searchConditions.push({ userId: { in: matchingUserIds } });
      searchConditions.push({ entityId: { in: matchingUserIds } });
    }

    where.OR = searchConditions;
  }

  return where;
};

export const findAuditLogs = async ({ search, action, entity, userId, startDate, endDate, skip = 0, take = 20 }) => {
  let matchingUserIds = [];
  if (search && search.trim() !== "") {
    const s = search.trim();
    try {
      const matchedUsers = await prisma.user.findMany({
        where: {
          OR: [
            { fullName: { contains: s, mode: "insensitive" } },
            { email: { contains: s, mode: "insensitive" } },
            { employeeId: { contains: s, mode: "insensitive" } },
            { phone: { contains: s, mode: "insensitive" } },
          ],
        },
        select: { id: true, employeeId: true },
      });
      matchingUserIds = matchedUsers.flatMap((u) => [u.id, u.employeeId].filter(Boolean));
    } catch (err) {
      // Fallback if user lookup fails
      console.error("Error looking up matching users for search:", err.message);
    }
  }

  const where = buildWhereClause({ search, action, entity, userId, startDate, endDate, matchingUserIds });

  return await prisma.auditLog.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    skip: Number(skip),
    take: Number(take),
  });
};

export const countAuditLogs = async ({ search, action, entity, userId, startDate, endDate }) => {
  let matchingUserIds = [];
  if (search && search.trim() !== "") {
    const s = search.trim();
    try {
      const matchedUsers = await prisma.user.findMany({
        where: {
          OR: [
            { fullName: { contains: s, mode: "insensitive" } },
            { email: { contains: s, mode: "insensitive" } },
            { employeeId: { contains: s, mode: "insensitive" } },
            { phone: { contains: s, mode: "insensitive" } },
          ],
        },
        select: { id: true, employeeId: true },
      });
      matchingUserIds = matchedUsers.flatMap((u) => [u.id, u.employeeId].filter(Boolean));
    } catch (err) {
      console.error("Error looking up matching users for count:", err.message);
    }
  }

  const where = buildWhereClause({ search, action, entity, userId, startDate, endDate, matchingUserIds });
  return await prisma.auditLog.count({ where });
};

export const findAuditLogById = async (id) => {
  return await prisma.auditLog.findUnique({
    where: { id },
  });
};

export const deleteAuditLog = async (id) => {
  return await prisma.auditLog.delete({
    where: { id },
  });
};
