"use strict";

const Booking = require("../models/Booking");

const getDateRange = (eventDate) => {
  const date = new Date(eventDate);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const createBooking = async (req, res) => {
  try {
    const { eventDate } = req.body;

    if (!eventDate) {
      return res.status(400).json({ message: "Event date is required" });
    }

    const range = getDateRange(eventDate);
    if (!range) {
      return res.status(400).json({ message: "Invalid event date" });
    }

    const existingBooking = await Booking.findOne({
      eventDate: { $gte: range.start, $lte: range.end },
      bookingStatus: { $ne: "cancelled" },
    });

    if (existingBooking) {
      return res.status(409).json({ message: "Date already booked" });
    }

    const booking = await Booking.create(req.body);
    return res.status(201).json({ data: booking });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to create booking", error: error.message });
  }
};

const getAllBookings = async (_req, res) => {
  try {
    const bookings = await Booking.find().sort({ eventDate: 1, createdAt: -1 });
    return res.status(200).json({ data: bookings });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch bookings", error: error.message });
  }
};

const checkDateBooked = async (req, res) => {
  try {
    const { eventDate } = req.query;

    if (!eventDate) {
      return res.status(400).json({ message: "Event date is required" });
    }

    const range = getDateRange(eventDate);
    if (!range) {
      return res.status(400).json({ message: "Invalid event date" });
    }

    const existingBooking = await Booking.findOne({
      eventDate: { $gte: range.start, $lte: range.end },
      bookingStatus: { $ne: "cancelled" },
    });

    return res.status(200).json({ booked: Boolean(existingBooking) });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to check date", error: error.message });
  }
};

const getBookedDates = async (_req, res) => {
  try {
    const bookings = await Booking.find({ bookingStatus: { $ne: "cancelled" } })
      .select("eventDate -_id")
      .lean();

    const dates = bookings.map((booking) => booking.eventDate).filter(Boolean);

    return res.status(200).json({ data: dates });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch booked dates", error: error.message });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const incomingStatus = req.body.bookingStatus || req.body.status;

    const allowedStatuses = ["pending", "confirmed", "cancelled"];
    if (!allowedStatuses.includes(incomingStatus)) {
      return res.status(400).json({
        message: "Invalid status. Use pending, confirmed, or cancelled.",
      });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      { bookingStatus: incomingStatus },
      { new: true, runValidators: true },
    );

    if (!updatedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    return res.status(200).json({ data: updatedBooking });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update booking status",
      error: error.message,
    });
  }
};

module.exports = {
  createBooking,
  getAllBookings,
  checkDateBooked,
  getBookedDates,
  updateBookingStatus,
};
