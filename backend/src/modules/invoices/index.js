import router from "./invoices.routes.js";
import * as controller from "./invoices.controller.js";
import * as service from "./invoices.service.js";
import * as repository from "./invoices.repository.js";
import * as validation from "./invoices.validation.js";
import * as schema from "./invoices.schema.js";

export {
  router,
  controller,
  service,
  repository,
  validation,
  schema,
};

export default router;