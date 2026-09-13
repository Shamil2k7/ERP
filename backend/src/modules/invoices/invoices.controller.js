import invoiceService from "./invoices.service.js";

// ==========================================
// Create Invoice
// ==========================================
export const createInvoice = async (req, res) => {
  try {
    const invoice = await invoiceService.createInvoice(req.body);

    return res.status(201).json({
      success: true,
      message: "Invoice created successfully.",
      data: invoice,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Get All Invoices
// ==========================================
export const getInvoices = async (req, res) => {
  try {
    const invoices = await invoiceService.getInvoices();

    return res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Get Invoice By ID
// ==========================================
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id);

    return res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Update Invoice
// ==========================================
export const updateInvoice = async (req, res) => {
  try {
    const invoice = await invoiceService.updateInvoice(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Invoice updated successfully.",
      data: invoice,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Delete Invoice
// ==========================================
export const deleteInvoice = async (req, res) => {
  try {
    await invoiceService.deleteInvoice(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Invoice deleted successfully.",
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Update Invoice Status
// ==========================================
export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const invoice = await invoiceService.updateStatus(
      req.params.id,
      status
    );

    return res.status(200).json({
      success: true,
      message: "Invoice status updated successfully.",
      data: invoice,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Get Customer Invoices
// ==========================================
export const getCustomerInvoices = async (req, res) => {
  try {
    const invoices = await invoiceService.getCustomerInvoices(
      req.params.customerId
    );

    return res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Get By Payment Status
// ==========================================
export const getPaymentStatus = async (req, res) => {
  try {
    const invoices = await invoiceService.getPaymentStatus(
      req.params.status
    );

    return res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};