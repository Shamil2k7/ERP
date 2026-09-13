import * as reservationService from "./reservation.service.js";

export const createReservation = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    if (!companyId) {
      return res.status(403).json({ success: false, message: "Tenant context required." });
    }
    const reservation = await reservationService.createReservation(companyId, req.body);
    return res.status(201).json({ success: true, message: "Reservation created successfully", data: reservation });
  } catch (error) { next(error); }
};

export const getReservations = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    if (!companyId) {
      return res.status(200).json({ success: true, data: [] });
    }
    const { restaurantId, status, date } = req.query;
    const reservations = await reservationService.getReservations(companyId, restaurantId, status, date);
    return res.status(200).json({ success: true, data: reservations });
  } catch (error) { next(error); }
};

export const getReservationById = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const reservation = await reservationService.getReservationById(req.params.id, companyId);
    return res.status(200).json({ success: true, data: reservation });
  } catch (error) { next(error); }
};

export const updateReservation = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const reservation = await reservationService.updateReservation(req.params.id, companyId, req.body);
    return res.status(200).json({ success: true, message: "Reservation updated successfully", data: reservation });
  } catch (error) { next(error); }
};

export const updateReservationStatus = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const { status } = req.body;
    const reservation = await reservationService.updateReservationStatus(req.params.id, companyId, status);
    return res.status(200).json({ success: true, message: "Reservation status updated successfully", data: reservation });
  } catch (error) { next(error); }
};

export const deleteReservation = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    await reservationService.deleteReservation(req.params.id, companyId);
    return res.status(200).json({ success: true, message: "Reservation deleted successfully" });
  } catch (error) { next(error); }
};
