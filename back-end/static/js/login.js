import { showToast } from "./notifications.js"

/**
 * A helper function to show or clear an error for a specific field.
 * @param {string} fieldId - The ID of the input element.
 * @param {string} message - The error message to show. If empty, clears the error.
 */
function setFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  // In login/register, the error span is inside the form-group, not a direct sibling
  const errorSpan = input.closest('.form-group').querySelector('.error-message');
  if (errorSpan) {
    errorSpan.textContent = message;
    errorSpan.style.display = message ? 'block' : 'none';
  }
}

/**
 * Clears all error messages from a form.
 * @param {HTMLFormElement} form - The form element.
 */
function clearAllFormErrors(form) {
  form.querySelectorAll('.error-message').forEach(span => {
    span.textContent = '';
    span.style.display = 'none';
  });
}

/**
 * Validates a form and displays errors.
 * @param {HTMLFormElement} form - The form element to validate.
 * @returns {boolean} - True if the form is valid, false otherwise.
 */
function validateForm(form) {
  let isValid = true;
  clearAllFormErrors(form);

  // Check all 'required' fields
  form.querySelectorAll('input[required]').forEach(input => {
    if (!input.value.trim()) {
      setFieldError(input.id, 'This field is required.');
      isValid = false;
    }
  });

  // Check email format
  const emailInput = form.querySelector('input[type="email"]');
  if (emailInput && emailInput.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value)) {
    setFieldError(emailInput.id, 'Please enter a valid email address.');
    isValid = false;
  }

  // Check password length
  form.querySelectorAll('input[type="password"][minlength]').forEach(input => {
    const minLength = input.getAttribute('minlength');
    if (input.value && input.value.length < minLength) {
      setFieldError(input.id, `Password must be at least ${minLength} characters.`);
      isValid = false;
    }
  });

  return isValid;
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
      e.preventDefault(); // Always prevent default to do custom validation
      
      const passwordInput = document.getElementById("password");
      const confirmInput = document.getElementById("confirm_password");
      const password = passwordInput.value;
      const confirm = confirmInput.value;

      // Clear previous errors
      clearAllFormErrors(newPassForm);

      // Password strength pattern
      const passwordPattern = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*[0-9]).{8,}$/;
      let isValid = true;

      // Validate format
      if (!passwordPattern.test(password)) {
        setFieldError(passwordInput.id, 
          "Must be 8+ chars, with 1 uppercase, 1 number, and 1 special character."
        );
        isValid = false;
      }

      // Confirm password match
      if (password !== confirm) {
        setFieldError(confirmInput.id, "Passwords do not match.");
        isValid = false;
      }

      if (isValid) {
        // If all checks pass, submit the form
        newPassForm.submit();
      } else {
        showToast("Validation Error", "Please fix the errors in the form.", "error");
      }
    });
  }
  
  // ---- Login form submission ----
  const loginForm = document.getElementById("login-form");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Run custom validation
      if (!validateForm(loginForm)) {
        showToast("Login Failed", "Please check your email and password.", "warning");
        return;
      }

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();

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
          showToast("Login Failed", data.error || "Invalid credentials.", "error");
        }
      } catch (err) {
        console.error("Login request failed:", err);
        showToast("Server Error", "Could not connect. Please try again later.", "error");
      }
    });

    // Add real-time validation to clear errors on input
    loginForm.querySelectorAll('input[required]').forEach(input => {
      input.addEventListener('input', () => {
        if (input.value.trim()) {
          setFieldError(input.id, '');
        }
      });
    });
  }
});