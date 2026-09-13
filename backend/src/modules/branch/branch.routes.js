import express from "express";

import {
  addBranch,
  getBranches,
  getBranch,
  editBranch,
  deleteBranch,
} from "./branch.controller.js";

const router = express.Router();

// Add branch
router.post("/", addBranch);
router.get("/", getBranches);
router.get("/:id", getBranch);
router.put("/:id", editBranch);
router.delete("/:id", deleteBranch);

export default router;