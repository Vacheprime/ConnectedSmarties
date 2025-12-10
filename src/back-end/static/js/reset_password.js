import { showToast } from "./notifications.js"

/**
 * A helper function to show or clear an error for a specific field.
 * (Copied from login.js for consistency)
 */
function setFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const errorSpan = input.closest('.form-group').querySelector('.error-message');
  if (errorSpan) {
    errorSpan.textContent = message;
    errorSpan.style.display = message ? 'block' : 'none';
  }
}

/**
 * Clears all error messages from a form.
 * (Copied from login.js for consistency)
 */
function clearAllFormErrors(form) {
  form.querySelectorAll('.error-message').forEach(span => {
    span.textContent = '';
    span.style.display = 'none';
  });
}

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
  document.querySelectorAll(".password-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target;
      if (target) togglePasswordVisibility(target);
    });
  });

  const form = document.getElementById("reset-form")

  form.addEventListener("submit", async (e) => {
    e.preventDefault()
    clearAllFormErrors(form); // <-- ADDED THIS

    const email = document.getElementById("email").value.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    let isValid = true;

    if (!email) {
      setFieldError("email", "Please enter your email address."); // <-- REPLACED alert()
      isValid = false;
    } else if (!emailRegex.test(email)) {
      setFieldError("email", "Please enter a valid email address."); // <-- REPLACED alert()
      isValid = false;
    }

    if (!isValid) {
      showToast("Error", "Please correct the errors in the form.", "error"); // <-- ADDED
      return;
    }

    try {
      const response = await fetch("/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        // Changed alert to showToast for consistency
        showToast("Success", data.message || "Password reset email sent! Please check your inbox.", "success");
        setTimeout(() => {
          window.location.href = "/"
        }, 2000)
      } else {
        showToast("Error", data.error || "Failed to send reset email. Please try again.", "error"); // <-- REPLACED alert()
      }
    } catch (err) {
      console.error("Reset password request failed:", err)
      showToast("Server Error", "Server error. Please try again later.", "error"); // <-- REPLACED alert()
    }
  })
})