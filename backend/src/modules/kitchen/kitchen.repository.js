import prisma from "../../config/prisma.js";
import { processStockDeductionOnServed } from "../restaurantOrders/restaurantOrder.repository.js";
import { emitOrderStatusUpdate, emitKitchenOrderUpdated } from "../../config/socket.js";


const kotInclude = {
  restaurant: true,
  order: {
    include: {
      table: {
        include: {
          area: true,
        },
      },
      customer: true,
    },
  },
  items: {
    include: {
      menuItem: true,
    },
  },
};

export const getKitchenOrders = async (companyId, restaurantId, status) => {
  if (!companyId) return [];

  const where = {
    restaurant: {
      companyId,
    },
  };

  if (restaurantId && restaurantId !== "ALL" && restaurantId !== "undefined" && restaurantId !== "null" && String(restaurantId).trim() !== "") {
    where.restaurantId = restaurantId;
  }

  if (status && status !== "ALL" && status !== "ACTIVE" && status !== "undefined" && status !== "null") {
    where.status = status;
  } else if (!status || status === "ACTIVE") {
    where.status = {
      in: ["NEW", "PREPARING"],
    };
  }


  return await prisma.kitchenOrder.findMany({
    where,
    include: kotInclude,
    orderBy: { createdAt: "desc" },
  });
};

export const getKitchenOrderById = async (id, companyId) => {
  if (!id) return null;

  const where = { id };
  if (companyId) {
    where.restaurant = { companyId };
  }

  return await prisma.kitchenOrder.findFirst({
    where,
    include: kotInclude,
  });
};

export const updateKOTStatus = async (id, companyId, status) => {
  const existing = await getKitchenOrderById(id, companyId);
  if (!existing) {
    const error = new Error("Kitchen order ticket not found or access denied.");
    error.statusCode = 404;
    throw error;
  }

  const kot = await prisma.$transaction(async (tx) => {
    const updatedKot = await tx.kitchenOrder.update({
      where: { id },
      data: { status },
      include: kotInclude,
    });

    let targetOrderItemsStatus = "PENDING";
    let targetOrderStatus = null;

    if (status === "PREPARING") {
      targetOrderItemsStatus = "PREPARING";
      targetOrderStatus = "PREPARING";
    } else if (status === "READY") {
      targetOrderItemsStatus = "READY";
      targetOrderStatus = "READY";
    } else if (status === "SERVED") {
      targetOrderItemsStatus = "SERVED";
      targetOrderStatus = "SERVED";
    }

    if (targetOrderStatus) {
      await tx.restaurantOrder.update({
        where: { id: updatedKot.orderId },
        data: { status: targetOrderStatus },
      });

      await tx.restaurantOrderItem.updateMany({
        where: { orderId: updatedKot.orderId },
        data: { status: targetOrderItemsStatus },
      });

      if (targetOrderStatus === "SERVED") {
        await processStockDeductionOnServed(updatedKot.orderId, tx);
      }
    }

    return updatedKot;
  });

  if (kot?.orderId) {
    try {
      const fullOrder = await prisma.restaurantOrder.findFirst({
        where: { id: kot.orderId, companyId },
        include: {
          restaurant: true,
          table: { include: { area: true } },
          customer: true,
          items: { include: { menuItem: true } },
        },
      });
      if (fullOrder) {
        emitKitchenOrderUpdated(kot, fullOrder);
      }
    } catch (emitErr) {
      console.error("Failed to emit socket event after KOT update:", emitErr);
    }
  }

  return kot;
};

