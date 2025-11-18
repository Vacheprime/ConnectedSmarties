import { showToast } from "./notifications.js"

// Validate customer registration inputs
function validateRegistration(data) {
  const errors = []
  const namePattern = /^[A-Za-z\s]+$/
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const passwordPattern = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*[0-9]).{8,}$/
  const phonePattern = /^[\d\s\-\+\(\)]+$/

  // Required fields
  if (!data.first_name || !data.last_name || !data.email || !data.password) {
    errors.push("All required fields must be filled out.")
    return errors
  }

  // First Name
  if (!namePattern.test(data.first_name)) {
    errors.push("First name must contain only letters and spaces.")
  }

  // Last Name
  if (!namePattern.test(data.last_name)) {
    errors.push("Last name must contain only letters and spaces.")
  }

  // Email
  if (!emailPattern.test(data.email)) {
    errors.push("Please enter a valid email address.")
  }

  // Password - minimum 8 chars, 1 uppercase, 1 special char, 1 number
  if (!passwordPattern.test(data.password)) {
    errors.push(
      "Password must be at least 8 characters and contain an uppercase letter, a number, and a special character (!@#$%^&*)."
    )
  }

  // Phone Number (if provided)
  if (data.phone_number && !phonePattern.test(data.phone_number)) {
    errors.push("Phone number contains invalid characters.")
  }

  return errors
}

// Register customer
async function addCustomer(event) {
  event.preventDefault()
  window.clearAllErrors()

  const form = document.getElementById("customer-form")
  const formData = new FormData(form)

  const data = {
    first_name: formData.get("first_name").trim(),
    last_name: formData.get("last_name").trim(),
    email: formData.get("email").trim(),
    password: formData.get("password").trim(),
    phone_number: formData.get("phone_number").trim(),
    rewards_points: 0,
  }

  // Validation
  const errors = validateRegistration(data)
  if (errors.length > 0) {
    showToast("Validation Error", errors.join("<br>"), "error")
    return
  }

  // Submit data
  try {
    const response = await fetch("/customers/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (response.ok) {
      showToast("Success", "Account created successfully! Redirecting to login...", "success")
      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = "/"
      }, 2000)
    } else {
      const errorMessage = result.errors ? result.errors.join("<br>") : result.error || "Registration failed"
      showToast("Error", errorMessage, "error")
    }
  } catch (error) {
    console.error("Error registering customer:", error)
    showToast("Error", error.message, "error")
  }
}

// Reset form
function resetForm() {
  document.getElementById("customer-form").reset()
  window.clearAllErrors()
}

// Helper functions
function clearAllErrors() {
  const errorElements = document.querySelectorAll(".error-message")
  errorElements.forEach((element) => {
    element.textContent = ""
  })
}

function showFieldError(fieldId, errorMessage) {
  const errorElement = document.getElementById(`${fieldId}-error`)
  if (errorElement) {
    errorElement.textContent = errorMessage
  }
}

function clearFieldError(fieldId) {
  const errorElement = document.getElementById(`${fieldId}-error`)
  if (errorElement) {
    errorElement.textContent = ""
  }
}

// Toggle password visibility
document.addEventListener("DOMContentLoaded", () => {
  const togglePasswordBtn = document.getElementById("togglePassword")
  const passwordInput = document.getElementById("password")
  const toggleIcon = document.getElementById("password-toggle-icon")

  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener("click", (e) => {
      e.preventDefault()
      if (passwordInput.type === "password") {
        passwordInput.type = "text"
        toggleIcon.classList.remove("fa-eye")
        toggleIcon.classList.add("fa-eye-slash")
      } else {
        passwordInput.type = "password"
        toggleIcon.classList.remove("fa-eye-slash")
        toggleIcon.classList.add("fa-eye")
      }
    })
  }
})

// Expose functions to global scope
if (typeof window !== "undefined") {
  window.addCustomer = addCustomer
  window.resetForm = resetForm
  window.clearFieldError = clearFieldError
  window.showFieldError = showFieldError
  window.clearAllErrors = clearAllErrors
}
