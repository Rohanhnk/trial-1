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

  const API_BASE_URL = "http://127.0.0.1:3000";
  const bookedDates = [];
  const dateInput = form.querySelector("#eventDate");
  const dateStatus = form.querySelector("#date-status");
  const calendarWrapper = document.getElementById("availability-calendar");
  const calendarInput = document.getElementById("availability-picker");
  const calendarLoading = document.getElementById("calendar-loading");
  const calendarError = document.getElementById("calendar-error");
  let calendarInstance = null;
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
        `${API_BASE_URL}/api/bookings/check-date?eventDate=${encodeURIComponent(eventDate)}`,
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

      if (calendarInstance && value) {
        calendarInstance.setDate(value, false);
      }
    });
  }

  const formatDateString = (value) => {
    if (!value) {
      return "";
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) {
        return "";
      }

      if (trimmed.includes("T")) {
        return trimmed.split("T")[0];
      }

      if (trimmed.length >= 10) {
        return trimmed.slice(0, 10);
      }

      return trimmed;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const initCalendar = (dates) => {
    if (!calendarWrapper || !calendarInput || !window.flatpickr) {
      if (calendarError) {
        calendarError.hidden = false;
      }
      return;
    }

    if (calendarInstance) {
      calendarInstance.destroy();
    }

    calendarInstance = window.flatpickr(calendarInput, {
      inline: true,
      appendTo: calendarWrapper,
      dateFormat: "Y-m-d",
      disable: dates,
      minDate: "today",
      onChange: (_selectedDates, dateStr) => {
        if (!dateStr || !dateInput) {
          return;
        }
        dateInput.value = dateStr;
        checkDateAvailability(dateStr);
        form.scrollIntoView({ behavior: "smooth", block: "start" });
      },
    });
  };

  const fetchBookedDates = async () => {
    if (calendarLoading) {
      calendarLoading.hidden = false;
    }
    if (calendarError) {
      calendarError.hidden = true;
    }
    if (calendarWrapper) {
      calendarWrapper.hidden = true;
    }

    try {
      // Fetch optimized endpoint that returns array of date strings
      const response = await fetch(`${API_BASE_URL}/api/bookings/dates`);

      if (!response.ok) {
        throw new Error("Failed to load booked dates.");
      }

      const payload = await response.json();
      const dates = Array.isArray(payload) ? payload : payload.data;

      if (!Array.isArray(dates)) {
        throw new Error("Unexpected response format.");
      }

      // API returns pre-formatted YYYY-MM-DD strings, already deduplicated and sorted
      // Store in bookedDates for calendar initialization
      bookedDates.splice(0, bookedDates.length, ...dates);
      initCalendar(bookedDates);

      if (calendarWrapper) {
        calendarWrapper.hidden = false;
      }
    } catch (error) {
      // Show error and initialize calendar with empty list to allow bookings
      if (calendarError) {
        calendarError.hidden = false;
      }
      bookedDates.splice(0, bookedDates.length);
      initCalendar(bookedDates);
    } finally {
      if (calendarLoading) {
        calendarLoading.hidden = true;
      }
    }
  };

  fetchBookedDates();

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
