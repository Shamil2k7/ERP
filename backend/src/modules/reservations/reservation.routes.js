import { Router } from "express";
import * as reservationController from "./reservation.controller.js";

const router = Router();

router.post("/", reservationController.createReservation);
router.get("/", reservationController.getReservations);
router.get("/:id", reservationController.getReservationById);
router.put("/:id", reservationController.updateReservation);
router.patch("/:id/status", reservationController.updateReservationStatus);
router.delete("/:id", reservationController.deleteReservation);

export default router;
