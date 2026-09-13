import prisma from "../../config/prisma.js";

export const createModifierGroup = async (companyId, data) => {
  if (!companyId) {
    const error = new Error("Tenant company context required.");
    error.statusCode = 403;
    throw error;
  }

  // Validate restaurant belongs to company
  const restaurant = await prisma.restaurant.findFirst({
    where: { id: data.restaurantId, companyId },
  });
  if (!restaurant) {
    const error = new Error("Restaurant outlet not found or access denied.");
    error.statusCode = 404;
    throw error;
  }

  const { modifiers, ...groupData } = data;
  return await prisma.modifierGroup.create({
    data: {
      ...groupData,
      ...(modifiers && modifiers.length > 0
        ? {
            modifiers: {
              create: modifiers.map((m) => ({
                name: m.name,
                price: parseFloat(m.price || 0),
                status: m.status || "ACTIVE",
              })),
            },
          }
        : {}),
    },
    include: {
      modifiers: true,
      menuItems: {
        include: {
          menuItem: true,
        },
      },
    },
  });
};

export const getModifierGroups = async (companyId, restaurantId) => {
  if (!companyId) return [];

  const where = {
    restaurant: {
      companyId,
    },
  };

  if (restaurantId && restaurantId !== "ALL" && restaurantId !== "undefined" && restaurantId !== "null" && String(restaurantId).trim() !== "") {
    where.restaurantId = restaurantId;
  }

  return await prisma.modifierGroup.findMany({
    where,
    include: {
      modifiers: true,
      menuItems: {
        include: {
          menuItem: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getModifierGroupById = async (id, companyId) => {
  if (!id) return null;

  const where = { id };
  if (companyId) {
    where.restaurant = { companyId };
  }

  return await prisma.modifierGroup.findFirst({
    where,
    include: {
      modifiers: true,
      menuItems: {
        include: {
          menuItem: true,
        },
      },
    },
  });
};

export const updateModifierGroup = async (id, companyId, data) => {
  const existing = await getModifierGroupById(id, companyId);
  if (!existing) {
    const error = new Error("Modifier group not found or access denied.");
    error.statusCode = 404;
    throw error;
  }

  const { modifiers, ...groupData } = data;

  return await prisma.$transaction(async (tx) => {
    if (modifiers !== undefined) {
      await tx.modifier.deleteMany({
        where: { groupId: id },
      });
      if (modifiers.length > 0) {
        await tx.modifier.createMany({
          data: modifiers.map((m) => ({
            groupId: id,
            name: m.name,
            price: parseFloat(m.price || 0),
            status: m.status || "ACTIVE",
          })),
        });
      }
    }

    return await tx.modifierGroup.update({
      where: { id },
      data: groupData,
      include: {
        modifiers: true,
      },
    });
  });
};

export const linkMenuItemModifierGroup = async (companyId, menuItemId, modifierGroupId) => {
  // Validate menuItem and modifierGroup belong to company
  const menuItem = await prisma.menuItem.findFirst({
    where: { id: menuItemId, restaurant: { companyId } },
  });
  if (!menuItem) {
    const error = new Error("Menu item not found or access denied.");
    error.statusCode = 404;
    throw error;
  }

  const modifierGroup = await prisma.modifierGroup.findFirst({
    where: { id: modifierGroupId, restaurant: { companyId } },
  });
  if (!modifierGroup) {
    const error = new Error("Modifier group not found or access denied.");
    error.statusCode = 404;
    throw error;
  }

  return await prisma.menuItemModifierGroup.upsert({
    where: {
      menuItemId_modifierGroupId: {
        menuItemId,
        modifierGroupId,
      },
    },
    create: {
      menuItemId,
      modifierGroupId,
    },
    update: {},
  });
};

export const unlinkMenuItemModifierGroup = async (companyId, menuItemId, modifierGroupId) => {
  const menuItem = await prisma.menuItem.findFirst({
    where: { id: menuItemId, restaurant: { companyId } },
  });
  if (!menuItem) {
    const error = new Error("Menu item not found or access denied.");
    error.statusCode = 404;
    throw error;
  }

  return await prisma.menuItemModifierGroup.delete({
    where: {
      menuItemId_modifierGroupId: {
        menuItemId,
        modifierGroupId,
      },
    },
  });
};

export const deleteModifierGroup = async (id, companyId) => {
  const existing = await getModifierGroupById(id, companyId);
  if (!existing) {
    const error = new Error("Modifier group not found or access denied.");
    error.statusCode = 404;
    throw error;
  }

  return await prisma.modifierGroup.delete({
    where: { id },
  });
};
