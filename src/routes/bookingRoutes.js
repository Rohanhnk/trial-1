"use strict";

const express = require("express");
const {
  createBooking,
  getAllBookings,
  checkDateBooked,
  getBookedDates,
  updateBookingStatus,
} = require("../controllers/bookingController");

const router = express.Router();

router.post("/bookings", createBooking);
router.get("/bookings", getAllBookings);
router.get("/bookings/dates", getBookedDates);
router.patch("/bookings/:id/status", updateBookingStatus);
router.get("/bookings/check-date", (req, res) => {
  if (req.query.date && !req.query.eventDate) {
    req.query.eventDate = req.query.date;
  }
  return checkDateBooked(req, res);
});

module.exports = router;
