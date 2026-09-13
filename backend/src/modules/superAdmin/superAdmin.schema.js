const superAdminSchema = {
  SystemStats: {
    type: "object",
    properties: {
      companyCount: { type: "integer", example: 42 },
      userCount: { type: "integer", example: 250 },
    },
  },
  ToggleCompanyStatus: {
    type: "object",
    required: ["status"],
    properties: {
      status: { type: "string", enum: ["ACTIVE", "INACTIVE"], example: "INACTIVE" },
    },
  },
};

export default superAdminSchema;
