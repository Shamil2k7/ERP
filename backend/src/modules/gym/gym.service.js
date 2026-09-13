import {
  getGymMembersRepo,
  getGymMemberByIdRepo,
  createGymMemberRepo,
  updateGymMemberRepo,
  deleteGymMemberRepo,
  getGymPlansRepo,
  createGymPlanRepo,
  updateGymPlanRepo,
  deleteGymPlanRepo,
  getGymTrainersRepo,
  createGymTrainerRepo,
  updateGymTrainerRepo,
  deleteGymTrainerRepo,
  getGymAttendanceRepo,
  recordAttendanceRepo,
  updateAttendanceRepo,
  getGymPaymentsRepo,
  createGymPaymentRepo,
  getGymDashboardStatsRepo,
} from "./gym.repository.js";
import prisma from "../../config/prisma.js";
import bcrypt from "bcrypt";

const parseDate = (val) => {
  if (!val || typeof val !== "string" || !val.trim()) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

// MEMBERS
export const getGymMembersService = async (companyId, query) => {
  return await getGymMembersRepo(companyId, query);
};

export const getGymMemberByIdService = async (companyId, id) => {
  const member = await getGymMemberByIdRepo(companyId, id);
  if (!member) throw new Error("Gym member not found");
  return member;
};

import { validatePhoneNumber, cleanPhoneNumber } from "../../utils/phoneValidator.js";

export const createGymMemberService = async (companyId, data) => {
  if (!companyId) throw new Error("Company ID is required to create a member");

  const { branchId, ...restOfData } = data;

  const memberId = restOfData.memberId || `MEM-${Date.now().toString(36).toUpperCase()}`;

  // Validate that phone is standard 10-digit number
  if (!validatePhoneNumber(restOfData.phone, true)) {
    throw new Error("Phone number must contain exactly 10 digits");
  }
  restOfData.phone = cleanPhoneNumber(restOfData.phone);

  // Validate emergency phone if provided
  if (restOfData.emergencyPhone) {
    if (!validatePhoneNumber(restOfData.emergencyPhone, true)) {
      throw new Error("Emergency phone number must contain exactly 10 digits");
    }
    restOfData.emergencyPhone = cleanPhoneNumber(restOfData.emergencyPhone);
  }

  // Validate that phone is unique in User table
  if (restOfData.phone) {
    const existingUserByPhone = await prisma.user.findUnique({
      where: { phone: restOfData.phone.trim() }
    });
    if (existingUserByPhone) {
      throw new Error("Phone number is already registered to a user account");
    }
  }


  // Validate email uniqueness in User table
  const emailInput = restOfData.email ? restOfData.email.trim().toLowerCase() : null;
  const userEmail = emailInput || `member_${memberId.toLowerCase()}@fitness.com`;
  if (userEmail) {
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: userEmail }
    });
    if (existingUserByEmail) {
      throw new Error("Email is already registered to a user account");
    }
  }

  const payload = {
    ...restOfData,
    companyId,
    memberId,
    dob: parseDate(restOfData.dob),
    startDate: parseDate(restOfData.startDate) || new Date(),
    expiryDate: parseDate(restOfData.expiryDate) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    membershipPlanId: restOfData.membershipPlanId || null,
    assignedTrainerId: restOfData.assignedTrainerId || null,
  };

  const member = await createGymMemberRepo(payload);

  // Hash phone number to use as default password
  const defaultPassword = member.phone;
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // Create corresponding user account
  await prisma.user.create({
    data: {
      fullName: member.fullName,
      email: userEmail,
      phone: member.phone,
      employeeId: member.memberId,
      passwordHash,
      plainPassword: defaultPassword,
      isVerified: true,
      role: "MEMBER",
      type: "GYM",
      companyId,
      branchId: branchId || null,
    }
  });

  return member;
};

