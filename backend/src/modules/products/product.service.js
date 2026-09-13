import * as productRepository from "./product.repository.js";
import * as categoryRepository from "../categories/category.repository.js";
import * as brandRepository from "../brands/brand.repository.js";
import * as unitRepository from "../units/unit.repository.js";
import * as barcodeService from "../barcode/barcode.service.js";
import prisma from "../../config/prisma.js";

export const createProduct = async (data) => {
  let categoryId = data.categoryId;
  if (categoryId) {
    const category = await categoryRepository.getCategoryById(categoryId).catch(() => null);
    if (!category) categoryId = null;
  }
  if (!categoryId) {
    let defaultCat = await categoryRepository.getAllCategories().then((cats) => cats[0]).catch(() => null);
    if (!defaultCat) {
      defaultCat = await categoryRepository.createCategory({ name: "General", code: "GEN" }).catch(() => null);
    }
    if (defaultCat) categoryId = defaultCat.id;
  }

  let unitId = data.unitId || data.baseUnitId;
  if (unitId) {
    const unit = await unitRepository.getUnitById(unitId).catch(() => null);
    if (!unit) unitId = null;
  }
  if (!unitId) {
    let defaultUnit = await unitRepository.getAllUnits().then((units) => units[0]).catch(() => null);
    if (!defaultUnit) {
      defaultUnit = await unitRepository.createUnit({ name: "Pieces", code: "PCS" }).catch(() => null);
    }
    if (defaultUnit) unitId = defaultUnit.id;
  }

  let brandId = data.brandId || null;
  if (brandId) {
    const brand = await brandRepository.getBrandById(brandId).catch(() => null);
    if (!brand) brandId = null;
  }

  let supplierId = data.supplierId || null;

  let variants = data.variants;
  if (typeof variants === "string") {
    try {
      variants = JSON.parse(variants);
    } catch (e) {
      variants = [];
    }
  }

  const sku = data.sku || `SKU-${Date.now().toString().slice(-6)}`;

  const cleanData = {
    name: data.name,
    sku,
    barcode: data.barcode || null,
    description: data.description || "",
    costPrice: parseFloat(data.costPrice || 0),
    sellingPrice: parseFloat(data.sellingPrice || 0),
    wholesalePrice: data.wholesalePrice ? parseFloat(data.wholesalePrice) : null,
    retailPrice: data.retailPrice ? parseFloat(data.retailPrice) : null,
    discountType: data.discountType || null,
    discountValue: data.discountValue ? parseFloat(data.discountValue) : null,
    taxRate: data.taxRate ? parseFloat(data.taxRate) : null,
    image: data.image || null,
    status: data.status || "ACTIVE",
    companyId: data.companyId || null,
    categoryId,
    subcategory: data.subcategory || null,
    unitId,
    ...(brandId ? { brandId } : {}),
    ...(supplierId ? { supplierId } : {}),

    // Fabric Specs
    isTextile: data.isTextile !== undefined ? Boolean(data.isTextile) : Boolean(data.fabricComposition || data.gsm || (data.sku && (data.sku.startsWith("TEX-") || data.sku.startsWith("FAB-")))),
    fabricComposition: data.fabricComposition || null,
    gsm: data.gsm ? parseFloat(data.gsm) : null,
    rollWidth: data.rollWidth ? parseFloat(data.rollWidth) : null,
    widthUnit: data.widthUnit || "Inches",
    color: data.color || null,
    colorCode: data.colorCode || null,
    pattern: data.pattern || null,
    weaveType: data.weaveType || null,
    textureFinish: data.textureFinish || null,

    // Inventory Details
    stockUnit: data.stockUnit || null,
    initialStock: data.initialStock ? parseFloat(data.initialStock) : 0,
    openingStockDate: data.openingStockDate ? new Date(data.openingStockDate) : null,
    reorderLevel: data.reorderLevel ? parseInt(data.reorderLevel) : 0,
    minimumStock: data.minimumStock ? parseInt(data.minimumStock) : 0,
    maximumStock: data.maximumStock ? parseInt(data.maximumStock) : null,
    warehouseLocation: data.warehouseLocation || null,
    rackLocation: data.rackLocation || null,
    numberOfRolls: data.numberOfRolls ? parseInt(data.numberOfRolls) : 0,

    // Supplier Details
    supplierProductCode: data.supplierProductCode || null,
    leadTime: data.leadTime ? parseInt(data.leadTime) : null,
    hasVariants: Boolean(data.hasVariants || (Array.isArray(variants) && variants.length > 0)),
    variants: Array.isArray(variants) ? variants : [],

    // Restaurant Raw Material Details
    purchaseUnit: data.purchaseUnit || null,
    conversionFactor: data.conversionFactor ? parseFloat(data.conversionFactor) : 1,
    reorderQuantity: data.reorderQuantity ? parseFloat(data.reorderQuantity) : 0,
    averageCost: data.averageCost !== undefined ? parseFloat(data.averageCost) : (data.costPrice ? parseFloat(data.costPrice) : 0),
    lastPurchaseCost: data.lastPurchaseCost !== undefined ? parseFloat(data.lastPurchaseCost) : (data.costPrice ? parseFloat(data.costPrice) : 0),
    supplierReference: data.supplierReference || data.supplierProductCode || null,
    restaurantOutletId: data.restaurantOutletId || data.restaurantId || null,
    defaultStorageLocation: data.defaultStorageLocation || data.warehouseLocation || null,
    storageType: data.storageType || null,
    isPerishable: data.isPerishable !== undefined ? Boolean(data.isPerishable) : false,
    isExpiryTracking: data.isExpiryTracking !== undefined ? Boolean(data.isExpiryTracking) : false,
    isBatchTracking: data.isBatchTracking !== undefined ? Boolean(data.isBatchTracking) : false,
  };

  const product = await productRepository.createProduct(cleanData);

  // Initialize Inventory record in selected/default Warehouse
  try {
    let warehouse = null;
    if (data.warehouseId) {
      warehouse = await prisma.warehouse.findFirst({
        where: { id: data.warehouseId, companyId: cleanData.companyId || undefined },
      });
    }
    if (!warehouse) {
      warehouse = await prisma.warehouse.findFirst({
        where: { companyId: cleanData.companyId || undefined },
      });
    }
    if (!warehouse) {
      warehouse = await prisma.warehouse.create({
        data: {
          name: "Main Warehouse",
          code: "WH-MAIN",
          location: "Main Store",
          companyId: cleanData.companyId || null,
          status: "ACTIVE",
        },
      });
    }
    if (warehouse && !cleanData.warehouseLocation) {
      await prisma.product.update({
        where: { id: product.id },
        data: { warehouseLocation: warehouse.name },
      }).catch(() => {});
    }
    const initialQty = cleanData.initialStock ? parseFloat(cleanData.initialStock) : 0;
    await prisma.inventory.create({
      data: {
        productId: product.id,
        warehouseId: warehouse.id,
        quantity: initialQty,
        reorderLevel: cleanData.reorderLevel ? parseInt(cleanData.reorderLevel) : 10,
        minimumStock: cleanData.minimumStock ? parseInt(cleanData.minimumStock) : 0,
        maximumStock: cleanData.maximumStock ? parseInt(cleanData.maximumStock) : 1000,
      },
    });

    if (initialQty > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          warehouseId: warehouse.id,
          companyId: cleanData.companyId || null,
          type: "IN",
          quantity: initialQty,
          referenceType: "OPENING_STOCK",
          reason: "Opening Stock Initialization",
          date: cleanData.openingStockDate || new Date(),
        },
      }).catch(() => {});
    }
  } catch (invErr) {
    // Inventory initialization soft notice
  }

  if (data.barcode || !product.barcodes || product.barcodes.length === 0) {
    try {
      const barcodeVal = data.barcode || product.sku;
      await barcodeService.createBarcodeForProduct(product.id, barcodeVal);
    } catch (err) {
      // Barcode generation soft fallback
    }
  }

  return await productRepository.getProductById(product.id);
};

