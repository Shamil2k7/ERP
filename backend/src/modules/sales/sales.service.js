import salesRepository from "./sales.repository.js";
import prisma from "../../config/prisma.js";
import { emitDashboardUpdate } from "../../config/socket.js";

class SalesService {
  // ===================================
  // Create Sales Order (Atomic POS Sale & Stock Deduction)
  // ===================================
  async createSalesOrder(data, req = null) {
    const orderNumber = data.orderNumber || `SO-${Date.now()}`;

    // Check duplicate order number
    const existingOrder = await salesRepository.findByOrderNumber(orderNumber);
    let finalOrderNumber = orderNumber;
    if (existingOrder) {
      finalOrderNumber = `${orderNumber}-${Math.floor(Math.random() * 1000)}`;
    }

    const companyId = data.companyId || req?.companyId || req?.user?.companyId || null;
    const userId = req?.user?.id || null;
    const performedBy = req?.user?.fullName || req?.user?.email || "POS Cashier";

    // Calculate Net Amount
    const totalAmount = Number(data.totalAmount || 0);
    const taxAmount = Number(data.taxAmount || 0);
    const discountAmount = Number(data.discountAmount || 0);
    const netAmount = Number(data.netAmount ?? (totalAmount + taxAmount - discountAmount));

    // Resolve branchId safely
    let branchId = null;
    if (data.branchId && data.branchId !== "00000000-0000-0000-0000-000000000000") {
      const existingBranch = await prisma.branch.findUnique({ where: { id: data.branchId } }).catch(() => null);
      if (existingBranch) {
        branchId = existingBranch.id;
      }
    }
    if (!branchId && req?.user?.branchId) {
      branchId = req.user.branchId;
    }
    if (!branchId) {
      let firstBranch = await prisma.branch.findFirst({
        where: companyId ? { companyId } : undefined,
      }).catch(() => null);

      if (!firstBranch) {
        firstBranch = await prisma.branch.create({
          data: {
            name: "Main Branch",
            code: "MAIN-01",
            address: "Main Store",
            companyId: companyId || null,
            isActive: true,
          },
        }).catch(() => null);
      }
      if (firstBranch) {
        branchId = firstBranch.id;
      }
    }

    // Resolve customerId safely
    let customerId = null;
    if (data.customerId) {
      const existingCust = await prisma.customer.findUnique({ where: { id: data.customerId } }).catch(() => null);
      if (existingCust) {
        customerId = existingCust.id;
      }
    }
    if (!customerId) {
      let defaultCust = await prisma.customer.findFirst({
        where: {
          name: "Walk-in Customer",
          ...(companyId ? { companyId } : {}),
        },
      }).catch(() => null);

      if (!defaultCust) {
        defaultCust = await prisma.customer.create({
          data: {
            name: "Walk-in Customer",
            phone: `0000000000-${Date.now().toString().slice(-4)}`,
            email: `walkin-${Date.now()}@store.local`,
            address: "In-Store Counter",
            companyId: companyId || null,
          },
        }).catch(() => null);
      }
      if (defaultCust) {
        customerId = defaultCust.id;
      }
    }

    const orderDate = data.orderDate ? new Date(data.orderDate) : new Date();

    // =========================================================================
    // ATOMIC DATABASE TRANSACTION FOR SALE, STOCK DEDUCTION & INVOICING
    // =========================================================================
    const result = await prisma.$transaction(async (tx) => {
      // 1. Resolve Warehouse for inventory deduction
      let warehouse = await tx.warehouse.findFirst({
        where: {
          ...(companyId ? { companyId } : {}),
          status: "ACTIVE",
        },
      });

      if (!warehouse) {
        warehouse = await tx.warehouse.create({
          data: {
            name: "Main Warehouse",
            code: "WH-MAIN",
            location: "Main Store",
            companyId: companyId || null,
            status: "ACTIVE",
          },
        });
      }

      const inventoryUpdates = [];
      const items = Array.isArray(data.items) ? data.items : [];

      // 2. Validate and Deduct Inventory Stock for all sold items
      for (const item of items) {
        const productId = item.productId || item.id;
        const soldQty = Number(item.quantity || item.qty || 1);

        if (!productId || soldQty <= 0) continue;

        // Fetch product with inventories
        const product = await tx.product.findUnique({
          where: { id: productId },
          include: {
            inventories: true,
            unit: true,
          },
        });

        if (!product) {
          throw new Error(`Product not found with ID: ${productId}`);
        }

        // Find or auto-initialize inventory record in warehouse
        let invRecord =
          product.inventories?.find((i) => i.warehouseId === warehouse.id) ||
          product.inventories?.[0];

        if (!invRecord) {
          invRecord = await tx.inventory.create({
            data: {
              productId: product.id,
              warehouseId: warehouse.id,
              quantity: Number(product.initialStock || 0),
              reorderLevel: Number(product.reorderLevel || 10),
              minimumStock: Number(product.minimumStock || 0),
              maximumStock: Number(product.maximumStock || 1000),
            },
          });
        }

        const availableStock = Number(invRecord.quantity);

        // PREVENT NEGATIVE STOCK / VALIDATE STOCK AVAILABILITY
        if (soldQty > availableStock) {
          throw new Error(
            `Insufficient stock for "${product.name}". Available: ${availableStock}, Requested: ${soldQty}`
          );
        }

        const newStock = Math.max(0, availableStock - soldQty);

        // Update Inventory Table quantity (authoritative source)
        await tx.inventory.update({
          where: { id: invRecord.id },
          data: { quantity: newStock },
        });

        // Also sync Product initialStock field
        await tx.product.update({
          where: { id: product.id },
          data: { initialStock: newStock },
        });

        // Create Stock Movement record for full audit history
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            warehouseId: invRecord.warehouseId,
            type: "SALE",
            quantity: -soldQty,
            referenceNo: finalOrderNumber,
            remarks: `POS Sale ${finalOrderNumber} (${soldQty} ${product.unit?.name || "units"})`,
            performedBy,
            companyId: companyId || null,
          },
        });

        inventoryUpdates.push({
          productId: product.id,
          productName: product.name,
          previousQuantity: availableStock,
          newQuantity: newStock,
          soldQuantity: soldQty,
        });
      }

