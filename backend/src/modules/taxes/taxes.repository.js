import prisma from "../../config/prisma.js";

class TaxRepository {
  // ==========================================
  // Create Tax
  // ==========================================
  async create(data) {
    return await prisma.tax.create({
      data,
    });
  }

  // ==========================================
  // Get All Taxes
  // ==========================================
  async findAll() {
    return await prisma.tax.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // ==========================================
  // Get Tax By ID
  // ==========================================
  async findById(id) {
    return await prisma.tax.findUnique({
      where: {
        id,
      },
    });
  }

  // ==========================================
  // Find Tax By Name
  // ==========================================
  async findByName(name) {
    return await prisma.tax.findFirst({
      where: {
        name,
      },
    });
  }

  // ==========================================
  // Get Taxes By Status
  // ==========================================
  async findByStatus(status) {
    return await prisma.tax.findMany({
      where: {
        status,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // ==========================================
  // Get Taxes By Type
  // ==========================================
  async findByType(type) {
    return await prisma.tax.findMany({
      where: {
        type,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // ==========================================
  // Update Tax
  // ==========================================
  async update(id, data) {
    return await prisma.tax.update({
      where: {
        id,
      },
      data,
    });
  }

  // ==========================================
  // Delete Tax
  // ==========================================
  async delete(id) {
    return await prisma.tax.delete({
      where: {
        id,
      },
    });
  }

  // ==========================================
  // Count Taxes
  // ==========================================
  async count() {
    return await prisma.tax.count();
  }
}

export default new TaxRepository();