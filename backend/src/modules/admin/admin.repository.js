import prisma from "../../config/prisma.js";

// Check email already exists
export const findUserByEmail = async (email) => {
  return await prisma.user.findUnique({
    where: {
      email,
    },
  });
};

// Check phone already exists
export const findUserByPhone = async (phone) => {
  return await prisma.user.findUnique({
    where: {
      phone,
    },
  });
};

// Find or create ADMIN role
export const findAdminRole = async () => {
  // 1. Exact or case-insensitive match
  let role = await prisma.role.findFirst({
    where: {
      name: { equals: "ADMIN", mode: "insensitive" },
    },
  });
  if (role) return role;

  // 2. Contains "ADMIN" match
  role = await prisma.role.findFirst({
    where: {
      name: { contains: "ADMIN", mode: "insensitive" },
    },
  });
  if (role) return role;

  // 3. Safe upsert
  try {
    role = await prisma.role.upsert({
      where: { name: "ADMIN" },
      update: {},
      create: { name: "ADMIN", category: "RETAIL" },
    });
    if (role) return role;
  } catch (err) {
    role = await prisma.role.findFirst({
      where: { name: { equals: "ADMIN", mode: "insensitive" } },
    });
    if (role) return role;
  }

  // 4. Return any first existing role
  return await prisma.role.findFirst();
};

// Create admin
export const createAdmin = async (data) => {
  return await prisma.user.create({
    data,
    include: {
      roleRef: true,
      company: {
        include: {
          industry: true,
          modules: { include: { module: true } },
        },
      },
    },
  });
};

// Get all admins
export const getAllAdmins = async () => {
  return await prisma.user.findMany({
    where: {
      role: "ADMIN",
    },
    include: {
      roleRef: true,
      company: {
        include: {
          industry: true,
          modules: { include: { module: true } },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

// Get admin by ID
export const getAdminById = async (id) => {
  return await prisma.user.findFirst({
    where: {
      id,
      role: "ADMIN",
    },
    include: {
      roleRef: true,
    },
  });
};

// Delete admin
export const deleteAdmin = async (id) => {
  return await prisma.user.delete({
    where: {
      id,
    },
  });
};