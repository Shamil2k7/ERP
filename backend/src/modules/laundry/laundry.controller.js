import * as laundryService from "./laundry.service.js";

// ==========================================
// LAUNDRY PROFILES CONTROLLER
// ==========================================

export const createLaundryController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const laundry = await laundryService.createLaundryService(companyId, req.body);
    return res.status(201).json({ success: true, message: "Laundry profile created successfully", data: laundry });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const getLaundriesController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const laundries = await laundryService.getLaundriesService(companyId);
    return res.status(200).json({ success: true, data: laundries });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getLaundryByIdController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const laundry = await laundryService.getLaundryByIdService(companyId, req.params.id);
    return res.status(200).json({ success: true, data: laundry });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message });
  }
};

export const updateLaundryController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const laundry = await laundryService.updateLaundryService(companyId, req.params.id, req.body);
    return res.status(200).json({ success: true, message: "Laundry profile updated successfully", data: laundry });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteLaundryController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    await laundryService.deleteLaundryService(companyId, req.params.id);
    return res.status(200).json({ success: true, message: "Laundry profile deleted successfully" });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// ==========================================
// LAUNDRY SERVICE CATEGORIES CONTROLLER
// ==========================================

export const createCategoryController = async (req, res) => {
  try {
    const category = await laundryService.createCategoryService(req.body);
    return res.status(201).json({ success: true, message: "Service category created successfully", data: category });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const getCategoriesController = async (req, res) => {
  try {
    const categories = await laundryService.getCategoriesService(req.query.laundryId);
    return res.status(200).json({ success: true, data: categories });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getCategoryByIdController = async (req, res) => {
  try {
    const category = await laundryService.getCategoryByIdService(req.params.id);
    return res.status(200).json({ success: true, data: category });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message });
  }
};

export const updateCategoryController = async (req, res) => {
  try {
    const category = await laundryService.updateCategoryService(req.params.id, req.body);
    return res.status(200).json({ success: true, message: "Service category updated successfully", data: category });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteCategoryController = async (req, res) => {
  try {
    await laundryService.deleteCategoryService(req.params.id);
    return res.status(200).json({ success: true, message: "Service category deleted successfully" });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// ==========================================
// LAUNDRY SERVICES CONTROLLER
// ==========================================

export const createServiceController = async (req, res) => {
  try {
    const service = await laundryService.createServiceService(req.body);
    return res.status(201).json({ success: true, message: "Laundry service created successfully", data: service });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const getServicesController = async (req, res) => {
  try {
    const services = await laundryService.getServicesService(req.query.laundryId, req.query);
    return res.status(200).json({ success: true, data: services });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getServiceByIdController = async (req, res) => {
  try {
    const service = await laundryService.getServiceByIdService(req.params.id);
    return res.status(200).json({ success: true, data: service });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message });
  }
};

export const updateServiceController = async (req, res) => {
  try {
    const service = await laundryService.updateServiceService(req.params.id, req.body);
    return res.status(200).json({ success: true, message: "Laundry service updated successfully", data: service });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteServiceController = async (req, res) => {
  try {
    await laundryService.deleteServiceService(req.params.id);
    return res.status(200).json({ success: true, message: "Laundry service deleted successfully" });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// ==========================================
// LAUNDRY ORDERS CONTROLLER
// ==========================================

export const createOrderController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const orderPayload = {
      ...req.body,
      createdBy: req.user?.fullName || req.user?.email || "SYSTEM",
    };
    const order = await laundryService.createOrderService(companyId, orderPayload);
    return res.status(201).json({ success: true, message: "Laundry order created successfully", data: order });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const getOrdersController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const orders = await laundryService.getOrdersService(companyId, req.query);
    return res.status(200).json({ success: true, data: orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getOrderByIdController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const order = await laundryService.getOrderByIdService(companyId, req.params.id);
    return res.status(200).json({ success: true, data: order });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message });
  }
};

export const updateOrderStatusController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const updatePayload = {
      status: req.body.status,
      notes: req.body.notes,
      changedBy: req.user?.fullName || req.user?.email || "SYSTEM",
    };
    const order = await laundryService.updateOrderStatusService(companyId, req.params.id, updatePayload);
    return res.status(200).json({ success: true, message: "Order status updated successfully", data: order });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// ==========================================
// LAUNDRY GARMENTS CONTROLLER
// ==========================================

export const getGarmentByBarcodeController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const garment = await laundryService.getGarmentByBarcodeService(companyId, req.params.barcode);
    return res.status(200).json({ success: true, data: garment });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message });
  }
};

export const updateGarmentStatusController = async (req, res) => {
  try {
    const garment = await laundryService.updateGarmentStatusService(req.params.id, req.body.status);
    return res.status(200).json({ success: true, message: "Garment status updated successfully", data: garment });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const getGarmentsController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const garments = await laundryService.getGarmentsService(companyId, req.query);
    return res.status(200).json({ success: true, data: garments });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const createGarmentController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const garment = await laundryService.createGarmentService(companyId, req.body);
    return res.status(201).json({ success: true, message: "Garment registered successfully", data: garment });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// ==========================================
// LAUNDRY DELIVERIES CONTROLLER
// ==========================================

export const getDeliveriesController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const result = await laundryService.getDeliveriesService(companyId, req.query);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const updateDeliveryStatusController = async (req, res) => {
  try {
    const delivery = await laundryService.updateDeliveryStatusService(req.params.orderId, req.body);
    return res.status(200).json({ success: true, message: "Delivery status updated successfully", data: delivery });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// ==========================================
// LAUNDRY DASHBOARD/STATS CONTROLLER
// ==========================================

export const getLaundryStatsController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const stats = await laundryService.getLaundryStatsService(companyId, req.query.laundryId);
    return res.status(200).json({ success: true, data: stats });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getLaundryReportsController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const reports = await laundryService.getLaundryReportsService(companyId, req.query.laundryId);
    return res.status(200).json({ success: true, data: reports });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
