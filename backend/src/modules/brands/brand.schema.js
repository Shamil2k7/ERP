const brandSchema = {
  Brand: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: "uuid",
        example: "c9e3a5d0-8c18-4fd0-91d4-8e7e4f1b2a21",
      },
      name: {
        type: "string",
        example: "Samsung",
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

  CreateBrand: {
    type: "object",
    required: ["name"],
    properties: {
      name: {
        type: "string",
        example: "Samsung",
      },
    },
  },

  UpdateBrand: {
    type: "object",
    properties: {
      name: {
        type: "string",
        example: "Apple",
      },
    },
  },
};

export default brandSchema;