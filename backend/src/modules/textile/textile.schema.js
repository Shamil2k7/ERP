const textileSchema = {
  TextileProduct: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      companyId: { type: "string", format: "uuid" },
      name: { type: "string", example: "Cotton Silk Roll" },
      fabricType: { type: "string", example: "Cotton" },
      pattern: { type: "string", nullable: true },
      color: { type: "string", nullable: true },
      rollLengthMeters: { type: "number", example: 100 },
      pricePerMeter: { type: "number", example: 250 },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  CreateTextileProduct: {
    type: "object",
    required: ["name", "fabricType"],
    properties: {
      name: { type: "string" },
      fabricType: { type: "string" },
      pattern: { type: "string" },
      color: { type: "string" },
      rollLengthMeters: { type: "number" },
      pricePerMeter: { type: "number" },
    },
  },
  UpdateTextileProduct: {
    type: "object",
    properties: {
      name: { type: "string" },
      fabricType: { type: "string" },
      pattern: { type: "string" },
      color: { type: "string" },
      rollLengthMeters: { type: "number" },
      pricePerMeter: { type: "number" },
    },
  },
};

export default textileSchema;
