import paymentService from "./payments.service.js";

// ==========================================
// Create Payment
// ==========================================
export const createPayment = async (req, res) => {
  try {
    const payment = await paymentService.createPayment(req.body);

    return res.status(201).json({
      success: true,
      message: "Payment created successfully.",
      data: payment,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Get All Payments
// ==========================================
export const getPayments = async (req, res) => {
  try {
    const payments = await paymentService.getPayments();

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Get Payment By ID
// ==========================================
export const getPaymentById = async (req, res) => {
  try {
    const payment = await paymentService.getPaymentById(req.params.id);

    return res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Update Payment
// ==========================================
export const updatePayment = async (req, res) => {
  try {
    const payment = await paymentService.updatePayment(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Payment updated successfully.",
      data: payment,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Delete Payment
// ==========================================
export const deletePayment = async (req, res) => {
  try {
    await paymentService.deletePayment(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Payment deleted successfully.",
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Update Payment Status
// ==========================================
export const updatePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const payment = await paymentService.updateStatus(
      req.params.id,
      status
    );

    return res.status(200).json({
      success: true,
      message: "Payment status updated successfully.",
      data: payment,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Get Customer Payments
// ==========================================
export const getCustomerPayments = async (req, res) => {
  try {
    const payments = await paymentService.getCustomerPayments(
      req.params.customerId
    );

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Get Supplier Payments
// ==========================================
export const getSupplierPayments = async (req, res) => {
  try {
    const payments = await paymentService.getSupplierPayments(
      req.params.supplierId
    );

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Get Invoice Payments
// ==========================================
export const getInvoicePayments = async (req, res) => {
  try {
    const payments = await paymentService.getInvoicePayments(
      req.params.invoiceId
    );

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Get Purchase Order Payments
// ==========================================
export const getPurchaseOrderPayments = async (req, res) => {
  try {
    const payments =
      await paymentService.getPurchaseOrderPayments(
        req.params.purchaseOrderId
      );

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Get Payments By Status
// ==========================================
export const getPaymentsByStatus = async (req, res) => {
  try {
    const payments = await paymentService.getPaymentsByStatus(
      req.params.status
    );

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
