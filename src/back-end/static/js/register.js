import { showToast } from "./notifications.js"

/**
 * A helper function to show or clear an error for a specific field.
 * @param {string} fieldId - The ID of the input element.
 * @param {string} message - The error message to show. If empty, clears the error.
 */
function setFieldError(fieldId, message) {
  const errorSpan = document.getElementById(`${fieldId}-error`);
  if (errorSpan) {
    errorSpan.textContent = message;
    errorSpan.style.display = message ? 'block' : 'none';
  }
}

/**
 * Clears all error messages from a form.
 */
function clearAllErrors() {
  document.querySelectorAll('.error-message').forEach(span => {
    span.textContent = '';
    span.style.display = 'none';
  });
}

// Validate customer registration inputs
function validateRegistration(data) {
  let isValid = true;
  const namePattern = /^[A-Za-z\s'-]{2,50}$/; // Allow spaces, hyphens, apostrophes
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordPattern = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*[0-9]).{8,}$/;
  const phonePattern = /^[0-9]{10,15}$/; // Only digits, 10-15 long

  // First Name
  if (!data.first_name) {
    setFieldError('first_name', 'First name is required.');
    isValid = false;
  } else if (!namePattern.test(data.first_name)) {
    setFieldError('first_name', 'Please enter a valid name (letters, spaces, \', -).');
    isValid = false;
  }

  // Last Name
  if (!data.last_name) {
    setFieldError('last_name', 'Last name is required.');
    isValid = false;
  } else if (!namePattern.test(data.last_name)) {
    setFieldError('last_name', 'Please enter a valid name (letters, spaces, \', -).');
    isValid = false;
  }

  // Email
  if (!data.email) {
    setFieldError('email', 'Email is required.');
    isValid = false;
  } else if (!emailPattern.test(data.email)) {
    setFieldError('email', 'Please enter a valid email address.');
    isValid = false;
  }

  // Password
  if (!data.password) {
    setFieldError('password', 'Password is required.');
    isValid = false;
  } else if (!passwordPattern.test(data.password)) {
    setFieldError('password', 'Password must be 8+ chars, with 1 uppercase, 1 number, and 1 special character.');
    isValid = false;
  }

  // Phone Number (Optional, but validated if present)
  if (data.phone_number && !phonePattern.test(data.phone_number)) {
    setFieldError('phone_number', 'Please enter a valid phone number (10-15 digits, no symbols).');
    isValid = false;
  }

  return isValid;
}

// Register customer
async function addCustomer(event) {
  event.preventDefault();
  clearAllErrors();

  const form = document.getElementById("customer-form");
  const formData = new FormData(form);

  const data = {
    first_name: formData.get("first_name").trim(),
    last_name: formData.get("last_name").trim(),
    email: formData.get("email").trim(),
    password: formData.get("password").trim(),
    phone_number: formData.get("phone_number").trim(),
    rewards_points: 0,
  };

  // Validation
  if (!validateRegistration(data)) {
    showToast("Validation Error", "Please fix the errors in the form.", "error");
    return;
  }

  // Submit data
  try {
    const response = await fetch("/customers/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok) {
      showToast("Success", "Account created successfully! Redirecting to login...", "success");
      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } else {
      // Handle specific server-side errors and show user-friendly messages
      let handled = false;

      // If server returned an array of validation errors, show them and attach field errors
      if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
        const combined = result.errors.join('<br>');
        // Attach specific field errors when keywords are present
        result.errors.forEach(err => {
          const lower = err.toLowerCase();
          if (lower.includes('email')) {
            setFieldError('email', err);
          }
          if (lower.includes('phone') || lower.includes('phone_number') || lower.includes('phone number')) {
            setFieldError('phone_number', err);
          }
          if (lower.includes('password')) {
            setFieldError('password', err);
          }
        });
        showToast('Registration failed', combined, 'error');
        handled = true;
      }

      // If a single error string was returned, attempt to parse it for common constraint failures
      if (!handled && result.error) {
        const errLower = String(result.error).toLowerCase();

        if (errLower.includes('email')) {
          setFieldError('email', 'This email is already registered.');
          showToast('Registration failed', 'This email address is already registered. Please sign in or use a different email.', 'error');
          handled = true;
        } else if (errLower.includes('phone') || errLower.includes('phone_number') || errLower.includes('phone number')) {
          setFieldError('phone_number', 'This phone number is already registered.');
          showToast('Registration failed', 'This phone number is already registered. Please use a different number.', 'error');
          handled = true;
        } else if (errLower.includes('unique constraint failed')) {
          // Try to extract the failing column name from SQLite message
          const match = String(result.error).match(/UNIQUE constraint failed:\s*(?:\w+\.)?(\w+)/i);
          if (match && match[1]) {
            const col = match[1].toLowerCase();
            if (col.includes('email')) {
              setFieldError('email', 'This email is already registered.');
              showToast('Registration failed', 'This email address is already registered. Please sign in or use a different email.', 'error');
            } else if (col.includes('phone')) {
              setFieldError('phone_number', 'This phone number is already registered.');
              showToast('Registration failed', 'This phone number is already registered. Please use a different number.', 'error');
            } else {
              showToast('Registration failed', `A unique constraint failed on ${col}. Please check your input.`, 'error');
            }
            handled = true;
          }
        }
      }

      // Fallback: show the error message as returned by the server (or a generic message)
      if (!handled) {
        const errorMessage = result.errors ? result.errors.join('<br>') : result.error || 'Registration failed';
        showToast('Registration failed', errorMessage, 'error');
      }
    }
  } catch (error) {
    console.error("Error registering customer:", error);
    showToast("Error", error.message, "error");
  }
}

// Reset form
function resetForm() {
  document.getElementById("customer-form").reset();
  clearAllErrors();
}

// Toggle password visibility
document.addEventListener("DOMContentLoaded", () => {
  const togglePasswordBtn = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");
  const toggleIcon = document.getElementById("password-toggle-icon");

  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (passwordInput.type === "password") {
        passwordInput.type = "text";
        toggleIcon.classList.remove("fa-eye");
        toggleIcon.classList.add("fa-eye-slash");
      } else {
        passwordInput.type = "password";
        toggleIcon.classList.remove("fa-eye-slash");
        toggleIcon.classList.add("fa-eye");
      }
    });
  }

  // Add real-time validation
  document.getElementById("customer-form").querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => {
      // Clear the error for this specific field
      setFieldError(input.id, '');
    });
  });
});

// Expose functions to global scope
if (typeof window !== "undefined") {
  window.addCustomer = addCustomer;
  window.resetForm = resetForm;
  window.clearAllErrors = clearAllErrors;
}