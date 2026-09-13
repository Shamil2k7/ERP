import prisma from "../../config/prisma.js";

const commonInclude = {
  category: true,
  brand: true,
  unit: true,
  supplier: true,
  barcodes: true,
  variants: true,
  inventories: {
    include: {
      warehouse: true,
    },
  },
};

export const createProduct = async (data) => {
  const { variants, ...productData } = data;
  return await prisma.product.create({
    data: {
      ...productData,
      ...(variants && variants.length > 0
        ? {
            variants: {
              create: variants.map((v) => ({
                sku: v.sku || null,
                barcode: v.barcode || null,
                color: v.color || null,
                colorCode: v.colorCode || null,
                rollWidth: v.rollWidth ? parseFloat(v.rollWidth) : null,
                widthUnit: v.widthUnit || null,
                gsm: v.gsm ? parseFloat(v.gsm) : null,
                pattern: v.pattern || null,
                weaveType: v.weaveType || null,
                textureFinish: v.textureFinish || null,
                stock: v.stock ? parseFloat(v.stock) : 0,
                numberOfRolls: v.numberOfRolls ? parseInt(v.numberOfRolls) : 0,
                costPrice: v.costPrice ? parseFloat(v.costPrice) : null,
                sellingPrice: v.sellingPrice ? parseFloat(v.sellingPrice) : null,
                wholesalePrice: v.wholesalePrice ? parseFloat(v.wholesalePrice) : null,
                retailPrice: v.retailPrice ? parseFloat(v.retailPrice) : null,
              })),
            },
          }
        : {}),
    },
    include: commonInclude,
  });
};

export const getAllProducts = async (companyId) => {
  const where = {};
  if (companyId && companyId !== "ALL" && companyId !== "undefined" && companyId !== "null" && String(companyId).trim() !== "") {
    where.companyId = companyId;
  }
  return await prisma.product.findMany({
    where,
    include: commonInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getProductById = async (id) => {
  return await prisma.product.findUnique({
    where: {
      id,
    },
    include: commonInclude,
  });
};

export const getProductBySku = async (sku) => {
  return await prisma.product.findFirst({
    where: {
      sku,
    },
    include: commonInclude,
  });
};

export const updateProduct = async (id, data) => {
  const { variants, ...productData } = data;
  return await prisma.$transaction(async (tx) => {
    if (variants !== undefined) {
      // Replace variants if provided
      await tx.productVariant.deleteMany({
        where: { productId: id },
      });

      if (variants && variants.length > 0) {
        await tx.productVariant.createMany({
          data: variants.map((v) => ({
            productId: id,
            sku: v.sku || null,
            barcode: v.barcode || null,
            color: v.color || null,
            colorCode: v.colorCode || null,
            rollWidth: v.rollWidth ? parseFloat(v.rollWidth) : null,
            widthUnit: v.widthUnit || null,
            gsm: v.gsm ? parseFloat(v.gsm) : null,
            pattern: v.pattern || null,
            weaveType: v.weaveType || null,
            textureFinish: v.textureFinish || null,
            stock: v.stock ? parseFloat(v.stock) : 0,
            numberOfRolls: v.numberOfRolls ? parseInt(v.numberOfRolls) : 0,
            costPrice: v.costPrice ? parseFloat(v.costPrice) : null,
            sellingPrice: v.sellingPrice ? parseFloat(v.sellingPrice) : null,
            wholesalePrice: v.wholesalePrice ? parseFloat(v.wholesalePrice) : null,
            retailPrice: v.retailPrice ? parseFloat(v.retailPrice) : null,
          })),
        });
      }
    }

    return await tx.product.update({
      where: { id },
      data: productData,
      include: commonInclude,
    });
  });
};

export const deleteProduct = async (id) => {
  return await prisma.$transaction(async (tx) => {
    await tx.barcode.deleteMany({
      where: { productId: id },
    });

    await tx.productVariant.deleteMany({
      where: { productId: id },
    });

    await tx.inventory.deleteMany({
      where: { productId: id },
    });

    return await tx.product.delete({
      where: { id },
    });
  });
};

export const searchProducts = async (search) => {
  return await prisma.product.findMany({
    where: {
      OR: [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          sku: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          barcode: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          fabricComposition: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          pattern: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          color: {
            contains: search,
            mode: "insensitive",
          },
        },
      ],
    },
    include: commonInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
};