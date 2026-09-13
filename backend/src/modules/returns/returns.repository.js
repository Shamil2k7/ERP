import prisma from "../../config/prisma.js";

class ReturnRepository {
  // ==========================================
  // Create Return
  // ==========================================
  async create(data) {
    return await prisma.return.create({
      data,
    });
  }

  // ==========================================
  // Get All Returns
  // ==========================================
  async findAll() {
    return await prisma.return.findMany({
      orderBy: {
        returnDate: "desc",
      },
    });
  }

  // ==========================================
  // Get Return By ID
  // ==========================================
  async findById(id) {
    return await prisma.return.findUnique({
      where: {
        id,
      },
    });
  }

  // ==========================================
  // Find Return By Number
  // ==========================================
  async findByReturnNumber(returnNumber) {
    return await prisma.return.findUnique({
      where: {
        returnNumber,
      },
    });
  }

  // ==========================================
  // Get Returns By Type
  // ==========================================
  async findByType(type) {
    return await prisma.return.findMany({
      where: {
        type,
      },
      orderBy: {
        returnDate: "desc",
      },
    });
  }

  // ==========================================
  // Get Sales Returns
  // ==========================================
  async findBySalesOrder(referenceSalesOrderId) {
    return await prisma.return.findMany({
      where: {
        referenceSalesOrderId,
      },
      orderBy: {
        returnDate: "desc",
      },
    });
  }

  // ==========================================
  // Get Purchase Returns
  // ==========================================
  async findByPurchaseOrder(referencePurchaseOrderId) {
    return await prisma.return.findMany({
      where: {
        referencePurchaseOrderId,
      },
      orderBy: {
        returnDate: "desc",
      },
    });
  }

  // ==========================================
  // Update Return
  // ==========================================
  async update(id, data) {
    return await prisma.return.update({
      where: {
        id,
      },
      data,
    });
  }

  // ==========================================
  // Delete Return
  // ==========================================
  async delete(id) {
    return await prisma.return.delete({
      where: {
        id,
      },
    });
  }

  // ==========================================
  // Count Returns
  // ==========================================
  async count() {
    return await prisma.return.count();
  }
}

export default new ReturnRepository();