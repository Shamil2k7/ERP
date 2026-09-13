import prisma from "../../config/prisma.js";

// ==========================================
// MEDICINES REPOSITORY
// ==========================================

export const createMedicineRepo = async (companyId, data) => {
  await prisma.product.update({
    where: { id: data.productId },
    data: { productType: "MEDICINE" },
  });

  return await prisma.medicine.create({
    data: {
      ...data,
      companyId,
    },
    include: { product: true },
  });
};

export const getMedicinesRepo = async (companyId, { search, prescriptionRequired }) => {
  const where = { companyId };
  if (prescriptionRequired !== undefined) {
    where.prescriptionRequired = prescriptionRequired === "true";
  }

  if (search) {
    where.OR = [
      { genericName: { contains: search, mode: "insensitive" } },
      { manufacturer: { contains: search, mode: "insensitive" } },
      { product: { name: { contains: search, mode: "insensitive" } } },
      { product: { sku: { contains: search, mode: "insensitive" } } },
    ];
  }

  return await prisma.medicine.findMany({
    where,
    include: {
      product: {
        include: {
          category: true,
          unit: true
        }
      },
      batches: {
        where: { status: "ACTIVE" },
        orderBy: { expiryDate: "asc" }
      }
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getMedicineByIdRepo = async (companyId, id) => {
  return await prisma.medicine.findFirst({
    where: { id, companyId },
    include: {
      product: {
        include: {
          category: true,
          unit: true
        }
      },
      batches: {
        orderBy: { expiryDate: "asc" }
      }
    },
  });
};

export const updateMedicineRepo = async (companyId, id, data) => {
  return await prisma.medicine.update({
    where: { id, companyId },
    data,
    include: { product: true },
  });
};

export const deleteMedicineRepo = async (companyId, id) => {
  return await prisma.medicine.delete({
    where: { id, companyId },
  });
};

// ==========================================
// MEDICINE BATCHES REPOSITORY
// ==========================================

export const createBatchRepo = async (data) => {
  return await prisma.$transaction(async (tx) => {
    // Create the batch record
    const batch = await tx.medicineBatch.create({
      data: {
        medicineId: data.medicineId,
        productId: data.productId,
        batchNumber: data.batchNumber,
        manufacturingDate: data.manufacturingDate ? new Date(data.manufacturingDate) : null,
        expiryDate: new Date(data.expiryDate),
        purchasePrice: data.purchasePrice,
        sellingPrice: data.sellingPrice,
        quantity: data.quantity,
        supplierId: data.supplierId || null,
        warehouseId: data.warehouseId || null,
        status: data.status || "ACTIVE",
      },
      include: {
        medicine: { include: { product: true } },
        supplier: true,
        warehouse: true
      }
    });

    // Update or create product Inventory in the selected warehouse
    if (data.warehouseId && data.quantity > 0) {
      const inventory = await tx.inventory.findFirst({
        where: {
          productId: data.productId,
          warehouseId: data.warehouseId
        }
      });

      if (inventory) {
        await tx.inventory.update({
          where: { id: inventory.id },
          data: {
            quantity: parseFloat(inventory.quantity) + data.quantity
          }
        });
      } else {
        await tx.inventory.create({
          data: {
            productId: data.productId,
            warehouseId: data.warehouseId,
            quantity: data.quantity,
            minimumStock: 10,
            maximumStock: 1000,
            reorderLevel: 20
          }
        });
      }

      // Log Stock Movement
      await tx.stockMovement.create({
        data: {
          companyId: batch.medicine.companyId,
          productId: data.productId,
          warehouseId: data.warehouseId,
          type: "PURCHASE",
          quantity: data.quantity,
          referenceNo: `BATCH-${data.batchNumber}`,
          remarks: `Added via batch creation: ${data.batchNumber}`,
        }
      });
    }

    return batch;
  });
};

export const getBatchesRepo = async (companyId, { medicineId, productId, status, expiringDays }) => {
  const where = {};
  if (medicineId) where.medicineId = medicineId;
  if (productId) where.productId = productId;
  if (status) where.status = status;

  if (companyId) {
    where.medicine = { companyId };
  }

  if (expiringDays) {
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() + parseInt(expiringDays));
    where.expiryDate = {
      gte: new Date(),
      lte: limitDate
    };
    where.status = "ACTIVE";
  }

  return await prisma.medicineBatch.findMany({
    where,
    include: {
      medicine: {
        include: {
          product: true
        }
      },
      supplier: true,
      warehouse: true
    },
    orderBy: { expiryDate: "asc" }
  });
};

export const getBatchByIdRepo = async (id) => {
  return await prisma.medicineBatch.findUnique({
    where: { id },
    include: {
      medicine: {
        include: { product: true }
      },
      supplier: true,
      warehouse: true
    }
  });
};

export const updateBatchRepo = async (id, data) => {
  return await prisma.medicineBatch.update({
    where: { id },
    data,
    include: {
      medicine: { include: { product: true } }
    }
  });
};

export const deleteBatchRepo = async (id) => {
  return await prisma.medicineBatch.delete({
    where: { id }
  });
};

// ==========================================
// FEFO BATCH STOCK DEDUCTION (PHARMACY POS)
// ==========================================

export const deductBatchStockFEFO = async (companyId, warehouseId, productId, qtyNeeded, referenceNo, remarks) => {
  return await prisma.$transaction(async (tx) => {
    // Find active, unexpired batches for this product in this warehouse ordered by expiryDate ASC (FEFO)
    const batches = await tx.medicineBatch.findMany({
      where: {
        productId,
        warehouseId,
        status: "ACTIVE",
        quantity: { gt: 0 },
        expiryDate: { gte: new Date() }
      },
      orderBy: { expiryDate: "asc" }
    });

    let remainingNeeded = qtyNeeded;
    const updatedBatches = [];

    for (const batch of batches) {
      if (remainingNeeded <= 0) break;

      const deductQty = Math.min(batch.quantity, remainingNeeded);
      const newQty = batch.quantity - deductQty;

      const updated = await tx.medicineBatch.update({
        where: { id: batch.id },
        data: {
          quantity: newQty,
          status: newQty === 0 ? "OUT_OF_STOCK" : "ACTIVE"
        }
      });

      updatedBatches.push(updated);
      remainingNeeded -= deductQty;
    }

    if (remainingNeeded > 0) {
      throw new Error(`Insufficient batch stock for Product ID ${productId}. Shortage: ${remainingNeeded}`);
    }

    // Update general Inventory
    const inventory = await tx.inventory.findFirst({
      where: { productId, warehouseId }
    });

    if (inventory) {
      await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          quantity: parseFloat(inventory.quantity) - qtyNeeded
        }
      });
    }

    // Create Stock Movement record
    await tx.stockMovement.create({
      data: {
        companyId,
        productId,
        warehouseId,
        type: "SALE",
        quantity: -qtyNeeded,
        referenceNo,
        remarks: remarks || "Pharmacy POS Checkout"
      }
    });

    return updatedBatches;
  });
};

