import * as reservationRepository from "./reservation.repository.js";

export const createReservation = async (companyId, data) => {
  if (!data.restaurantId) throw new Error("Restaurant ID is required.");
  if (!data.reservationDate) throw new Error("Reservation date is required.");
  if (!data.reservationTime) throw new Error("Reservation time is required.");
  if (!data.numberOfGuests) throw new Error("Number of guests is required.");
  return await reservationRepository.createReservation(companyId, data);
};

export const getReservations = async (companyId, restaurantId, status, date) => {
  return await reservationRepository.getReservations(companyId, restaurantId, status, date);
};

export const getReservationById = async (id, companyId) => {
  const reservation = await reservationRepository.getReservationById(id, companyId);
  if (!reservation) {
    const error = new Error("Reservation not found or access denied.");
    error.statusCode = 404;
    throw error;
  }
  return reservation;
};

export const updateReservation = async (id, companyId, data) => {
  return await reservationRepository.updateReservation(id, companyId, data);
};

export const updateReservationStatus = async (id, companyId, status) => {
  return await reservationRepository.updateReservationStatus(id, companyId, status);
};

export const deleteReservation = async (id, companyId) => {
  return await reservationRepository.deleteReservation(id, companyId);
};
