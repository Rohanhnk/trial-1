"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("booking-form");

  if (!form) {
    return;
  }

  const messageContainer = document.querySelector(".form-messages");
  const message = document.createElement("p");
  message.setAttribute("role", "status");
  message.style.marginTop = "12px";
  if (messageContainer) {
    messageContainer.appendChild(message);
  } else {
    form.appendChild(message);
  }

  const showMessage = (text, isError = false) => {
    message.textContent = text;
    message.className = `form-message ${isError ? "form-message--error" : "form-message--success"}`;
  };

  const API_BASE_URL = "http://localhost:3000";
  const dateInput = form.querySelector("#eventDate");
  const dateStatus = form.querySelector("#date-status");
  let dateCheckTimeout = null;
  let dateCheckController = null;
  let dateAvailability = "unknown";
  let lastCheckedDate = "";
  let lastResult = "";

  const setDateStatus = (text, status) => {
    if (!dateStatus) {
      return;
    }
    dateStatus.textContent = text;
    dateStatus.className = `date-status date-status--${status}`;
    dateAvailability = status;
  };

  const clearDateStatus = () => {
    if (!dateStatus) {
      return;
    }
    dateStatus.textContent = "";
    dateStatus.className = "date-status";
    dateAvailability = "unknown";
  };

  const checkDateAvailability = async (eventDate) => {
    if (!eventDate) {
      clearDateStatus();
      lastCheckedDate = "";
      lastResult = "";
      return;
    }

    if (eventDate === lastCheckedDate && lastResult) {
      setDateStatus(
        lastResult === "available" ? "Date available" : "Date already booked",
        lastResult,
      );
      return;
    }

    setDateStatus("Checking availability...", "checking");

    if (dateCheckController) {
      dateCheckController.abort();
    }
    dateCheckController = new AbortController();

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/bookings/check-date?date=${encodeURIComponent(eventDate)}`,
        { signal: dateCheckController.signal },
      );

      if (!response.ok) {
        clearDateStatus();
        return;
      }

      const data = await response.json();
      lastCheckedDate = eventDate;
      lastResult = data.booked ? "booked" : "available";
      if (data.booked) {
        setDateStatus("Date already booked", "booked");
      } else {
        setDateStatus("Date available", "available");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        clearDateStatus();
      }
    }
  };

  if (dateInput) {
    dateInput.addEventListener("input", (event) => {
      const { value } = event.target;
      if (dateCheckTimeout) {
        clearTimeout(dateCheckTimeout);
      }
      dateCheckTimeout = setTimeout(() => {
        checkDateAvailability(value);
      }, 400);
    });
  }

  let isSubmitting = false;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (dateAvailability !== "available") {
      const messageText =
        dateAvailability === "booked"
          ? "That date is already booked. Please choose another date."
          : "Please select a date and confirm availability before submitting.";
      showMessage(messageText, true);
      return;
    }

    const submitButton = form.querySelector("button[type='submit']");
    const originalButtonText = submitButton ? submitButton.textContent : "";
    isSubmitting = true;
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Submitting...";
    }

    const formData = new FormData(form);
    const payload = {
      name: formData.get("name"),
      phone: formData.get("phone"),
      eventType: formData.get("eventType"),
      eventDate: formData.get("eventDate"),
      guestCount: Number(formData.get("guestCount")),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings`, {
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
    } finally {
      isSubmitting = false;
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    }
  });
});
