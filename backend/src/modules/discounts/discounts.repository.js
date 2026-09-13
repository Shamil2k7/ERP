import prisma from "../../config/prisma.js";

class DiscountRepository {
  // ==========================================
  // Create Discount
  // ==========================================
  async create(data) {
    return await prisma.discount.create({
      data,
    });
  }

  // ==========================================
  // Get All Discounts
  // ==========================================
  async findAll() {
    return await prisma.discount.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // ==========================================
  // Get Discount By ID
  // ==========================================
  async findById(id) {
    return await prisma.discount.findUnique({
      where: {
        id,
      },
    });
  }

  // ==========================================
  // Find Discount By Code
  // ==========================================
  async findByCode(code) {
    return await prisma.discount.findUnique({
      where: {
        code,
      },
    });
  }

  // ==========================================
  // Find Discount By Name
  // ==========================================
  async findByName(name) {
    return await prisma.discount.findFirst({
      where: {
        name,
      },
    });
  }

  // ==========================================
  // Get Discounts By Status
  // ==========================================
  async findByStatus(status) {
    return await prisma.discount.findMany({
      where: {
        status,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // ==========================================
  // Get Discounts By Type
  // ==========================================
  async findByType(type) {
    return await prisma.discount.findMany({
      where: {
        type,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // ==========================================
  // Update Discount
  // ==========================================
  async update(id, data) {
    return await prisma.discount.update({
      where: {
        id,
      },
      data,
    });
  }

  // ==========================================
  // Delete Discount
  // ==========================================
  async delete(id) {
    return await prisma.discount.delete({
      where: {
        id,
      },
    });
  }

  // ==========================================
  // Count Discounts
  // ==========================================
  async count() {
    return await prisma.discount.count();
  }
}

export default new DiscountRepository();