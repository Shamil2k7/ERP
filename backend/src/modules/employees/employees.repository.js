import prisma from "../../config/prisma.js";

/**
 * Get all employees
 */
const getAllEmployees = async (companyId, type) => {
  const where = {};
  if (companyId && companyId !== "ALL" && companyId !== "undefined" && companyId !== "null" && String(companyId).trim() !== "") {
    where.companyId = companyId;
  }
  if (type && type !== "ALL" && type !== "undefined" && type !== "null" && String(type).trim() !== "") {
    where.type = type;
  }

  return await prisma.user.findMany({
    where,
    include: {
      roleRef: true,
      branch: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

/**
 * Get employee by ID
 */
const getEmployeeById = async (id) => {
  return await prisma.user.findUnique({
    where: {
      id,
    },
    include: {
      roleRef: true,
      branch: true,
    },
  });
};

/**
 * Find employee by email
 */
const findEmployeeByEmail = async (email) => {
  return await prisma.user.findUnique({
    where: {
      email: email.toLowerCase().trim(),
    },
  });
};

/**
 * Find employee by employee ID
 */
const findEmployeeByEmployeeId = async (employeeId) => {
  return await prisma.user.findUnique({
    where: {
      employeeId: employeeId.trim(),
    },
  });
};

/**
 * Find employee by phone
 */
const findEmployeeByPhone = async (phone) => {
  return await prisma.user.findUnique({
    where: {
      phone: phone.trim(),
    },
  });
};

/**
 * Find role by role ID
 */
const findRoleById = async (roleId) => {
  return await prisma.role.findUnique({
    where: {
      id: roleId,
    },
  });
};

/**
 * Find role by role name
 *
 * Do NOT create a role automatically here.
 * Roles should be created/managed separately by admin/system setup.
 */
const findRoleByName = async (roleName) => {
  return await prisma.role.findFirst({
    where: {
      name: {
        equals: roleName.trim(),
        mode: "insensitive",
      },
    },
  });
};

/**
 * Create employee
 */
const createEmployee = async (data) => {
  return await prisma.user.create({
    data,
    include: {
      roleRef: true,
      branch: true,
    },
  });
};

/**
 * Update employee
 */
const updateEmployee = async (id, data) => {
  return await prisma.user.update({
    where: {
      id,
    },
    data,
    include: {
      roleRef: true,
      branch: true,
    },
  });
};

/**
 * Delete employee
 */
const deleteEmployee = async (id) => {
  return await prisma.user.delete({
    where: {
      id,
    },
  });
};

/**
 * Create role in database
 */
const createRoleInRepo = async (roleName) => {
  const cleanName = roleName.trim();
  let role = await prisma.role.findFirst({
    where: {
      name: { equals: cleanName, mode: "insensitive" },
    },
  });

  if (!role) {
    try {
      role = await prisma.role.upsert({
        where: { name: cleanName },
        update: {},
        create: { name: cleanName },
      });
    } catch (e) {
      role = await prisma.role.findFirst({
        where: {
          name: { equals: cleanName, mode: "insensitive" },
        },
      });
    }
  }

  return role;
};

export {
  getAllEmployees,
  getEmployeeById,
  findEmployeeByEmail,
  findEmployeeByEmployeeId,
  findEmployeeByPhone,
  findRoleById,
  findRoleByName,
  createRoleInRepo,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};