// ==========================================
// PRESCRIPTIONS REPOSITORY
// ==========================================

export const createPrescriptionRepo = async (companyId, data, items) => {
  return await prisma.prescription.create({
    data: {
      customerId: data.customerId,
      companyId,
      doctorName: data.doctorName,
      prescriptionNumber: data.prescriptionNumber,
      notes: data.notes || null,
      status: "ACTIVE",
      items: {
        create: items.map(item => ({
          medicineId: item.medicineId,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          quantity: item.quantity,
          instructions: item.instructions || null
        }))
      }
    },
    include: {
      customer: true,
      items: {
        include: {
          medicine: { include: { product: true } }
        }
      }
    }
  });
};

export const getPrescriptionsRepo = async (companyId, { customerId, search }) => {
  const where = { companyId };
  if (customerId) where.customerId = customerId;

  if (search) {
    where.OR = [
      { prescriptionNumber: { contains: search, mode: "insensitive" } },
      { doctorName: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } }
    ];
  }

  return await prisma.prescription.findMany({
    where,
    include: {
      customer: true,
      items: {
        include: {
          medicine: { include: { product: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
};

export const getPrescriptionByIdRepo = async (id) => {
  return await prisma.prescription.findUnique({
    where: { id },
    include: {
      customer: true,
      items: {
        include: {
          medicine: { include: { product: true } }
        }
      }
    }
  });
};

// ==========================================
// MEDICAL STATS & ALERTS REPOSITORY
// ==========================================

export const getMedicalDashboardStatsRepo = async (companyId) => {
  const now = new Date();
  const warningDate30 = new Date();
  warningDate30.setDate(warningDate30.getDate() + 30);

  const warningDate90 = new Date();
  warningDate90.setDate(warningDate90.getDate() + 90);

  // Fetch all batches under this company
  const batches = await prisma.medicineBatch.findMany({
    where: {
      medicine: { companyId }
    },
    include: { medicine: { include: { product: true } } }
  });

  const expired = batches.filter(b => new Date(b.expiryDate) < now);
  const expiringSoon30 = batches.filter(b => {
    const exp = new Date(b.expiryDate);
    return exp >= now && exp <= warningDate30;
  });
  const expiringSoon90 = batches.filter(b => {
    const exp = new Date(b.expiryDate);
    return exp >= now && exp <= warningDate90;
  });

  const lowStock = batches.filter(b => b.quantity > 0 && b.quantity <= 20); // standard threshold
  const outOfStock = batches.filter(b => b.quantity === 0);

  return {
    totalBatches: batches.length,
    expiredCount: expired.length,
    expiringSoon30Count: expiringSoon30.length,
    expiringSoon90Count: expiringSoon90.length,
    lowStockCount: lowStock.length,
    outOfStockCount: outOfStock.length,
    expiredBatches: expired,
    expiringSoonBatches: expiringSoon30,
    lowStockBatches: lowStock,
    outOfStockBatches: outOfStock
  };
};

export const getMedicalReportsRepo = async (companyId) => {
  const salesMovements = await prisma.stockMovement.findMany({
    where: {
      companyId,
      type: "SALE"
    },
    include: {
      product: true
    }
  });

  let costOfGoods = 0;
  let grossRevenue = 0;
  const drugSalesMap = {};

  for (const m of salesMovements) {
    const qty = Math.abs(parseFloat(m.quantity));
    const cost = qty * parseFloat(m.product.costPrice || 0);
    const sales = qty * parseFloat(m.product.sellingPrice || 0);

    costOfGoods += cost;
    grossRevenue += sales;

    const pId = m.productId;
    const name = m.product.name;

    if (!drugSalesMap[pId]) {
      drugSalesMap[pId] = { name, sales: 0, cost: 0 };
    }
    drugSalesMap[pId].sales += sales;
    drugSalesMap[pId].cost += cost;
  }

  const grossProfit = grossRevenue - costOfGoods;
  const netMargins = grossRevenue > 0 ? ((grossProfit / grossRevenue) * 100).toFixed(1) + "%" : "0.0%";

  const cogsByDrug = Object.values(drugSalesMap).map(d => {
    const profit = d.sales - d.cost;
    const margin = d.sales > 0 ? Math.round((profit / d.sales) * 100) : 0;
    return {
      name: d.name,
      sales: d.sales,
      margin
    };
  }).sort((a, b) => b.sales - a.sales).slice(0, 5);

  return {
    grossProfit,
    costOfGoods,
    netMargins,
    cogsByDrug
  };
};
