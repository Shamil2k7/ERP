const barcodeSchema = {
  Barcode: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: "uuid",
        example: "a1234567-b89c-4d5e-8f90-123456789abc",
      },
      productId: {
        type: "string",
        format: "uuid",
        example: "11111111-2222-3333-4444-555555555555",
      },
      barcode: {
        type: "string",
        example: "8901234567890",
      },
      type: {
        type: "string",
        example: "CODE128",
      },
      createdAt: {
        type: "string",
        format: "date-time",
      },
    },
  },

  CreateBarcode: {
    type: "object",
    required: [
      "productId",
      "barcode"
    ],
    properties: {
      productId: {
        type: "string",
        format: "uuid",
      },
      barcode: {
        type: "string",
        example: "8901234567890",
      },
      type: {
        type: "string",
        example: "CODE128",
      },
    },
  },

  UpdateBarcode: {
    type: "object",
    properties: {
      barcode: {
        type: "string",
        example: "8901234567891",
      },
      type: {
        type: "string",
        example: "EAN13",
      },
    },
  },
};

export default barcodeSchema;