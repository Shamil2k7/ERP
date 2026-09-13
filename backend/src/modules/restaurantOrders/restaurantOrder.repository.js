import prisma from "../../config/prisma.js";
import { convertUnit } from "../../utils/unitConverter.js";
import { emitOrderStatusUpdate, emitKitchenOrderCreated, emitKitchenOrderUpdated, emitTableStatusUpdated } from "../../config/socket.js";



const orderInclude = {
  restaurant: true,
  table: {
    include: {
      area: true,
    },
  },
  customer: true,
  items: {
    include: {
      menuItem: {
        include: {
          recipe: {
            include: {
              ingredients: {
                include: {
                  product: {
                    include: {
                      unit: true,
                      inventories: {
                        include: {
                          warehouse: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  kitchenOrders: {
    include: {
      items: {
        include: {
          menuItem: true,
        },
      },
    },
  },
  payments: true,
};

/**
 * Helper to determine the product's base inventory unit.
 */
export const getProductStockUnit = (product) => {
  if (!product) return "pcs";
  return product.stockUnit || product.unit?.code || product.unit?.name || "pcs";
};

/**
 * Helper to get or create a default active warehouse for a company.
 */
export const getOrCreateCompanyWarehouse = async (companyId, tx) => {
  const db = tx || prisma;
  if (!companyId) return null;

  let wh = await db.warehouse.findFirst({
    where: { companyId, status: "ACTIVE" },
  });
  if (!wh) {
    wh = await db.warehouse.findFirst({
      where: { companyId },
    });
  }
  if (!wh) {
    wh = await db.warehouse.create({
      data: {
        name: "Main Kitchen Store",
        code: "WH-KITCHEN",
        companyId,
        status: "ACTIVE",
      },
    });
  }
  return wh;
};

/**
 * Helper to get available inventory stock for a product within the company.
 * Exactly matches the stock logic from the Raw Materials / Ingredients page.
 */
export const getAvailableStockForProduct = async (productId, companyId, warehouseId = null, tx) => {
  const db = tx || prisma;
  if (!productId || !companyId) return 0;

  if (warehouseId) {
    const inv = await db.inventory.findFirst({
      where: {
        productId,
        warehouseId,
        warehouse: { companyId },
      },
    });
    if (inv) return parseFloat(inv.quantity) || 0;
  }

  // Calculate sum of all inventory records for this product across warehouses belonging to this company
  const inventories = await db.inventory.findMany({
    where: {
      productId,
      warehouse: { companyId },
    },
  });

  if (inventories && inventories.length > 0) {
    return inventories.reduce((sum, inv) => sum + (parseFloat(inv.quantity) || 0), 0);
  }

  // Fallback to product.initialStock if no inventory record exists yet
  const product = await db.product.findFirst({
    where: { id: productId, companyId },
  });
  return parseFloat(product?.initialStock) || 0;
};

export const createOrder = async (companyId, data) => {
  if (!companyId) {
    const error = new Error("Tenant company context required.");
    error.statusCode = 403;
    throw error;
  }

  const { items, ...orderData } = data;
  const orderNumber = orderData.orderNumber || `RST-${Date.now().toString().slice(-6)}`;

  return await prisma.$transaction(async (tx) => {
    // 1. Resolve and validate Restaurant belonging to company
    const isUUID = (str) => typeof str === "string" && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
    let cleanRestaurantId = isUUID(orderData.restaurantId) ? orderData.restaurantId : null;

    if (cleanRestaurantId) {
      const rest = await tx.restaurant.findFirst({
        where: { id: cleanRestaurantId, companyId },
      });
      if (!rest) {
        const error = new Error("Restaurant outlet not found or access denied.");
        error.statusCode = 404;
        throw error;
      }
    } else {
      const firstRest = await tx.restaurant.findFirst({
        where: { companyId, ...(orderData.branchId ? { branchId: orderData.branchId } : {}) },
      });
      if (!firstRest) {
        const error = new Error("No active restaurant outlet found for this company.");
        error.statusCode = 404;
        throw error;
      }
      cleanRestaurantId = firstRest.id;
    }

    // 2. Validate Table if given
    const cleanTableId = isUUID(orderData.tableId) ? orderData.tableId : null;
    if (cleanTableId) {
      const table = await tx.restaurantTable.findFirst({
        where: { id: cleanTableId, restaurant: { companyId } },
      });
      if (!table) {
        const error = new Error("Table not found or access denied.");
        error.statusCode = 404;
        throw error;
      }
    }

    // 3. Validate Customer if given
    const cleanCustomerId = isUUID(orderData.customerId) ? orderData.customerId : null;
    if (cleanCustomerId) {
      const cust = await tx.customer.findFirst({
        where: { id: cleanCustomerId, companyId },
      });
      if (!cust) {
        const error = new Error("Customer not found or access denied.");
        error.statusCode = 404;
        throw error;
      }
    }

    let subtotal = 0;
    let totalTax = 0;
    const formattedItems = [];

    if (items && items.length > 0) {
      for (const item of items) {
        // Validate menuItem belongs to company
        const menuItem = await tx.menuItem.findFirst({
          where: { id: item.menuItemId, restaurant: { companyId } },
        });
        if (!menuItem) {
          const error = new Error(`Menu item not found or access denied: ${item.menuItemId}`);
          error.statusCode = 404;
          throw error;
        }

        const qty = parseFloat(item.quantity) || 1;
        const price = parseFloat(item.unitPrice) || parseFloat(menuItem.sellingPrice) || 0;
        const discount = parseFloat(item.discount) || 0;
        const tax = parseFloat(item.tax) || 0;
        const itemTotal = price * qty - discount + tax;

        subtotal += price * qty;
        totalTax += tax;

        formattedItems.push({
          menuItemId: item.menuItemId,
          quantity: qty,
          unitPrice: price,
          discount,
          tax,
          total: itemTotal,
          notes: item.notes || null,
          modifiers: item.modifiers || null,
          status: "PENDING",
        });
      }
    }

    const discountAmount = parseFloat(orderData.discountAmount) || 0;
    const taxAmount = parseFloat(orderData.taxAmount) || totalTax;
    const totalAmount = subtotal - discountAmount + taxAmount;

    const order = await tx.restaurantOrder.create({
      data: {
        ...orderData,
        companyId,
        restaurantId: cleanRestaurantId,
        customerId: cleanCustomerId,
        tableId: cleanTableId,
        orderNumber,
        subtotal,
        discountAmount,
        taxAmount,
        totalAmount,
        status: orderData.status || "DRAFT",
        items: {
          create: formattedItems,
        },
      },
      include: orderInclude,
    });

    if (order.orderType === "DINE_IN" && order.tableId) {
      await tx.restaurantTable.update({
        where: { id: order.tableId },
        data: { status: "OCCUPIED" },
      });
    }

    return order;
  });
};

export const getOrders = async (companyId, params = {}) => {
  if (!companyId) return [];

  const { restaurantId, branchId, tableId, status, orderType, search } = params;
  const where = { companyId };

  if (restaurantId && restaurantId !== "ALL" && restaurantId !== "undefined" && restaurantId !== "null" && String(restaurantId).trim() !== "") {
    where.restaurantId = restaurantId;
  }
  if (branchId && branchId !== "ALL" && branchId !== "undefined" && branchId !== "null" && String(branchId).trim() !== "") {
    where.branchId = branchId;
  }
  if (tableId && tableId !== "ALL" && tableId !== "undefined" && tableId !== "null" && String(tableId).trim() !== "") {
    where.tableId = tableId;
  }
  if (status && status !== "ALL" && status !== "undefined" && status !== "null") {
    if (Array.isArray(status)) {
      where.status = { in: status };
    } else {
      where.status = status;
    }
  }
  if (orderType && orderType !== "ALL" && orderType !== "undefined" && orderType !== "null") {
    where.orderType = orderType;
  }
  if (search && String(search).trim() !== "") {
    where.OR = [
      { orderNumber: { contains: String(search).trim(), mode: "insensitive" } },
      { notes: { contains: String(search).trim(), mode: "insensitive" } },
    ];
  }

  return await prisma.restaurantOrder.findMany({
    where,
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });
};

export const getOrderById = async (id, companyId) => {
  if (!id) return null;

  const where = { id };
  if (companyId) {
    where.companyId = companyId;
  }

  return await prisma.restaurantOrder.findFirst({
    where,
    include: orderInclude,
  });
};

export const updateOrder = async (id, companyId, data) => {
  const existing = await getOrderById(id, companyId);
  if (!existing) {
    const error = new Error("Restaurant order not found or access denied.");
    error.statusCode = 404;
    throw error;
  }

  const { items, ...orderData } = data;

  const resOrder = await prisma.$transaction(async (tx) => {
    if (items) {
      await tx.restaurantOrderItem.deleteMany({
        where: { orderId: id },
      });

      let subtotal = 0;
      let totalTax = 0;
      const formattedItems = [];

      for (const item of items) {
        const qty = parseFloat(item.quantity) || 1;
        const price = parseFloat(item.unitPrice) || 0;
        const discount = parseFloat(item.discount) || 0;
        const tax = parseFloat(item.tax) || 0;
        const itemTotal = price * qty - discount + tax;

        subtotal += price * qty;
        totalTax += tax;

        formattedItems.push({
          orderId: id,
          menuItemId: item.menuItemId,
          quantity: qty,
          unitPrice: price,
          discount,
          tax,
          total: itemTotal,
          notes: item.notes || null,
          modifiers: item.modifiers || null,
          status: item.status || "PENDING",
        });
      }

      await tx.restaurantOrderItem.createMany({
        data: formattedItems,
      });

      orderData.subtotal = subtotal;
      orderData.taxAmount = parseFloat(orderData.taxAmount) || totalTax;
      const disc = parseFloat(orderData.discountAmount) || 0;
      orderData.totalAmount = subtotal - disc + orderData.taxAmount;
    }

    const isUUID = (str) => typeof str === "string" && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
    if (orderData.customerId !== undefined) {
      orderData.customerId = isUUID(orderData.customerId) ? orderData.customerId : null;
    }
    if (orderData.tableId !== undefined) {
      orderData.tableId = isUUID(orderData.tableId) ? orderData.tableId : null;
    }

    const updated = await tx.restaurantOrder.update({
      where: { id },
      data: orderData,
      include: orderInclude,
    });

    if (updated.status === "SERVED") {
      await tx.kitchenOrder.updateMany({
        where: { orderId: id },
        data: { status: "SERVED" },
      });
      await tx.restaurantOrderItem.updateMany({
        where: { orderId: id },
        data: { status: "SERVED" },
      });
      await processStockDeductionOnServed(id, tx);
      // NOTE: Table MUST STILL REMAIN OCCUPIED when food is SERVED. Table becomes AVAILABLE ONLY AFTER successful payment!
      if (existing.tableId && existing.orderType === "DINE_IN") {
        await tx.restaurantTable.update({
          where: { id: existing.tableId },
          data: { status: "OCCUPIED" },
        });
      }
    } else if (updated.status === "CANCELLED") {
      await tx.kitchenOrder.updateMany({
        where: { orderId: id },
        data: { status: "CANCELLED" },
      });
      if (existing.tableId) {
        await tx.restaurantTable.update({
          where: { id: existing.tableId },
          data: { status: "AVAILABLE" },
        });
      }
    } else if (updated.status === "COMPLETED") {
      await tx.kitchenOrder.updateMany({
        where: { orderId: id },
        data: { status: "COMPLETED" },
      });
      if (existing.tableId) {
        await tx.restaurantTable.update({
          where: { id: existing.tableId },
          data: { status: "AVAILABLE" },
        });
      }
    }

    return await tx.restaurantOrder.findUnique({
      where: { id },
      include: orderInclude,
    });
  });

  if (resOrder) {
    try {
      emitOrderStatusUpdate(resOrder);
      if (resOrder.tableId && (resOrder.status === "COMPLETED" || resOrder.status === "CANCELLED")) {
        emitTableStatusUpdated({
          id: resOrder.tableId,
          tableNumber: resOrder.table?.tableNumber,
          status: "AVAILABLE",
          restaurantId: resOrder.restaurantId,
        }, companyId);
      } else if (resOrder.tableId && (resOrder.status === "SERVED" || resOrder.status === "CONFIRMED" || resOrder.status === "PREPARING" || resOrder.status === "READY")) {
        emitTableStatusUpdated({
          id: resOrder.tableId,
          tableNumber: resOrder.table?.tableNumber,
          status: "OCCUPIED",
          restaurantId: resOrder.restaurantId,
        }, companyId);
      }
    } catch (err) {
      console.error("Socket emit error:", err);
    }
  }


  return resOrder;
};


export const processStockDeductionOnServed = async (orderId, tx) => {
  const db = tx || prisma;

  const order = await db.restaurantOrder.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          menuItem: {
            include: {
              recipe: {
                include: {
                  ingredients: {
                    include: {
                      product: {
                        include: {
                          unit: true,
                          inventories: {
                            include: {
                              warehouse: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order || order.stockDeducted) return;

  const defaultWh = await getOrCreateCompanyWarehouse(order.companyId, db);
  const fallbackWarehouseId = defaultWh?.id;

  const ingredientTotals = {};

  for (const item of order.items || []) {
    const recipe = item.menuItem?.recipe;
    if (recipe && recipe.ingredients && recipe.ingredients.length > 0) {
      for (const ing of recipe.ingredients) {
        if (!ing.product) continue;
        const itemQty = parseFloat(item.quantity) || 1;
        const ingQty = parseFloat(ing.quantity) || 0;
        const rawRequired = itemQty * ingQty;

        const recipeUnit = ing.unit || getProductStockUnit(ing.product);
        const stockUnit = getProductStockUnit(ing.product);
        const convertedQty = convertUnit(rawRequired, recipeUnit, stockUnit);

        if (!ingredientTotals[ing.productId]) {
          ingredientTotals[ing.productId] = {
            productId: ing.productId,
            productName: ing.product.name,
            recipeUnit,
            stockUnit,
            requiredQty: 0,
          };
        }
        ingredientTotals[ing.productId].requiredQty += convertedQty;
      }
    }
  }

  const prodIds = Object.keys(ingredientTotals);
  if (prodIds.length === 0) {
    await db.restaurantOrder.update({
      where: { id: orderId },
      data: { stockDeducted: true },
    });
    return;
  }

  for (const prodId of prodIds) {
    const info = ingredientTotals[prodId];

    // Find existing inventory record for this product under the company
    let inventory = await db.inventory.findFirst({
      where: {
        productId: prodId,
        warehouse: { companyId: order.companyId },
      },
    });

    const targetWhId = inventory?.warehouseId || fallbackWarehouseId;
    const currentStock = inventory ? parseFloat(inventory.quantity) : 0;
    const newStock = Math.max(0, currentStock - info.requiredQty);

    if (inventory) {
      await db.inventory.update({
        where: { id: inventory.id },
        data: { quantity: newStock },
      });
    } else if (targetWhId) {
      await db.inventory.create({
        data: {
          productId: prodId,
          warehouseId: targetWhId,
          quantity: newStock,
        },
      });
    }

    if (targetWhId) {
      await db.stockMovement.create({
        data: {
          companyId: order.companyId,
          productId: prodId,
          warehouseId: targetWhId,
          type: "RECIPE_CONSUMPTION",
          quantity: -info.requiredQty,
          referenceNo: order.orderNumber,
          remarks: `Recipe stock deduction for Restaurant Order ${order.orderNumber} (Served) - ${info.productName}`,
        },
      });
    }
  }

  await db.restaurantOrder.update({
    where: { id: orderId },
    data: { stockDeducted: true },
  });
};

export const checkStockAvailability = async (orderId, companyId, warehouseId) => {
  const order = await getOrderById(orderId, companyId);
  if (!order) throw new Error("Order not found or access denied.");

  const ingredientTotals = {};

  for (const item of order.items || []) {
    const recipe = item.menuItem?.recipe;
    if (recipe && recipe.ingredients && recipe.ingredients.length > 0) {
      for (const ing of recipe.ingredients) {
        if (!ing.product) continue;
        const itemQty = parseFloat(item.quantity) || 1;
        const ingQty = parseFloat(ing.quantity) || 0;
        const rawRequired = itemQty * ingQty;

        const recipeUnit = ing.unit || getProductStockUnit(ing.product);
        const stockUnit = getProductStockUnit(ing.product);
        const convertedRequired = convertUnit(rawRequired, recipeUnit, stockUnit);

        if (!ingredientTotals[ing.productId]) {
          ingredientTotals[ing.productId] = {
            productId: ing.productId,
            productName: ing.product.name || "Ingredient",
            stockUnit,
            recipeUnit,
            requiredQty: 0,
          };
        }
        ingredientTotals[ing.productId].requiredQty += convertedRequired;
      }
    }
  }

  const shortages = [];
  for (const prodId of Object.keys(ingredientTotals)) {
    const info = ingredientTotals[prodId];
    const availableStock = await getAvailableStockForProduct(prodId, order.companyId, warehouseId);

    if (availableStock < info.requiredQty) {
      const shortageQty = info.requiredQty - availableStock;
      shortages.push({
        productId: prodId,
        productName: info.productName,
        required: Number(info.requiredQty.toFixed(4)),
        available: Number(availableStock.toFixed(4)),
        shortage: Number(shortageQty.toFixed(4)),
        unit: info.stockUnit,
      });
    }
  }

  return {
    available: shortages.length === 0,
    shortages,
    warehouseId: warehouseId || null,
  };
};

export const confirmOrderAndSendKOT = async (orderId, companyId, warehouseId, allowStockOverride = false) => {
  const existing = await getOrderById(orderId, companyId);
  if (!existing) {
    const error = new Error("Order not found or access denied.");
    error.statusCode = 404;
    throw error;
  }

  const result = await prisma.$transaction(async (tx) => {
    const whereOrder = { id: orderId };
    if (companyId) whereOrder.companyId = companyId;

    const order = await tx.restaurantOrder.findFirst({
      where: whereOrder,
      include: {
        restaurant: true,
        table: true,
        items: {
          include: {
            menuItem: {
              include: {
                recipe: {
                  include: {
                    ingredients: {
                      include: {
                        product: {
                          include: {
                            unit: true,
                            inventories: {
                              include: {
                                warehouse: true,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) throw new Error("Order not found.");

    if (order.orderType === "DINE_IN" && (!order.tableId || !order.table)) {
      const err = new Error("Table selection is required before sending an order to the kitchen.");
      err.statusCode = 400;
      throw err;
    }

    if (!allowStockOverride) {
      const ingredientTotals = {};
      for (const item of order.items || []) {
        const recipe = item.menuItem?.recipe;
        if (recipe && recipe.ingredients && recipe.ingredients.length > 0) {
          for (const ing of recipe.ingredients) {
            if (!ing.product) continue;
            const itemQty = parseFloat(item.quantity) || 1;
            const ingQty = parseFloat(ing.quantity) || 0;
            const rawRequired = itemQty * ingQty;

            const recipeUnit = ing.unit || getProductStockUnit(ing.product);
            const stockUnit = getProductStockUnit(ing.product);
            const convertedRequired = convertUnit(rawRequired, recipeUnit, stockUnit);

            if (!ingredientTotals[ing.productId]) {
              ingredientTotals[ing.productId] = {
                productId: ing.productId,
                productName: ing.product.name || "Ingredient",
                stockUnit,
                recipeUnit,
                requiredQty: 0,
              };
            }
            ingredientTotals[ing.productId].requiredQty += convertedRequired;
          }
        }
      }

      const shortages = [];
      for (const prodId of Object.keys(ingredientTotals)) {
        const info = ingredientTotals[prodId];
        const availableStock = await getAvailableStockForProduct(prodId, order.companyId, warehouseId, tx);

        // Backend debugging log for tracing stock flow
        console.log(`[Restaurant Stock Validation] Tenant: ${order.companyId} | Ingredient: ${info.productName} (${prodId}) | Required: ${info.requiredQty} ${info.stockUnit} | Available: ${availableStock} ${info.stockUnit} | Result: ${availableStock >= info.requiredQty ? "PASS" : "FAIL"}`);

        if (availableStock < info.requiredQty) {
          const reqStr = Number(info.requiredQty.toFixed(3));
          const availStr = Number(availableStock.toFixed(3));
          const unitStr = info.stockUnit ? ` ${info.stockUnit}` : "";
          shortages.push(`${info.productName}: Required ${reqStr}${unitStr}, Available ${availStr}${unitStr}`);
        }
      }

      if (shortages.length > 0) {
        const error = new Error(`Insufficient stock for preparation:\n${shortages.join("\n")}`);
        error.statusCode = 400;
        throw error;
      }
    }

    const updatedOrder = await tx.restaurantOrder.update({
      where: { id: orderId },
      data: { status: "CONFIRMED" },
    });

    const countKOT = await tx.kitchenOrder.count({
      where: { restaurantId: order.restaurantId },
    });
    const kotNumber = `KOT-${(countKOT + 1).toString().padStart(4, "0")}`;

    const kot = await tx.kitchenOrder.create({
      data: {
        restaurantId: order.restaurantId,
        orderId: order.id,
        kotNumber,
        tableNumber: order.table?.tableNumber || null,
        orderType: order.orderType,
        status: "NEW",
        notes: order.notes,
        items: {
          create: order.items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            notes: item.notes,
            modifiers: item.modifiers,
            status: "NEW",
          })),
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    if (order.orderType === "DINE_IN" && order.tableId) {
      await tx.restaurantTable.update({
        where: { id: order.tableId },
        data: { status: "OCCUPIED" },
      });
    }

    return { order: updatedOrder, kot };
  });

  try {
    const fullOrderWhere = { id: orderId };
    if (companyId) fullOrderWhere.companyId = companyId;

    const fullOrder = await prisma.restaurantOrder.findFirst({
      where: fullOrderWhere,
      include: orderInclude,
    });
    const fullKot = await prisma.kitchenOrder.findUnique({
      where: { id: result.kot.id },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        order: {
          include: {
            table: true,
            customer: true,
          },
        },
        restaurant: true,
      },
    });
    if (fullOrder && fullKot) {
      emitKitchenOrderCreated(fullKot, fullOrder);
      if (fullOrder.tableId) {
        emitTableStatusUpdated({
          id: fullOrder.tableId,
          tableNumber: fullOrder.table?.tableNumber,
          status: "OCCUPIED",
          restaurantId: fullOrder.restaurantId,
        }, companyId);
      }
    } else if (fullOrder) {
      emitOrderStatusUpdate({ ...fullOrder, kot: result.kot });
    }
  } catch (err) {
    console.error("Socket emit error on confirmOrder:", err);
  }

  return result;
};


export const completeOrderAndPay = async (orderId, companyId, paymentData) => {
  const existing = await getOrderById(orderId, companyId);
  if (!existing) {
    const error = new Error("Order not found or access denied.");
    error.statusCode = 404;
    throw error;
  }

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.restaurantOrder.findFirst({
      where: { id: orderId, companyId },
      include: {
        table: true,
        items: true,
        payments: true,
      },
    });

    if (!order) throw new Error("Order not found.");

    if (order.status === "COMPLETED") {
      const existingPay = order.payments?.[0];
      return { order, payment: existingPay, alreadyCompleted: true };
    }

    const existingPaid = order.payments?.find((p) => p.status === "PAID");
    let payment = existingPaid || null;

    if (!payment && paymentData) {
      const payNumber = paymentData.paymentNumber || `PAY-RST-${Date.now().toString().slice(-6)}`;
      payment = await tx.payment.create({
        data: {
          companyId: order.companyId,
          branchId: order.branchId,
          customerId: order.customerId,
          restaurantOrderId: order.id,
          paymentNumber: payNumber,
          paymentDate: new Date(),
          amount: parseFloat(paymentData.amount || order.totalAmount),
          method: paymentData.method || "CASH",
          referenceNumber: paymentData.referenceNumber || null,
          status: "PAID",
          notes: paymentData.notes || `Payment for Restaurant Order ${order.orderNumber}`,
        },
      });
    }

    const updatedOrder = await tx.restaurantOrder.update({
      where: { id: orderId },
      data: { status: "COMPLETED" },
    });

    if (order.tableId && order.orderType === "DINE_IN") {
      await tx.restaurantTable.update({
        where: { id: order.tableId },
        data: { status: "AVAILABLE" },
      });
    }

    return { order: updatedOrder, payment };
  });

  try {
    const fullOrder = await prisma.restaurantOrder.findFirst({
      where: { id: orderId, companyId },
      include: orderInclude,
    });
    if (fullOrder) {
      emitOrderStatusUpdate(fullOrder);
      if (fullOrder.tableId) {
        emitTableStatusUpdated({
          id: fullOrder.tableId,
          tableNumber: fullOrder.table?.tableNumber,
          status: "AVAILABLE",
          restaurantId: fullOrder.restaurantId,
        }, companyId);
      }
    }
  } catch (err) {
    console.error("Socket emit error on completeOrder:", err);
  }

  return result;
};


export const cancelOrder = async (orderId, companyId, reason) => {
  const existing = await getOrderById(orderId, companyId);
  if (!existing) {
    const error = new Error("Order not found or access denied.");
    error.statusCode = 404;
    throw error;
  }

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.restaurantOrder.findFirst({
      where: { id: orderId, companyId },
    });

    if (!order) throw new Error("Order not found.");

    const updatedOrder = await tx.restaurantOrder.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
        notes: order.notes ? `${order.notes} | Cancelled: ${reason}` : `Cancelled: ${reason}`,
      },
    });

    if (order.tableId && order.orderType === "DINE_IN") {
      await tx.restaurantTable.update({
        where: { id: order.tableId },
        data: { status: "AVAILABLE" },
      });
    }

    await tx.kitchenOrder.updateMany({
      where: { orderId: order.id },
      data: { status: "CANCELLED" },
    });

    return updatedOrder;
  });

  try {
    const fullOrder = await prisma.restaurantOrder.findFirst({
      where: { id: orderId, companyId },
      include: orderInclude,
    });
    if (fullOrder) {
      emitOrderStatusUpdate(fullOrder);
      if (fullOrder.tableId) {
        emitTableStatusUpdated({
          id: fullOrder.tableId,
          tableNumber: fullOrder.table?.tableNumber,
          status: "AVAILABLE",
          restaurantId: fullOrder.restaurantId,
        }, companyId);
      }
    }
  } catch (err) {
    console.error("Socket emit error on cancelOrder:", err);
  }

  return result;
};

