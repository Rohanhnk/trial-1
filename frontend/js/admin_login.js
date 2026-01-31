document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("admin-login-form");
  const message = document.getElementById("admin-login-message");

  if (!form) {
    return;
  }

  const ADMIN_USERNAME = "admin";
  const ADMIN_PASSWORD = "admin123";

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");

    const username = usernameInput ? usernameInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value.trim() : "";

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      sessionStorage.setItem("adminLoggedIn", "true");
      window.location.href = "admin.html";
      return;
    }

    if (message) {
      message.textContent = "Invalid username or password.";
      message.className = "auth-message auth-message--error";
    }
  });
});