export const updateGymMemberService = async (companyId, id, data) => {
  const existingMember = await getGymMemberByIdRepo(companyId, id);
  if (!existingMember) {
    throw new Error("Gym member not found");
  }

  if (restOfData.phone !== undefined) {
    if (!validatePhoneNumber(restOfData.phone, true)) {
      throw new Error("Phone number must contain exactly 10 digits");
    }
    restOfData.phone = cleanPhoneNumber(restOfData.phone);
  }

  if (restOfData.emergencyPhone !== undefined) {
    if (!validatePhoneNumber(restOfData.emergencyPhone, false)) {
      throw new Error("Emergency phone number must contain exactly 10 digits");
    }
    restOfData.emergencyPhone = cleanPhoneNumber(restOfData.emergencyPhone);
  }

  const payload = { ...restOfData };
  if (restOfData.dob !== undefined) payload.dob = parseDate(restOfData.dob);
  if (restOfData.startDate !== undefined) payload.startDate = parseDate(restOfData.startDate) || new Date();
  if (restOfData.expiryDate !== undefined) payload.expiryDate = parseDate(restOfData.expiryDate) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  if (restOfData.membershipPlanId !== undefined) payload.membershipPlanId = restOfData.membershipPlanId || null;
  if (restOfData.assignedTrainerId !== undefined) payload.assignedTrainerId = restOfData.assignedTrainerId || null;

  const updatedMember = await updateGymMemberRepo(id, companyId, payload);


  const emailInput = updatedMember.email ? updatedMember.email.trim().toLowerCase() : null;
  const userEmail = emailInput || `member_${updatedMember.memberId.toLowerCase()}@fitness.com`;

  // Find corresponding User by employeeId (linked via memberId)
  const existingUser = await prisma.user.findUnique({
    where: { employeeId: existingMember.memberId }
  });

  if (existingUser) {
    // Validate unique constraints for phone/email changes
    if (updatedMember.phone !== existingUser.phone) {
      const phoneConflict = await prisma.user.findFirst({
        where: { phone: updatedMember.phone, id: { not: existingUser.id } }
      });
      if (phoneConflict) {
        throw new Error("Phone number is already registered to another user account");
      }
    }
    if (userEmail !== existingUser.email) {
      const emailConflict = await prisma.user.findFirst({
        where: { email: userEmail, id: { not: existingUser.id } }
      });
      if (emailConflict) {
        throw new Error("Email is already registered to another user account");
      }
    }

    const userUpdateData = {
      fullName: updatedMember.fullName,
      email: userEmail,
      phone: updatedMember.phone,
    };
    if (branchId !== undefined) {
      userUpdateData.branchId = branchId || null;
    }

    await prisma.user.update({
      where: { id: existingUser.id },
      data: userUpdateData
    });
  } else {
    // Legacy member self-healing: create the user account now
    if (updatedMember.phone) {
      const phoneConflict = await prisma.user.findUnique({
        where: { phone: updatedMember.phone }
      });
      if (phoneConflict) {
        throw new Error("Phone number is already registered to a user account");
      }
    }
    if (userEmail) {
      const emailConflict = await prisma.user.findUnique({
        where: { email: userEmail }
      });
      if (emailConflict) {
        throw new Error("Email is already registered to a user account");
      }
    }

    const defaultPassword = updatedMember.phone;
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    await prisma.user.create({
      data: {
        fullName: updatedMember.fullName,
        email: userEmail,
        phone: updatedMember.phone,
        employeeId: updatedMember.memberId,
        passwordHash,
        plainPassword: defaultPassword,
        isVerified: true,
        role: "MEMBER",
        type: "GYM",
        companyId,
        branchId: branchId || null,
      }
    });
  }

  return updatedMember;
};

export const deleteGymMemberService = async (companyId, id) => {
  const existingMember = await getGymMemberByIdRepo(companyId, id);
  if (!existingMember) {
    throw new Error("Gym member not found");
  }

  const result = await deleteGymMemberRepo(id, companyId);

  // Delete the corresponding user if exists
  await prisma.user.deleteMany({
    where: { employeeId: existingMember.memberId }
  });

  return result;
};

// PLANS
export const getGymPlansService = async (companyId) => {
  return await getGymPlansRepo(companyId);
};

