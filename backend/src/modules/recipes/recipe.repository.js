import prisma from "../../config/prisma.js";
import { convertUnit } from "../../utils/unitConverter.js";

export const upsertRecipe = async (companyId, menuItemId, data) => {
  if (!companyId) {
    const error = new Error("Tenant company context required.");
    error.statusCode = 403;
    throw error;
  }

  // Validate menuItem belongs to company
  const menuItem = await prisma.menuItem.findFirst({
    where: {
      id: menuItemId,
      restaurant: { companyId },
    },
  });

  if (!menuItem) {
    const error = new Error("Menu item not found or access denied.");
    error.statusCode = 404;
    throw error;
  }

  const { ingredients, ...recipeFields } = data;

  return await prisma.$transaction(async (tx) => {
    let recipe = await tx.recipe.findUnique({
      where: { menuItemId },
    });

    if (recipe) {
      await tx.recipeIngredient.deleteMany({
        where: { recipeId: recipe.id },
      });
      recipe = await tx.recipe.update({
        where: { id: recipe.id },
        data: recipeFields,
      });
    } else {
      recipe = await tx.recipe.create({
        data: {
          ...recipeFields,
          menuItemId,
        },
      });
    }

    let calculatedTotalCost = 0;

    if (ingredients && ingredients.length > 0) {
      for (const ing of ingredients) {
        // Validate ingredient product belongs to company
        const product = await tx.product.findFirst({
          where: { id: ing.productId, companyId },
          include: { unit: true },
        });

        const unitCost = product ? parseFloat(product.costPrice) || 0 : 0;
        const recipeUnit = ing.unit || product?.stockUnit || product?.unit?.code || product?.unit?.name || "unit";
        const stockUnit = product?.stockUnit || product?.unit?.code || product?.unit?.name || "unit";
        const convertedQty = convertUnit(parseFloat(ing.quantity || 0), recipeUnit, stockUnit);
        const ingCost = unitCost * convertedQty;
        calculatedTotalCost += ingCost;

        await tx.recipeIngredient.create({
          data: {
            recipeId: recipe.id,
            productId: ing.productId,
            quantity: parseFloat(ing.quantity),
            unit: ing.unit || product?.stockUnit || product?.unit?.code || "unit",
            cost: ingCost,
          },
        });
      }
    }

    const updatedRecipe = await tx.recipe.update({
      where: { id: recipe.id },
      data: {
        totalCost: calculatedTotalCost,
      },
      include: {
        ingredients: {
          include: {
            product: true,
          },
        },
        menuItem: true,
      },
    });

    await tx.menuItem.update({
      where: { id: menuItemId },
      data: { costPrice: calculatedTotalCost },
    });

    return updatedRecipe;
  });
};

export const getRecipeByMenuItem = async (companyId, menuItemId) => {
  if (!menuItemId) return null;

  const where = { menuItemId };
  if (companyId) {
    where.menuItem = {
      restaurant: { companyId },
    };
  }

  return await prisma.recipe.findFirst({
    where,
    include: {
      ingredients: {
        include: {
          product: true,
        },
      },
      menuItem: true,
    },
  });
};

export const getAllRecipes = async (companyId, restaurantId) => {
  if (!companyId) return [];

  const where = {
    menuItem: {
      restaurant: {
        companyId,
      },
    },
  };

  if (restaurantId && restaurantId !== "ALL" && restaurantId !== "undefined" && restaurantId !== "null" && String(restaurantId).trim() !== "") {
    where.menuItem.restaurantId = restaurantId;
  }

  return await prisma.recipe.findMany({
    where,
    include: {
      ingredients: {
        include: {
          product: true,
        },
      },
      menuItem: {
        include: {
          category: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const deleteRecipe = async (id, companyId) => {
  if (!id) return null;

  const existing = await prisma.recipe.findFirst({
    where: {
      id,
      menuItem: {
        restaurant: { companyId },
      },
    },
  });

  if (!existing) {
    const error = new Error("Recipe not found or access denied.");
    error.statusCode = 404;
    throw error;
  }

  return await prisma.recipe.delete({
    where: { id },
  });
};
