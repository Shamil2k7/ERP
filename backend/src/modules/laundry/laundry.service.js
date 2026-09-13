import * as laundryRepository from "./laundry.repository.js";

// ==========================================
// LAUNDRY PROFILES SERVICE
// ==========================================

export const createLaundryService = async (companyId, data) => {
  if (!companyId) throw new Error("Company ID is required");
  return await laundryRepository.createLaundryRepo(companyId, data);
};

export const getLaundriesService = async (companyId) => {
  return await laundryRepository.getLaundriesRepo(companyId);
};

export const getLaundryByIdService = async (companyId, id) => {
  const laundry = await laundryRepository.getLaundryByIdRepo(companyId, id);
  if (!laundry) throw new Error("Laundry profile not found");
  return laundry;
};

export const updateLaundryService = async (companyId, id, data) => {
  return await laundryRepository.updateLaundryRepo(companyId, id, data);
};

export const deleteLaundryService = async (companyId, id) => {
  return await laundryRepository.deleteLaundryRepo(companyId, id);
};

// ==========================================
// LAUNDRY SERVICE CATEGORIES SERVICE
// ==========================================

export const createCategoryService = async (data) => {
  return await laundryRepository.createCategoryRepo(data);
};

export const getCategoriesService = async (laundryId) => {
  return await laundryRepository.getCategoriesRepo(laundryId);
};

export const getCategoryByIdService = async (id) => {
  const category = await laundryRepository.getCategoryByIdRepo(id);
  if (!category) throw new Error("Category not found");
  return category;
};

export const updateCategoryService = async (id, data) => {
  return await laundryRepository.updateCategoryRepo(id, data);
};

export const deleteCategoryService = async (id) => {
  return await laundryRepository.deleteCategoryRepo(id);
};

// ==========================================
// LAUNDRY SERVICES SERVICE
// ==========================================

export const createServiceService = async (data) => {
  return await laundryRepository.createServiceRepo(data);
};

export const getServicesService = async (laundryId, filters) => {
  return await laundryRepository.getServicesRepo(laundryId, filters);
};

export const getServiceByIdService = async (id) => {
  const service = await laundryRepository.getServiceByIdRepo(id);
  if (!service) throw new Error("Service not found");
  return service;
};

export const updateServiceService = async (id, data) => {
  return await laundryRepository.updateServiceRepo(id, data);
};

export const deleteServiceService = async (id) => {
  return await laundryRepository.deleteServiceRepo(id);
};

// ==========================================
// LAUNDRY ORDERS SERVICE
// ==========================================

export const createOrderService = async (companyId, orderPayload) => {
  const { laundryId, branchId, customerId, subtotal, discountAmount, taxAmount, totalAmount, paidAmount, specialInstructions, items, payment, delivery } = orderPayload;

  const orderData = {
    laundryId,
    branchId,
    customerId,
    subtotal: parseFloat(subtotal),
    discountAmount: parseFloat(discountAmount || 0),
    taxAmount: parseFloat(taxAmount || 0),
    totalAmount: parseFloat(totalAmount),
    paidAmount: parseFloat(paidAmount || 0),
    balanceAmount: parseFloat(totalAmount) - parseFloat(paidAmount || 0),
    specialInstructions,
    status: "RECEIVED",
  };

  const parsedItems = items.map(item => ({
    serviceId: item.serviceId,
    garmentType: item.garmentType,
    quantity: parseInt(item.quantity),
    unitPrice: parseFloat(item.unitPrice),
    discountAmount: parseFloat(item.discountAmount || 0),
    taxAmount: parseFloat(item.taxAmount || 0),
    totalAmount: parseFloat(item.totalAmount),
    notes: item.notes || null,
  }));

  let paymentData = null;
  if (payment) {
    paymentData = {
      method: payment.method || "CASH",
      amount: parseFloat(payment.amount || paidAmount || 0),
      referenceNumber: payment.referenceNumber || null,
    };
  } else if (orderData.paidAmount > 0) {
    paymentData = {
      method: "CASH",
      amount: orderData.paidAmount,
    };
  }

  let deliveryData = null;
  if (delivery && delivery.deliveryAddress) {
    deliveryData = {
      deliveryAddress: delivery.deliveryAddress,
      phone: delivery.phone,
      deliveryDate: delivery.deliveryDate || null,
      deliveryNotes: delivery.deliveryNotes || null,
    };
  }

  return await laundryRepository.createOrderRepo(companyId, orderData, parsedItems, paymentData, deliveryData);
};

export const getOrdersService = async (companyId, query) => {
  return await laundryRepository.getOrdersRepo(companyId, query);
};

export const getOrderByIdService = async (companyId, id) => {
  const order = await laundryRepository.getOrderByIdRepo(companyId, id);
  if (!order) throw new Error("Laundry order not found");
  return order;
};

export const updateOrderStatusService = async (companyId, orderId, payload) => {
  return await laundryRepository.updateOrderStatusRepo(companyId, orderId, payload);
};

// ==========================================
// LAUNDRY GARMENTS SERVICE
// ==========================================

export const getGarmentByBarcodeService = async (companyId, barcode) => {
  const garment = await laundryRepository.getGarmentByBarcodeRepo(companyId, barcode);
  if (!garment) throw new Error("Garment not found with tag or barcode " + barcode);
  return garment;
};

export const updateGarmentStatusService = async (id, status) => {
  return await laundryRepository.updateGarmentStatusRepo(id, status);
};

export const getGarmentsService = async (companyId, filters) => {
  return await laundryRepository.getGarmentsRepo(companyId, filters);
};

export const createGarmentService = async (companyId, garmentData) => {
  return await laundryRepository.createGarmentRepo(companyId, garmentData);
};

// ==========================================
// LAUNDRY DELIVERIES SERVICE
// ==========================================

export const getDeliveriesService = async (companyId, filters) => {
  return await laundryRepository.getDeliveriesRepo(companyId, filters);
};

export const updateDeliveryStatusService = async (orderId, payload) => {
  return await laundryRepository.updateDeliveryStatusRepo(orderId, payload);
};

// ==========================================
// LAUNDRY DASHBOARD SERVICE
// ==========================================

export const getLaundryStatsService = async (companyId, laundryId) => {
  return await laundryRepository.getLaundryStatsRepo(companyId, laundryId);
};

export const getLaundryReportsService = async (companyId, laundryId) => {
  return await laundryRepository.getLaundryReportsRepo(companyId, laundryId);
};
