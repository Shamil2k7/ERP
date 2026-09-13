
import { addEmployeeSchema } from "./employees.schema.js";

const validateAddEmployee = (req, res, next) => {
  const { error } = addEmployeeSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  next();
};

export {
  validateAddEmployee,
};
