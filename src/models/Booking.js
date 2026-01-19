"use strict";

const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, "Name is required"],
    minlength: [2, "Name must be at least 2 characters"],
    maxlength: [100, "Name must be at most 100 characters"],
  },
  phone: {
    type: String,
    trim: true,
    required: [true, "Phone is required"],
    minlength: [7, "Phone must be at least 7 digits"],
    maxlength: [20, "Phone must be at most 20 characters"],
  },
  eventType: {
    type: String,
    required: [true, "Event type is required"],
    enum: {
      values: ["wedding", "reception", "other"],
      message: "Event type must be wedding, reception, or other",
    },
  },
  eventDate: {
    type: Date,
    required: [true, "Event date is required"],
  },
  guestCount: {
    type: Number,
    required: [true, "Guest count is required"],
    min: [1, "Guest count must be at least 1"],
    max: [10000, "Guest count must be at most 10000"],
  },
  bookingStatus: {
    type: String,
    required: [true, "Booking status is required"],
    enum: {
      values: ["pending", "confirmed", "cancelled"],
      message: "Booking status must be pending, confirmed, or cancelled",
    },
    default: "pending",
  },
  paymentStatus: {
    type: String,
    required: [true, "Payment status is required"],
    enum: {
      values: ["unpaid", "paid"],
      message: "Payment status must be unpaid or paid",
    },
    default: "unpaid",
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
});

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
