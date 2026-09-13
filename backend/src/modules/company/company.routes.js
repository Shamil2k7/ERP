import express from "express";
import {
  getIndustriesController,
  getDefaultModulesController,
  getAllCompaniesController,
} from "./company.controller.js";

const router = express.Router();

router.get("/industries", getIndustriesController);
router.get("/default-modules/:code", getDefaultModulesController);
router.get("/", getAllCompaniesController);

export default router;