      // 3. Create Sales Order
      const createdOrder = await tx.salesOrder.create({
        data: {
          branchId,
          customerId,
          companyId: companyId || null,
          orderNumber: finalOrderNumber,
          status: "COMPLETED",
          orderDate,
          totalAmount,
          taxAmount,
          discountAmount,
          netAmount,
        },
      });

      // 4. Create Invoice and Invoice Items
      const invoiceNumber = `INV-${finalOrderNumber.replace(/^SO-/, "")}`;
      const createdInvoice = await tx.invoice.create({
        data: {
          branchId,
          salesOrderId: createdOrder.id,
          customerId,
          companyId: companyId || null,
          invoiceNumber,
          invoiceDate: orderDate,
          subtotal: totalAmount,
          taxAmount,
          discountAmount,
          totalAmount: netAmount,
          paidAmount: netAmount,
          balanceAmount: 0,
          paymentStatus: "PAID",
          status: "ISSUED",
          notes: `POS Sale Order ${finalOrderNumber}`,
          items: {
            create: items.map((item) => ({
              productId: item.productId || item.id,
              quantity: Number(item.quantity || item.qty || 1),
              unitPrice: Number(item.unitPrice || item.price || 0),
              discount: Number(item.discount || 0),
              tax: Number(item.tax || 0),
              total: Number(
                item.totalPrice ||
                  Number(item.price || item.unitPrice || 0) * Number(item.quantity || item.qty || 1)
              ),
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // 5. Create Payment record if applicable
      if (netAmount > 0) {
        const paymentMethod = (data.paymentMethod || "CASH").toUpperCase();
        await tx.payment.create({
          data: {
            branchId,
            customerId,
            companyId: companyId || null,
            invoiceId: createdInvoice.id,
            paymentNumber: `PAY-${Date.now()}`,
            amount: netAmount,
            method: paymentMethod.includes("CARD") ? "CARD" : "CASH",
            paymentDate: orderDate,
            status: "SUCCESS",
            notes: `POS Payment for ${finalOrderNumber}`,
          },
        }).catch(() => null);
      }

      // 6. Record Audit Log
      await tx.auditLog.create({
        data: {
          action: "POS_SALE_COMPLETED",
          entity: "SalesOrder",
          entityId: createdOrder.id,
          details: `POS Sale ${finalOrderNumber} completed for ₹${netAmount.toFixed(2)} with ${inventoryUpdates.length} item(s) deducted from stock`,
          userId,
          companyId: companyId || null,
        },
      }).catch(() => null);

      return {
        order: createdOrder,
        invoice: createdInvoice,
        inventoryUpdates,
      };
    });

    // 7. Emit Real-time Socket Events after transaction successfully commits
    try {
      emitDashboardUpdate(companyId, "sale.completed", {
        orderNumber: finalOrderNumber,
        netAmount,
        inventoryUpdates: result.inventoryUpdates,
      });
      emitDashboardUpdate(companyId, "stock.updated", {
        inventoryUpdates: result.inventoryUpdates,
      });
    } catch (socketErr) {
      // Non-blocking socket notification
    }

    return {
      ...result.order,
      invoice: result.invoice,
      inventoryUpdates: result.inventoryUpdates,
    };
  }

  // ===================================
  // Get All Sales Orders
  // ===================================
  async getSalesOrders() {
    return await salesRepository.findAll();
  }

  // ===================================
  // Get Single Sales Order
  // ===================================
  async getSalesOrderById(id) {
    const sales = await salesRepository.findById(id);

    if (!sales) {
      throw new Error("Sales order not found.");
    }

    return sales;
  }

  // ===================================
  // Update Sales Order
  // ===================================
  async updateSalesOrder(id, data) {
    const sales = await salesRepository.findById(id);

    if (!sales) {
      throw new Error("Sales order not found.");
    }

    const totalAmount =
      data.totalAmount !== undefined
        ? Number(data.totalAmount)
        : Number(sales.totalAmount);

    const taxAmount =
      data.taxAmount !== undefined
        ? Number(data.taxAmount)
        : Number(sales.taxAmount);

    const discountAmount =
      data.discountAmount !== undefined
        ? Number(data.discountAmount)
        : Number(sales.discountAmount);

    const netAmount =
      data.netAmount !== undefined
        ? Number(data.netAmount)
        : totalAmount + taxAmount - discountAmount;

    return await salesRepository.update(id, {
      ...data,
      totalAmount,
      taxAmount,
      discountAmount,
      netAmount,
    });
  }

  // ===================================
  // Delete Sales Order
  // ===================================
  async deleteSalesOrder(id) {
    const sales = await salesRepository.findById(id);

    if (!sales) {
      throw new Error("Sales order not found.");
    }

    return await salesRepository.delete(id);
  }
}

export default new SalesService();