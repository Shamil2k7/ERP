import prisma from "../../config/prisma.js";

class PaymentRepository {
  // ==========================================
  // Create Payment
  // ==========================================
  async create(data) {
    return await prisma.payment.create({
      data,
    });
  }

  // ==========================================
  // Get All Payments
  // ==========================================
  async findAll() {
    return await prisma.payment.findMany({
      orderBy: {
        paymentDate: "desc",
      },
      include: {
        invoice: true,
        customer: true,
      },
    });
  }

  // ==========================================
  // Get Payment By ID
  // ==========================================
  async findById(id) {
    return await prisma.payment.findUnique({
      where: {
        id,
      },
    });
  }

  // ==========================================
  // Find Payment Number
  // ==========================================
  async findByPaymentNumber(paymentNumber) {
    return await prisma.payment.findUnique({
      where: {
        paymentNumber,
      },
    });
  }

  // ==========================================
  // Find By Customer
  // ==========================================
  async findByCustomer(customerId) {
    return await prisma.payment.findMany({
      where: {
        customerId,
      },
      orderBy: {
        paymentDate: "desc",
      },
    });
  }

  // ==========================================
  // Find By Supplier
  // ==========================================
  async findBySupplier(supplierId) {
    return await prisma.payment.findMany({
      where: {
        supplierId,
      },
      orderBy: {
        paymentDate: "desc",
      },
    });
  }

  // ==========================================
  // Find By Invoice
  // ==========================================
  async findByInvoice(invoiceId) {
    return await prisma.payment.findMany({
      where: {
        invoiceId,
      },
      orderBy: {
        paymentDate: "desc",
      },
    });
  }

  // ==========================================
  // Find By Purchase Order
  // ==========================================
  async findByPurchaseOrder(purchaseOrderId) {
    return await prisma.payment.findMany({
      where: {
        purchaseOrderId,
      },
      orderBy: {
        paymentDate: "desc",
      },
    });
  }

  // ==========================================
  // Find By Status
  // ==========================================
  async findByStatus(status) {
    return await prisma.payment.findMany({
      where: {
        status,
      },
      orderBy: {
        paymentDate: "desc",
      },
    });
  }

  // ==========================================
  // Update Payment
  // ==========================================
  async update(id, data) {
    return await prisma.payment.update({
      where: {
        id,
      },
      data,
    });
  }

  // ==========================================
  // Update Payment Status
  // ==========================================
  async updateStatus(id, status) {
    return await prisma.payment.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });
  }

  // ==========================================
  // Delete Payment
  // ==========================================
  async delete(id) {
    return await prisma.payment.delete({
      where: {
        id,
      },
    });
  }

  // ==========================================
  // Count Payments
  // ==========================================
  async count() {
    return await prisma.payment.count();
  }
}

export default new PaymentRepository();