import prisma from "../../config/prisma.js";
import { convertUnit } from "../../utils/unitConverter.js";

export const getFoodCostingReport = async (companyId, restaurantId) => {
  if (!companyId) return [];

  const where = {
    restaurant: {
      companyId,
    },
  };

  if (restaurantId && restaurantId !== "ALL" && restaurantId !== "undefined" && restaurantId !== "null" && String(restaurantId).trim() !== "") {
    where.restaurantId = restaurantId;
  }

  const menuItems = await prisma.menuItem.findMany({
    where,
    include: {
      category: true,
      recipe: {
        include: {
          ingredients: {
            include: {
              product: {
                include: {
                  unit: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return menuItems.map((item) => {
    const sellingPrice = parseFloat(item.sellingPrice) || 0;
    let calculatedCost = 0;

    if (item.recipe && item.recipe.ingredients) {
      calculatedCost = item.recipe.ingredients.reduce((sum, ing) => {
        const prodCost = parseFloat(ing.product?.costPrice) || 0;
        const recipeUnit = ing.unit || ing.product?.stockUnit || ing.product?.unit?.code || ing.product?.unit?.name || "unit";
        const stockUnit = ing.product?.stockUnit || ing.product?.unit?.code || ing.product?.unit?.name || "unit";
        const convertedQty = convertUnit(ing.quantity || 0, recipeUnit, stockUnit);
        return sum + prodCost * convertedQty;
      }, 0);
    } else {
      calculatedCost = parseFloat(item.costPrice) || 0;
    }

    const grossMargin = sellingPrice - calculatedCost;
    const foodCostPercentage = sellingPrice > 0 ? (calculatedCost / sellingPrice) * 100 : 0;

    return {
      menuItemId: item.id,
      name: item.name,
      categoryName: item.category?.name || "Uncategorized",
      sellingPrice,
      recipeCost: calculatedCost,
      grossMargin,
      foodCostPercentage: parseFloat(foodCostPercentage.toFixed(2)),
      hasRecipe: Boolean(item.recipe),
      ingredientCount: item.recipe?.ingredients?.length || 0,
    };
  });
};
