const productSchema = {
  Product: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: "uuid",
        example: "9d4c0a95-9d84-4d1d-8f39-5ef8a6d7b123",
      },
      name: {
        type: "string",
        example: "Samsung Galaxy S25",
      },
      sku: {
        type: "string",
        example: "SAM-S25-001",
      },
      categoryId: {
        type: "string",
        format: "uuid",
        example: "5b2f4c19-3d48-4d15-a06f-0b4d9f2e2f44",
      },
      brandId: {
        type: "string",
        format: "uuid",
        nullable: true,
        example: "1c4e55e0-d18b-4d92-9e8d-2d78ab345678",
      },
      costPrice: {
        type: "number",
        example: 65000,
      },
      sellingPrice: {
        type: "number",
        example: 72000,
      },
      discountType: {
        type: "string",
        enum: ["PERCENT", "FIXED"],
        nullable: true,
        example: "PERCENT",
      },

      discountValue: {
        type: "number",
        nullable: true,
        example: 10,
      },
      unitId: {
        type: "string",
        format: "uuid",
        example: "9d4c0a95-9d84-4d1d-8f39-5ef8a6d7b123",
      },
      image: {
        type: "string",
        nullable: true,
        example: "https://example.com/images/product.jpg",
      },
      description: {
        type: "string",
        nullable: true,
        example: "Samsung flagship smartphone",
      },
      status: {
        type: "string",
        enum: ["ACTIVE", "INACTIVE"],
        example: "ACTIVE",
      },
      createdAt: {
        type: "string",
        format: "date-time",
      },
      updatedAt: {
        type: "string",
        format: "date-time",
      },
    },
  },

  CreateProduct: {
    type: "object",
    required: [
      "name",
      "sku",
      "categoryId",
      "costPrice",
      "sellingPrice",
    ],
    properties: {
      name: {
        type: "string",
        example: "Samsung Galaxy S25",
      },
      sku: {
        type: "string",
        example: "SAM-S25-001",
      },
      categoryId: {
        type: "string",
        format: "uuid",
      },
      brandId: {
        type: "string",
        format: "uuid",
      },
      costPrice: {
        type: "number",
        example: 65000,
      },
      sellingPrice: {
        type: "number",
        example: 72000,
      },
      discountType: {
        type: "string",
        enum: ["PERCENT", "FIXED"],
        example: "PERCENT",
      },

      discountValue: {
        type: "number",
        example: 10,
      },
      unitId: {
        type: "string",
        format: "uuid",
        example: "9d4c0a95-9d84-4d1d-8f39-5ef8a6d7b123",
      },
      image: {
        type: "string",
        example: "https://example.com/images/product.jpg",
      },
      description: {
        type: "string",
        example: "Samsung flagship smartphone",
      },
      status: {
        type: "string",
        enum: ["ACTIVE", "INACTIVE"],
        example: "ACTIVE",
      },
    },
  },

  UpdateProduct: {
    type: "object",
    properties: {
      name: {
        type: "string",
        example: "Samsung Galaxy S25 Ultra",
      },
      sku: {
        type: "string",
        example: "SAM-S25-002",
      },
      categoryId: {
        type: "string",
        format: "uuid",
      },
      brandId: {
        type: "string",
        format: "uuid",
      },
      costPrice: {
        type: "number",
        example: 70000,
      },
      sellingPrice: {
        type: "number",
        example: 78000,
      },
      discountType: {
        type: "string",
        enum: ["PERCENT", "FIXED"],
        example: "PERCENT",
      },

      discountValue: {
        type: "number",
        example: 500,
      },
      unitId: {
        type: "string",
        format: "uuid",
        example: "9d4c0a95-9d84-4d1d-8f39-5ef8a6d7b123",
      },
      image: {
        type: "string",
      },
      description: {
        type: "string",
      },
      status: {
        type: "string",
        enum: ["ACTIVE", "INACTIVE"],
      },
    },
  },
};

export default productSchema;