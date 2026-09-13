const categorySchema = {
  Category: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: "uuid",
        example: "8d6f2a50-4f72-4f0b-a9e8-8b8f7d7c8a11",
      },
      name: {
        type: "string",
        example: "Electronics",
      },
      code: {
        type: "string",
        example: "ELEC",
      },
      description: {
        type: "string",
        example: "Electronic products",
      },
      image: {
        type: "string",
        example: "https://example.com/category.jpg",
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

  CreateCategory: {
    type: "object",
    required: ["name", "code"],
    properties: {
      name: {
        type: "string",
        example: "Electronics",
      },
      code: {
        type: "string",
        example: "ELEC",
      },
      description: {
        type: "string",
        example: "Electronic products",
      },
      image: {
        type: "string",
        example: "https://example.com/category.jpg",
      },
      status: {
        type: "string",
        enum: ["ACTIVE", "INACTIVE"],
        example: "ACTIVE",
      },
    },
  },

  UpdateCategory: {
    type: "object",
    properties: {
      name: {
        type: "string",
        example: "Electronics",
      },
      code: {
        type: "string",
        example: "ELEC",
      },
      description: {
        type: "string",
        example: "Electronic products",
      },
      image: {
        type: "string",
        example: "https://example.com/category.jpg",
      },
      status: {
        type: "string",
        enum: ["ACTIVE", "INACTIVE"],
        example: "ACTIVE",
      },
    },
  },
};

export default categorySchema;