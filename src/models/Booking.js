"use strict";

const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, "Name is required"],
    minlength: 2,
    maxlength: 100,
  },

  phone: {
    type: String,
    trim: true,
    required: [true, "Phone is required"],
    minlength: 7,
    maxlength: 20,
  },

  eventType: {
    type: String,
    required: [true, "Event type is required"],
    enum: ["wedding", "reception", "other"],
  },

  eventDate: {
    type: Date,
    required: [true, "Event date is required"],
  },

  guestCount: {
    type: Number,
    required: [true, "Guest count is required"],
    min: 1,
    max: 1000000,
  },

  bookingStatus: {
    type: String,
    enum: ["pending", "confirmed", "cancelled"],
    default: "pending",
  },

  paymentStatus: {
    type: String,
    enum: ["unpaid", "paid"],
    default: "unpaid",
  },

  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
});

module.exports = mongoose.model("Booking", bookingSchema);
