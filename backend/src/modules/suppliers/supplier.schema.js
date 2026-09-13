const supplierSchema = {
  Supplier: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: "uuid",
        example: "a2f5b7d8-12ab-45cd-98ef-123456789abc",
      },
      companyName: {
        type: "string",
        example: "ABC Distributors",
      },
      contactPerson: {
        type: "string",
        example: "John Mathew",
      },
      email: {
        type: "string",
        example: "abc@gmail.com",
      },
      phone: {
        type: "string",
        example: "+919876543210",
      },
      address: {
        type: "string",
        example: "MG Road",
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
      taxNumber: {
        type: "string",
        example: "GST123456789",
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

  CreateSupplier: {
    type: "object",
    required: [
      "companyName",
      "phone"
    ],
    properties: {
      companyName: {
        type: "string",
        example: "ABC Distributors",
      },
      contactPerson: {
        type: "string",
        example: "John Mathew",
      },
      email: {
        type: "string",
        example: "abc@gmail.com",
      },
      phone: {
        type: "string",
        example: "+919876543210",
      },
      address: {
        type: "string",
        example: "MG Road",
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
      taxNumber: {
        type: "string",
        example: "GST123456789",
      },
      status: {
        type: "string",
        enum: ["ACTIVE", "INACTIVE"],
        example: "ACTIVE",
      },
    },
  },

  UpdateSupplier: {
    type: "object",
    properties: {
      companyName: {
        type: "string",
        example: "ABC Distributors Pvt Ltd",
      },
      contactPerson: {
        type: "string",
        example: "John Mathew",
      },
      email: {
        type: "string",
        example: "abc@gmail.com",
      },
      phone: {
        type: "string",
        example: "+919876543210",
      },
      address: {
        type: "string",
        example: "MG Road",
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
      taxNumber: {
        type: "string",
        example: "GST123456789",
      },
      status: {
        type: "string",
        enum: ["ACTIVE", "INACTIVE"],
      },
    },
  },
};

export default supplierSchema;