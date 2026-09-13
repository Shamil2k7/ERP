import { departmentSchema } from "./department.schema.js";

const validateDepartment = (req, res, next) => {
  const { error } = departmentSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  next();
};

export { validateDepartment };
