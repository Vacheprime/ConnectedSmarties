import { showToast } from "./notifications.js"

function togglePasswordVisibility(inputId) {
  const passwordInput = document.getElementById(inputId);
  const toggleIcon = document.getElementById(`${inputId}-toggle-icon`);

  if (!passwordInput || !toggleIcon) return;

  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    toggleIcon.classList.remove("fa-eye");
    toggleIcon.classList.add("fa-eye-slash");
  } else {
    passwordInput.type = "password";
    toggleIcon.classList.remove("fa-eye-slash");
    toggleIcon.classList.add("fa-eye");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // ---- Password visibility toggles ----
  document.querySelectorAll(".password-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target;
      if (target) togglePasswordVisibility(target);
    });
  });

  // ---- New password form submission ----
  const newPassForm = document.getElementById("create_new_password_form");

  if (newPassForm) {
    newPassForm.addEventListener("submit", (e) => {
      const password = document.getElementById("password").value.trim();
      const confirm = document.getElementById("confirm_password").value.trim();

      // Password strength pattern
      const passwordPattern = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*[0-9]).{8,}$/;

      // Validate format
      if (!passwordPattern.test(password)) {
        e.preventDefault();
        showToast("Weak Password",
          "Password must contain:\n" +
          "- At least 1 uppercase letter\n" +
          "- At least 1 special character (!@#$%^&*)\n" +
          "- At least 1 number\n" +
          "- Minimum 8 characters", "warning"
        );
        return;
      }

      // Confirm password match
      if (password !== confirm) {
        e.preventDefault();
        showToast("Mismatched Password", "Passwords do not match.", "error");
        return;
      }
    });
  }
  // ---- Login form submission ----
  const form = document.getElementById("login-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      showToast("Incomplete", "Please fill in both fields.", "warning");
      return;
    }

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.redirect) {
        window.location.href = data.redirect;
      } else {
        alert(data.error || "Invalid credentials.");
      }
    } catch (err) {
      console.error("Login request failed:", err);
      showToast("Server error", " Please try again later.", "error");
    }
  });
});