export const createGymPlanService = async (companyId, data) => {
  if (!companyId) throw new Error("Company ID is required");
  const { durationMonths, ...restData } = data;
  return await createGymPlanRepo({
    ...restData,
    companyId,
    duration: Number(restData.duration || 1),
    price: Number(restData.price || 0),
    joiningFee: Number(restData.joiningFee || 0),
  });
};

export const updateGymPlanService = async (companyId, id, data) => {
  const { durationMonths, ...restData } = data;
  const payload = { ...restData };
  if (restData.duration !== undefined) payload.duration = Number(restData.duration);
  if (restData.price !== undefined) payload.price = Number(restData.price);
  if (restData.joiningFee !== undefined) payload.joiningFee = Number(restData.joiningFee);
  return await updateGymPlanRepo(id, companyId, payload);
};

export const deleteGymPlanService = async (companyId, id) => {
  return await deleteGymPlanRepo(id, companyId);
};

// TRAINERS
export const getGymTrainersService = async (companyId) => {
  return await getGymTrainersRepo(companyId);
};

export const createGymTrainerService = async (companyId, data) => {
  if (!companyId) throw new Error("Company ID is required");
  if (!validatePhoneNumber(data.phone, true)) {
    throw new Error("Phone number must contain exactly 10 digits");
  }
  const trainerId = data.trainerId || `TRN-${Date.now().toString(36).toUpperCase()}`;
  return await createGymTrainerRepo({
    ...data,
    phone: cleanPhoneNumber(data.phone),
    companyId,
    trainerId,
    salary: data.salary ? Number(data.salary) : null,
  });
};

export const updateGymTrainerService = async (companyId, id, data) => {
  const payload = { ...data };
  if (data.phone !== undefined) {
    if (!validatePhoneNumber(data.phone, true)) {
      throw new Error("Phone number must contain exactly 10 digits");
    }
    payload.phone = cleanPhoneNumber(data.phone);
  }
  if (data.salary !== undefined) payload.salary = data.salary ? Number(data.salary) : null;
  return await updateGymTrainerRepo(id, companyId, payload);
};


export const deleteGymTrainerService = async (companyId, id) => {
  return await deleteGymTrainerRepo(id, companyId);
};

// ATTENDANCE
export const getGymAttendanceService = async (companyId, query) => {
  return await getGymAttendanceRepo(companyId, query);
};

export const recordAttendanceService = async (companyId, data) => {
  if (!companyId) throw new Error("Company ID is required");
  return await recordAttendanceRepo({
    ...data,
    companyId,
    date: parseDate(data.date) || new Date(),
  });
};

export const updateAttendanceService = async (companyId, id, data) => {
  const payload = { ...data };
  if (data.date !== undefined) payload.date = parseDate(data.date) || new Date();
  return await updateAttendanceRepo(id, companyId, payload);
};

// PAYMENTS
export const getGymPaymentsService = async (companyId, query) => {
  return await getGymPaymentsRepo(companyId, query);
};

export const createGymPaymentService = async (companyId, data) => {
  if (!companyId) throw new Error("Company ID is required");

  const paymentNumber = data.paymentNumber || `REC-${Date.now().toString(36).toUpperCase()}`;
  const receiptNumber = data.receiptNumber || `RCPT-${Math.floor(100000 + Math.random() * 900000)}`;

  const total = Number(data.totalAmount || 0);
  const paid = Number(data.paidAmount || 0);
  const pending = Math.max(0, total - paid);

  let status = "PAID";
  if (paid === 0) status = "PENDING";
  else if (pending > 0) status = "PARTIALLY_PAID";

  return await createGymPaymentRepo({
    ...data,
    companyId,
    paymentNumber,
    receiptNumber,
    paymentDate: parseDate(data.paymentDate) || new Date(),
    totalAmount: total,
    paidAmount: paid,
    pendingAmount: pending,
    status,
  });
};

// DASHBOARD STATS
export const getGymDashboardStatsService = async (companyId) => {
  return await getGymDashboardStatsRepo(companyId);
};
