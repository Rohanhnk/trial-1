"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("booking-form");

  if (!form) {
    return;
  }

  const message = document.createElement("p");
  message.setAttribute("role", "status");
  message.style.marginTop = "12px";
  form.appendChild(message);

  const showMessage = (text, isError = false) => {
    message.textContent = text;
    message.style.color = isError ? "#8f2c3d" : "#2f6b2f";
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const payload = {
      name: formData.get("name"),
      phone: formData.get("phone"),
      eventType: formData.get("eventType"),
      eventDate: formData.get("eventDate"),
      guestCount: Number(formData.get("guestCount")),
    };

    try {
      const response = await fetch("http://localhost:3000/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 409) {
        showMessage(
          "That date is already booked. Please choose another.",
          true,
        );
        return;
      }

      if (!response.ok) {
        showMessage("Something went wrong. Please try again.", true);
        return;
      }

      showMessage("Booking created successfully. We will contact you soon.");
      form.reset();
    } catch (error) {
      showMessage(
        "Network error. Please check your connection and try again.",
        true,
      );
    }
  });
});
