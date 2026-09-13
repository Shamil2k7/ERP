import paymentRepository from "./payments.repository.js";
import PaymentSchema from "./payments.schema.js";

class PaymentService {
  // ==========================================
  // Create Payment
  // ==========================================
  async createPayment(data) {
    // Check duplicate payment number
    const existingPayment =
      await paymentRepository.findByPaymentNumber(data.paymentNumber);

    if (existingPayment) {
      throw new Error("Payment Number already exists.");
    }

    const payment = new PaymentSchema(data);

    return await paymentRepository.create(payment);
  }

  // ==========================================
  // Get All Payments
  // ==========================================
  async getPayments() {
    return await paymentRepository.findAll();
  }

  // ==========================================
  // Get Payment By ID
  // ==========================================
  async getPaymentById(id) {
    const payment = await paymentRepository.findById(id);

    if (!payment) {
      throw new Error("Payment not found.");
    }

    return payment;
  }

  // ==========================================
  // Update Payment
  // ==========================================
  async updatePayment(id, data) {
    const payment = await paymentRepository.findById(id);

    if (!payment) {
      throw new Error("Payment not found.");
    }

    return await paymentRepository.update(id, data);
  }

  // ==========================================
  // Delete Payment
  // ==========================================
  async deletePayment(id) {
    const payment = await paymentRepository.findById(id);

    if (!payment) {
      throw new Error("Payment not found.");
    }

    return await paymentRepository.delete(id);
  }

  // ==========================================
  // Update Payment Status
  // ==========================================
  async updateStatus(id, status) {
    const payment = await paymentRepository.findById(id);

    if (!payment) {
      throw new Error("Payment not found.");
    }

    const allowedStatus = [
      "PENDING",
      "SUCCESS",
      "FAILED",
      "REFUNDED",
    ];

    if (!allowedStatus.includes(status)) {
      throw new Error("Invalid Payment Status");
    }

    return await paymentRepository.updateStatus(id, status);
  }

  // ==========================================
  // Get Customer Payments
  // ==========================================
  async getCustomerPayments(customerId) {
    return await paymentRepository.findByCustomer(customerId);
  }

  // ==========================================
  // Get Supplier Payments
  // ==========================================
  async getSupplierPayments(supplierId) {
    return await paymentRepository.findBySupplier(supplierId);
  }

  // ==========================================
  // Get Invoice Payments
  // ==========================================
  async getInvoicePayments(invoiceId) {
    return await paymentRepository.findByInvoice(invoiceId);
  }

  // ==========================================
  // Get Purchase Order Payments
  // ==========================================
  async getPurchaseOrderPayments(purchaseOrderId) {
    return await paymentRepository.findByPurchaseOrder(
      purchaseOrderId
    );
  }

  // ==========================================
  // Get Payments By Status
  // ==========================================
  async getPaymentsByStatus(status) {
    return await paymentRepository.findByStatus(status);
  }

  // ==========================================
  // Get Payment Count
  // ==========================================
  async getPaymentCount() {
    return await paymentRepository.count();
  }
}

export default new PaymentService();