export const getAllProducts = async (companyId) => {
  return await productRepository.getAllProducts(companyId);
};

export const getProductById = async (id) => {
  const product = await productRepository.getProductById(id);

  if (!product) {
    throw new Error("Product not found.");
  }

  return product;
};

export const searchProducts = async (search) => {
  return await productRepository.searchProducts(search);
};

export const updateProduct = async (id, data) => {
  const product = await productRepository.getProductById(id);

  if (!product) {
    throw new Error("Product not found.");
  }

  if (data.categoryId) {
    const category = await categoryRepository.getCategoryById(data.categoryId);
    if (!category) {
      throw new Error("Category not found.");
    }
  }

  if (data.brandId) {
    const brand = await brandRepository.getBrandById(data.brandId);
    if (!brand) {
      throw new Error("Brand not found.");
    }
  }

  if (data.unitId) {
    const unit = await unitRepository.getUnitById(data.unitId);
    if (!unit) {
      throw new Error("Unit not found.");
    }
  }

  if (data.sku && data.sku !== product.sku) {
    const existingProduct = await productRepository.getProductBySku(data.sku);
    if (existingProduct) {
      throw new Error("SKU already exists.");
    }
  }

  let variants = data.variants;
  if (typeof variants === "string") {
    try {
      variants = JSON.parse(variants);
    } catch (e) {
      variants = undefined;
    }
  }

  const cleanUpdate = {
    ...(data.name && { name: data.name }),
    ...(data.sku && { sku: data.sku }),
    ...(data.barcode !== undefined && { barcode: data.barcode }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.costPrice !== undefined && { costPrice: parseFloat(data.costPrice) }),
    ...(data.sellingPrice !== undefined && { sellingPrice: parseFloat(data.sellingPrice) }),
    ...(data.wholesalePrice !== undefined && { wholesalePrice: data.wholesalePrice ? parseFloat(data.wholesalePrice) : null }),
    ...(data.retailPrice !== undefined && { retailPrice: data.retailPrice ? parseFloat(data.retailPrice) : null }),
    ...(data.discountType !== undefined && { discountType: data.discountType }),
    ...(data.discountValue !== undefined && { discountValue: data.discountValue ? parseFloat(data.discountValue) : null }),
    ...(data.taxRate !== undefined && { taxRate: data.taxRate ? parseFloat(data.taxRate) : null }),
    ...(data.image !== undefined && { image: data.image }),
    ...(data.status && { status: data.status }),
    ...(data.categoryId && { categoryId: data.categoryId }),
    ...(data.subcategory !== undefined && { subcategory: data.subcategory }),
    ...(data.unitId && { unitId: data.unitId }),
    ...(data.brandId !== undefined && { brandId: data.brandId || null }),
    ...(data.supplierId !== undefined && { supplierId: data.supplierId || null }),

    // Fabric Specs
    ...(data.fabricComposition !== undefined && { fabricComposition: data.fabricComposition }),
    ...(data.gsm !== undefined && { gsm: data.gsm ? parseFloat(data.gsm) : null }),
    ...(data.rollWidth !== undefined && { rollWidth: data.rollWidth ? parseFloat(data.rollWidth) : null }),
    ...(data.widthUnit !== undefined && { widthUnit: data.widthUnit }),
    ...(data.color !== undefined && { color: data.color }),
    ...(data.colorCode !== undefined && { colorCode: data.colorCode }),
    ...(data.pattern !== undefined && { pattern: data.pattern }),
    ...(data.weaveType !== undefined && { weaveType: data.weaveType }),
    ...(data.textureFinish !== undefined && { textureFinish: data.textureFinish }),

    // Inventory Details
    ...(data.stockUnit !== undefined && { stockUnit: data.stockUnit }),
    ...(data.initialStock !== undefined && { initialStock: data.initialStock ? parseFloat(data.initialStock) : 0 }),
    ...(data.openingStockDate !== undefined && { openingStockDate: data.openingStockDate ? new Date(data.openingStockDate) : null }),
    ...(data.reorderLevel !== undefined && { reorderLevel: data.reorderLevel ? parseInt(data.reorderLevel) : 0 }),
    ...(data.minimumStock !== undefined && { minimumStock: data.minimumStock ? parseInt(data.minimumStock) : 0 }),
    ...(data.maximumStock !== undefined && { maximumStock: data.maximumStock ? parseInt(data.maximumStock) : null }),
    ...(data.warehouseLocation !== undefined && { warehouseLocation: data.warehouseLocation }),
    ...(data.rackLocation !== undefined && { rackLocation: data.rackLocation }),
    ...(data.numberOfRolls !== undefined && { numberOfRolls: data.numberOfRolls ? parseInt(data.numberOfRolls) : 0 }),

    // Supplier Details
    ...(data.supplierProductCode !== undefined && { supplierProductCode: data.supplierProductCode }),
    ...(data.leadTime !== undefined && { leadTime: data.leadTime ? parseInt(data.leadTime) : null }),
    ...(data.hasVariants !== undefined && { hasVariants: Boolean(data.hasVariants) }),
    ...(variants !== undefined && { variants: Array.isArray(variants) ? variants : [] }),

    // Restaurant Raw Material Details
    ...(data.purchaseUnit !== undefined && { purchaseUnit: data.purchaseUnit }),
    ...(data.conversionFactor !== undefined && { conversionFactor: data.conversionFactor ? parseFloat(data.conversionFactor) : 1 }),
    ...(data.reorderQuantity !== undefined && { reorderQuantity: data.reorderQuantity ? parseFloat(data.reorderQuantity) : 0 }),
    ...(data.averageCost !== undefined && { averageCost: data.averageCost ? parseFloat(data.averageCost) : 0 }),
    ...(data.lastPurchaseCost !== undefined && { lastPurchaseCost: data.lastPurchaseCost ? parseFloat(data.lastPurchaseCost) : 0 }),
    ...(data.supplierReference !== undefined && { supplierReference: data.supplierReference }),
    ...(data.restaurantOutletId !== undefined && { restaurantOutletId: data.restaurantOutletId }),
    ...(data.defaultStorageLocation !== undefined && { defaultStorageLocation: data.defaultStorageLocation }),
    ...(data.storageType !== undefined && { storageType: data.storageType }),
    ...(data.isPerishable !== undefined && { isPerishable: Boolean(data.isPerishable) }),
    ...(data.isExpiryTracking !== undefined && { isExpiryTracking: Boolean(data.isExpiryTracking) }),
    ...(data.isBatchTracking !== undefined && { isBatchTracking: Boolean(data.isBatchTracking) }),
  };

  if (data.warehouseId) {
    const warehouse = await prisma.warehouse.findFirst({
      where: { id: data.warehouseId, companyId: product.companyId || undefined },
    });
    if (warehouse) {
      cleanUpdate.warehouseLocation = warehouse.name;
      const existingInv = await prisma.inventory.findFirst({
        where: { productId: id },
      });
      if (existingInv) {
        await prisma.inventory.update({
          where: { id: existingInv.id },
          data: { warehouseId: warehouse.id },
        }).catch(() => {});
      } else {
        await prisma.inventory.create({
          data: {
            productId: id,
            warehouseId: warehouse.id,
            quantity: cleanUpdate.initialStock !== undefined ? cleanUpdate.initialStock : (product.initialStock || 0),
            reorderLevel: cleanUpdate.reorderLevel !== undefined ? cleanUpdate.reorderLevel : (product.reorderLevel || 10),
            minimumStock: cleanUpdate.minimumStock !== undefined ? cleanUpdate.minimumStock : (product.minimumStock || 0),
            maximumStock: cleanUpdate.maximumStock !== undefined ? cleanUpdate.maximumStock : (product.maximumStock || 1000),
          },
        }).catch(() => {});
      }
    }
  }

  return await productRepository.updateProduct(id, cleanUpdate);
};

export const deleteProduct = async (id) => {
  const product = await productRepository.getProductById(id);

  if (!product) {
    throw new Error("Product not found.");
  }

  return await productRepository.deleteProduct(id);
};