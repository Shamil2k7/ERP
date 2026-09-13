import prisma from "../../config/prisma.js";

// ==========================================
// GYM MEMBERS REPOSITORY
// ==========================================
export const getGymMembersRepo = async (companyId, { search, status, planId }) => {
  const where = {};
  if (companyId) {
    where.companyId = companyId;
  }

  if (status) {
    where.status = status.toUpperCase();
  }

  if (planId) {
    where.membershipPlanId = planId;
  }

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { memberId: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  return await prisma.gymMember.findMany({
    where,
    include: {
      plan: true,
      trainer: true,
      payments: { orderBy: { paymentDate: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getGymMemberByIdRepo = async (companyId, id) => {
  const where = { id };
  if (companyId) where.companyId = companyId;

  return await prisma.gymMember.findFirst({
    where,
    include: {
      plan: true,
      trainer: true,
      attendances: { orderBy: { date: "desc" }, take: 10 },
      payments: { orderBy: { paymentDate: "desc" } },
    },
  });
};

export const createGymMemberRepo = async (data) => {
  return await prisma.gymMember.create({
    data,
    include: {
      plan: true,
      trainer: true,
    },
  });
};

export const updateGymMemberRepo = async (id, companyId, data) => {
  const where = { id };
  if (companyId) where.companyId = companyId;

  return await prisma.gymMember.update({
    where,
    data,
    include: {
      plan: true,
      trainer: true,
    },
  });
};

export const deleteGymMemberRepo = async (id, companyId) => {
  const where = { id };
  if (companyId) where.companyId = companyId;

  return await prisma.gymMember.delete({
    where,
  });
};

// ==========================================
// MEMBERSHIP PLANS REPOSITORY
// ==========================================
export const getGymPlansRepo = async (companyId) => {
  const where = {};
  if (companyId) where.companyId = companyId;

  return await prisma.gymMembershipPlan.findMany({
    where,
    include: {
      _count: { select: { members: true } },
    },
    orderBy: { price: "asc" },
  });
};

export const createGymPlanRepo = async (data) => {
  return await prisma.gymMembershipPlan.create({ data });
};

export const updateGymPlanRepo = async (id, companyId, data) => {
  const where = { id };
  if (companyId) where.companyId = companyId;

  return await prisma.gymMembershipPlan.update({
    where,
    data,
  });
};

export const deleteGymPlanRepo = async (id, companyId) => {
  const where = { id };
  if (companyId) where.companyId = companyId;

  return await prisma.gymMembershipPlan.delete({ where });
};

// ==========================================
// GYM TRAINERS REPOSITORY
// ==========================================
export const getGymTrainersRepo = async (companyId) => {
  const where = {};
  if (companyId) where.companyId = companyId;

  return await prisma.gymTrainer.findMany({
    where,
    include: {
      assignedMembers: {
        select: { id: true, fullName: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const createGymTrainerRepo = async (data) => {
  return await prisma.gymTrainer.create({ data });
};

export const updateGymTrainerRepo = async (id, companyId, data) => {
  const where = { id };
  if (companyId) where.companyId = companyId;

  return await prisma.gymTrainer.update({ where, data });
};

export const deleteGymTrainerRepo = async (id, companyId) => {
  const where = { id };
  if (companyId) where.companyId = companyId;

  return await prisma.gymTrainer.delete({ where });
};

// ==========================================
// GYM ATTENDANCE REPOSITORY
// ==========================================
export const getGymAttendanceRepo = async (companyId, { date }) => {
  const where = {};
  if (companyId) where.companyId = companyId;

  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    where.date = { gte: start, lte: end };
  }

  return await prisma.gymAttendance.findMany({
    where,
    include: {
      member: {
        select: { id: true, memberId: true, fullName: true, phone: true, photo: true },
      },
    },
    orderBy: { date: "desc" },
  });
};

export const recordAttendanceRepo = async (data) => {
  return await prisma.gymAttendance.create({
    data,
    include: {
      member: {
        select: { id: true, memberId: true, fullName: true },
      },
    },
  });
};

export const updateAttendanceRepo = async (id, companyId, data) => {
  const where = { id };
  if (companyId) where.companyId = companyId;

  return await prisma.gymAttendance.update({ where, data });
};

// ==========================================
// GYM PAYMENTS REPOSITORY
// ==========================================
export const getGymPaymentsRepo = async (companyId, { status }) => {
  const where = {};
  if (companyId) where.companyId = companyId;

  if (status) {
    where.status = status.toUpperCase();
  }

  return await prisma.gymPayment.findMany({
    where,
    include: {
      member: { select: { id: true, memberId: true, fullName: true, phone: true } },
      plan: { select: { id: true, name: true } },
    },
    orderBy: { paymentDate: "desc" },
  });
};

export const createGymPaymentRepo = async (data) => {
  return await prisma.gymPayment.create({
    data,
    include: {
      member: true,
      plan: true,
    },
  });
};

// ==========================================
// GYM DASHBOARD STATS REPOSITORY
// ==========================================
export const getGymDashboardStatsRepo = async (companyId) => {
  const whereCompany = companyId ? { companyId } : {};

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const totalMembers = await prisma.gymMember.count({ where: whereCompany });

  const activeMembers = await prisma.gymMember.count({
    where: { ...whereCompany, status: "ACTIVE" },
  });

  const newMembersToday = await prisma.gymMember.count({
    where: { ...whereCompany, createdAt: { gte: todayStart, lte: todayEnd } },
  });

  const expiringSoon = await prisma.gymMember.count({
    where: {
      ...whereCompany,
      status: "ACTIVE",
      expiryDate: { gte: new Date(), lte: sevenDaysFromNow },
    },
  });

  const todayAttendanceCount = await prisma.gymAttendance.count({
    where: { ...whereCompany, date: { gte: todayStart, lte: todayEnd } },
  });

  const presentCount = await prisma.gymAttendance.count({
    where: {
      ...whereCompany,
      status: "PRESENT",
      date: { gte: todayStart, lte: todayEnd },
    },
  });

  const absentCount = await prisma.gymAttendance.count({
    where: {
      ...whereCompany,
      status: "ABSENT",
      date: { gte: todayStart, lte: todayEnd },
    },
  });

  const totalTrainers = await prisma.gymTrainer.count({ where: whereCompany });

  const payments = await prisma.gymPayment.findMany({
    where: whereCompany,
    select: { paidAmount: true, pendingAmount: true, status: true },
  });

  let monthlyRevenue = 0;
  let pendingPayments = 0;

  payments.forEach((p) => {
    monthlyRevenue += Number(p.paidAmount || 0);
    pendingPayments += Number(p.pendingAmount || 0);
  });

  const recentMembers = await prisma.gymMember.findMany({
    where: whereCompany,
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { plan: true },
  });

  const trainers = await prisma.gymTrainer.findMany({
    where: whereCompany,
    take: 5,
    include: { _count: { select: { assignedMembers: true } } },
  });

  return {
    cards: {
      totalMembers,
      activeMembers,
      newMembersToday,
      expiringSoon,
      todayAttendance: todayAttendanceCount,
      presentMembers: presentCount,
      absentMembers: absentCount,
      monthlyRevenue,
      pendingPayments,
      totalTrainers,
    },
    sections: {
      recentMembers,
      trainers,
    },
  };
};
