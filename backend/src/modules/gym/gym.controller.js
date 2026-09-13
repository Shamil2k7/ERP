import {
  getGymMembersService,
  getGymMemberByIdService,
  createGymMemberService,
  updateGymMemberService,
  deleteGymMemberService,
  getGymPlansService,
  createGymPlanService,
  updateGymPlanService,
  deleteGymPlanService,
  getGymTrainersService,
  createGymTrainerService,
  updateGymTrainerService,
  deleteGymTrainerService,
  getGymAttendanceService,
  recordAttendanceService,
  updateAttendanceService,
  getGymPaymentsService,
  createGymPaymentService,
  getGymDashboardStatsService,
} from "./gym.service.js";

// MEMBERS
export const getGymMembersController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const members = await getGymMembersService(companyId, req.query);
    return res.status(200).json({ success: true, data: members });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getGymMemberByIdController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const member = await getGymMemberByIdService(companyId, req.params.id);
    return res.status(200).json({ success: true, data: member });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message });
  }
};

export const createGymMemberController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const member = await createGymMemberService(companyId, req.body);
    return res.status(201).json({ success: true, message: "Member created successfully", data: member });
  } catch (err) {
    console.error("Error in createGymMemberController:", err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const updateGymMemberController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const member = await updateGymMemberService(companyId, req.params.id, req.body);
    return res.status(200).json({ success: true, message: "Member updated successfully", data: member });
  } catch (err) {
    console.error("Error in updateGymMemberController:", err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteGymMemberController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    await deleteGymMemberService(companyId, req.params.id);
    return res.status(200).json({ success: true, message: "Member deleted successfully" });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// PLANS
export const getGymPlansController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const plans = await getGymPlansService(companyId);
    return res.status(200).json({ success: true, data: plans });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createGymPlanController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const plan = await createGymPlanService(companyId, req.body);
    return res.status(201).json({ success: true, message: "Membership plan created", data: plan });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const updateGymPlanController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const plan = await updateGymPlanService(companyId, req.params.id, req.body);
    return res.status(200).json({ success: true, message: "Plan updated", data: plan });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteGymPlanController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    await deleteGymPlanService(companyId, req.params.id);
    return res.status(200).json({ success: true, message: "Plan deleted" });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// TRAINERS
export const getGymTrainersController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const trainers = await getGymTrainersService(companyId);
    return res.status(200).json({ success: true, data: trainers });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createGymTrainerController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const trainer = await createGymTrainerService(companyId, req.body);
    return res.status(201).json({ success: true, message: "Trainer created", data: trainer });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const updateGymTrainerController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const trainer = await updateGymTrainerService(companyId, req.params.id, req.body);
    return res.status(200).json({ success: true, message: "Trainer updated", data: trainer });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteGymTrainerController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    await deleteGymTrainerService(companyId, req.params.id);
    return res.status(200).json({ success: true, message: "Trainer deleted" });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// ATTENDANCE
export const getGymAttendanceController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const attendance = await getGymAttendanceService(companyId, req.query);
    return res.status(200).json({ success: true, data: attendance });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const recordAttendanceController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const attendance = await recordAttendanceService(companyId, req.body);
    return res.status(201).json({ success: true, message: "Attendance recorded", data: attendance });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const updateAttendanceController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const attendance = await updateAttendanceService(companyId, req.params.id, req.body);
    return res.status(200).json({ success: true, message: "Attendance updated", data: attendance });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// PAYMENTS
export const getGymPaymentsController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const payments = await getGymPaymentsService(companyId, req.query);
    return res.status(200).json({ success: true, data: payments });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createGymPaymentController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const payment = await createGymPaymentService(companyId, req.body);
    return res.status(201).json({ success: true, message: "Payment recorded", data: payment });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// DASHBOARD STATS
export const getGymDashboardStatsController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const stats = await getGymDashboardStatsService(companyId);
    return res.status(200).json({ success: true, data: stats });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
