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
    console.log("Incoming booking:", req.body);
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
    // Optimized aggregation pipeline returns only eventDate strings
    // Uses $match to filter active bookings, $project to select only eventDate
    // More efficient than fetching full objects and mapping
    const dates = await Booking.aggregate([
      {
        $match: {
          bookingStatus: { $ne: "cancelled" },
          eventDate: { $exists: true, $ne: null },
        },
      },
      {
        $project: {
          _id: 0,
          eventDate: 1,
        },
      },
      {
        $group: {
          _id: "$eventDate",
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          eventDate: "$_id",
          _id: 0,
        },
      },
    ]);

    const dateStrings = dates.map((doc) => doc.eventDate);

    return res.status(200).json({ data: dateStrings });
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
