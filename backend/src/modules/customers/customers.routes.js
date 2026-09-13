import express from "express";
import * as controller from "./customers.controller.js";

const router = express.Router();

router.post("/", controller.createCustomer);
router.get("/", controller.getCustomers);
router.get("/:id", controller.getCustomerById);
router.put("/:id", controller.updateCustomer);
router.delete("/:id", controller.deleteCustomer);

export default router;