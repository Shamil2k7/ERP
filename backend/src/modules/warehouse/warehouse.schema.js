const warehouseSchema = {
  Warehouse: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: "uuid",
        example: "7b8f1d55-48e0-4f5d-9d4d-123456789abc",
      },
      name: {
        type: "string",
        example: "Main Warehouse",
      },
      code: {
        type: "string",
        example: "WH001",
      },
      address: {
        type: "string",
        example: "Industrial Area, Block A",
      },
      city: {
        type: "string",
        example: "Kochi",
      },
      state: {
        type: "string",
        example: "Kerala",
      },
      country: {
        type: "string",
        example: "India",
      },
      phone: {
        type: "string",
        example: "+919876543210",
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

  CreateWarehouse: {
    type: "object",
    required: ["name", "code"],
    properties: {
      name: {
        type: "string",
        example: "Main Warehouse",
      },
      code: {
        type: "string",
        example: "WH001",
      },
      address: {
        type: "string",
        example: "Industrial Area, Block A",
      },
      city: {
        type: "string",
        example: "Kochi",
      },
      state: {
        type: "string",
        example: "Kerala",
      },
      country: {
        type: "string",
        example: "India",
      },
      phone: {
        type: "string",
        example: "+919876543210",
      },
      status: {
        type: "string",
        enum: ["ACTIVE", "INACTIVE"],
        example: "ACTIVE",
      },
    },
  },

  UpdateWarehouse: {
    type: "object",
    properties: {
      name: {
        type: "string",
        example: "Central Warehouse",
      },
      code: {
        type: "string",
        example: "WH002",
      },
      address: {
        type: "string",
        example: "Industrial Area, Block B",
      },
      city: {
        type: "string",
        example: "Calicut",
      },
      state: {
        type: "string",
        example: "Kerala",
      },
      country: {
        type: "string",
        example: "India",
      },
      phone: {
        type: "string",
        example: "+919876543210",
      },
      status: {
        type: "string",
        enum: ["ACTIVE", "INACTIVE"],
      },
    },
  },
};

export default warehouseSchema;