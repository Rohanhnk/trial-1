const API_BASE_URL = "http://127.0.0.1:3000";
const ADMIN_LOGIN_KEY = "adminLoggedIn";

document.addEventListener("DOMContentLoaded", () => {
  if (!isAdminLoggedIn()) {
    window.location.href = "admin-login.html";
    return;
  }

  loadBookings();
});

function isAdminLoggedIn() {
  return sessionStorage.getItem(ADMIN_LOGIN_KEY) === "true";
}

async function loadBookings(options = {}) {
  const { silent = false } = options;
  const tableBody = document.getElementById("bookings-body");
  const loadingMessage = document.getElementById("bookings-loading");
  const errorMessage = document.getElementById("bookings-error");

  if (!tableBody) {
    return;
  }

  if (!silent) {
    tableBody.innerHTML = "";
    setMessageVisibility(loadingMessage, true);
  }
  setMessageVisibility(errorMessage, false);

  try {
    const bookings = await fetchBookings();

    if (!silent) {
      setMessageVisibility(loadingMessage, false);
    }

    renderBookings(tableBody, bookings);
  } catch (error) {
    if (!silent) {
      setMessageVisibility(loadingMessage, false);
    }
    setMessageVisibility(errorMessage, true);
  }
}

async function fetchBookings() {
  const response = await fetch(`${API_BASE_URL}/api/bookings`);

  if (!response.ok) {
    throw new Error("Failed to load bookings.");
  }

  const payload = await response.json();
  return Array.isArray(payload) ? payload : payload.data;
}

function renderBookings(tableBody, bookings) {
  tableBody.innerHTML = "";

  if (!Array.isArray(bookings) || bookings.length === 0) {
    renderEmptyState(tableBody);
    return;
  }

  bookings.forEach((booking) => {
    const row = buildBookingRow(booking);
    tableBody.appendChild(row);
  });
}

function setMessageVisibility(element, shouldShow) {
  if (!element) {
    return;
  }

  element.hidden = !shouldShow;
}

function renderEmptyState(tableBody) {
  const row = document.createElement("tr");
  row.className = "table-row table-row-empty";

  const cell = document.createElement("td");
  cell.className = "table-cell table-cell-empty";
  cell.colSpan = 7;
  cell.textContent = "No bookings yet";

  row.appendChild(cell);
  tableBody.appendChild(row);
}

function buildBookingRow(booking) {
  const row = document.createElement("tr");
  row.className = "table-row";

  const bookingId = booking.id || booking._id;
  const customerName = booking.customerName || booking.name || "-";
  const phone = booking.phone || booking.phoneNumber || "-";
  const eventType = booking.eventType || booking.event || "-";
  const eventDate = formatDate(booking.eventDate || booking.date);
  const guestCount = booking.guestCount || booking.guests || "-";
  const statusText = booking.bookingStatus || booking.status || "pending";

  row.appendChild(createCell(customerName));
  row.appendChild(createCell(phone));
  row.appendChild(createCell(eventType));
  row.appendChild(createCell(eventDate));
  row.appendChild(createCell(guestCount));
  row.appendChild(createStatusCell(statusText));
  row.appendChild(createActionCell(bookingId, statusText));

  return row;
}

function createCell(value) {
  const cell = document.createElement("td");
  cell.className = "table-cell";
  cell.textContent = value;
  return cell;
}

function createStatusCell(statusText) {
  const cell = document.createElement("td");
  cell.className = "table-cell";

  const badge = document.createElement("span");
  badge.className = `status ${getStatusClass(statusText)}`;
  badge.textContent = statusText;

  cell.appendChild(badge);
  return cell;
}

function createActionCell(bookingId, statusText) {
  const cell = document.createElement("td");
  cell.className = "table-cell";

  const confirmButton = createActionButton("Confirm", "confirm");
  const cancelButton = createActionButton("Cancel", "cancel");

  if (!bookingId) {
    confirmButton.disabled = true;
    cancelButton.disabled = true;
    cell.appendChild(confirmButton);
    cell.appendChild(cancelButton);
    return cell;
  }

  updateActionButtons(statusText, confirmButton, cancelButton);

  confirmButton.addEventListener("click", () => {
    handleStatusUpdate(bookingId, "confirmed", confirmButton, cancelButton);
  });

  cancelButton.addEventListener("click", () => {
    handleStatusUpdate(bookingId, "cancelled", confirmButton, cancelButton);
  });

  cell.appendChild(confirmButton);
  cell.appendChild(cancelButton);
  return cell;
}

function createActionButton(label, variant) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `table-action table-action-${variant}`;
  button.textContent = label;
  return button;
}

function updateActionButtons(statusText, confirmButton, cancelButton) {
  const normalized = String(statusText).toLowerCase();
  const isConfirmed = normalized.includes("confirm");
  const isCancelled = normalized.includes("cancel");

  confirmButton.disabled = isConfirmed;
  cancelButton.disabled = isCancelled;
}

async function handleStatusUpdate(
  bookingId,
  newStatus,
  confirmButton,
  cancelButton,
) {
  const errorMessage = document.getElementById("bookings-error");
  setMessageVisibility(errorMessage, false);

  const previousStatus = getRowStatus(confirmButton);
  const row = confirmButton.closest("tr");
  let finalStatus = previousStatus;

  if (!row) {
    return;
  }

  setButtonsDisabled(confirmButton, cancelButton, true);

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/bookings/${bookingId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      },
    );

    if (!response.ok) {
      throw new Error("Unable to update booking status.");
    }

    const payload = await response.json();
    const updatedBooking = payload.data || payload;
    finalStatus =
      updatedBooking.bookingStatus || updatedBooking.status || newStatus;
    updateRowStatus(row, finalStatus);
    loadBookings({ silent: true });
  } catch (error) {
    setMessageVisibility(errorMessage, true);
  } finally {
    updateActionButtons(finalStatus, confirmButton, cancelButton);
    setButtonsDisabled(confirmButton, cancelButton, false);
  }
}

function setButtonsDisabled(confirmButton, cancelButton, isDisabled) {
  confirmButton.disabled = isDisabled;
  cancelButton.disabled = isDisabled;
}

function updateRowStatus(row, statusText) {
  const statusBadge = row.querySelector(".status");

  if (!statusBadge) {
    return;
  }

  statusBadge.className = `status ${getStatusClass(statusText)}`;
  statusBadge.textContent = statusText;
}

function getRowStatus(button) {
  const row = button.closest("tr");
  const badge = row ? row.querySelector(".status") : null;
  return badge ? badge.textContent : "pending";
}

function getStatusClass(statusText) {
  const normalized = String(statusText).toLowerCase();

  if (normalized.includes("confirm")) {
    return "status-confirmed";
  }

  if (normalized.includes("cancel")) {
    return "status-cancelled";
  }

  return "status-pending";
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
