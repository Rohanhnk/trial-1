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

// Create booking
router.post("/", createBooking);

// Get all bookings
router.get("/", getAllBookings);

// Calendar blocked dates
router.get("/dates", getBookedDates);

// Update booking status
router.patch("/:id/status", updateBookingStatus);

// Check date availability
router.get("/check-date", checkDateBooked);

module.exports = router;
