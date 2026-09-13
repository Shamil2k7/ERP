import prisma from "../../config/prisma.js";

// Login
const findUserByLogin = async (login) => {
  const cleanLogin = (login || "").trim();
  return await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: cleanLogin, mode: "insensitive" } },
        { employeeId: { equals: cleanLogin, mode: "insensitive" } },
        { phone: { equals: cleanLogin, mode: "insensitive" } },
      ],
    },

    include: {
      roleRef: true,
      branch: true,
      company: {
        include: {
          industry: true,
          modules: {
            include: {
              module: true,
            },
          },
        },
      },
    },
  });
};

// Find User By Email
const findUserByEmail = async (email) => {
  return await prisma.user.findUnique({
    where: {
      email,
    },
  });
};

// Save OTP
const saveOTP = async (otpData) => {
  return await prisma.emailOTP.create({
    data: otpData,
  });
};

// Find OTP
const findOTPByEmail = async (email) => {
  return await prisma.emailOTP.findFirst({
    where: {
      email,
      isUsed: false,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

// Mark OTP Used
const markOTPAsUsed = async (id) => {
  return await prisma.emailOTP.update({
    where: {
      id,
    },
    data: {
      isUsed: true,
    },
  });
};

// Update Password
const updatePassword = async (email, passwordHash) => {
  return await prisma.user.update({
    where: {
      email,
    },
    data: {
      passwordHash,
    },
  });
};

// Update Email
const updateEmail = async (currentEmail, newEmail) => {
  return await prisma.user.update({
    where: {
      email: currentEmail,
    },
    data: {
      email: newEmail,
    },
  });
};

// Find User By Phone
const findUserByPhone = async (phone) => {
  const cleanPhone = (phone || "").trim();
  return await prisma.user.findFirst({
    where: { phone: cleanPhone },
  });
};

// Find User By Employee ID
const findUserByEmployeeId = async (employeeId) => {
  const cleanEmpId = (employeeId || "").trim();
  return await prisma.user.findFirst({
    where: { employeeId: cleanEmpId },
  });
};

// Create User
const createUser = async (userData) => {
  return await prisma.user.create({
    data: userData,
    include: {
      roleRef: true,
      branch: true,
      company: {
        include: {
          industry: true,
          modules: {
            include: { module: true },
          },
        },
      },
    },
  });
};

// Get First Active Company (fallback for initial company association)
const findFirstCompany = async () => {
  return await prisma.company.findFirst({
    where: { status: "ACTIVE" },
    include: { industry: true },
  });
};

export {
  findUserByLogin,
  findUserByEmail,
  findUserByPhone,
  findUserByEmployeeId,
  createUser,
  findFirstCompany,
  saveOTP,
  findOTPByEmail,
  markOTPAsUsed,
  updatePassword,
  updateEmail,
};