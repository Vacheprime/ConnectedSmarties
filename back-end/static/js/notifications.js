// Bootstrap Alert Notification System
function showToast(title, message, type = "info") {
  const alertContainer = document.getElementById("alert-container")
  if (!alertContainer) {
    console.error("Alert container not found")
    return
  }

  // Map types to Bootstrap alert classes
  const alertTypes = {
    success: "alert-success",
    error: "alert-danger",
    warning: "alert-warning",
    info: "alert-info",
  }

  const alertClass = alertTypes[type] || alertTypes.info

  // Create alert element
  const alert = document.createElement("div")
  alert.className = `alert ${alertClass} alert-dismissible fade show`
  alert.setAttribute("role", "alert")
  alert.style.cssText = "margin-bottom: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"

  alert.innerHTML = `
    <strong>${title}</strong> ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `

  // Add to container
  alertContainer.appendChild(alert)

  // Auto dismiss after 4 seconds
  setTimeout(() => {
    if (alert.parentElement) {
      alert.classList.remove("show")
      setTimeout(() => {
        alert.remove()
      }, 150)
    }
  }, 4000)
}

// Alias for backward compatibility
function showNotification(title, message, type = "info") {
  showToast(title, message, type)
}

// Validation helpers
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

function validatePhone(phone) {
  const re = /^[\d\s\-+$$$$]+$/
  return re.test(phone) && phone.replace(/\D/g, "").length >= 10
}

function validateRequired(value) {
  return value && value.trim().length > 0
}

function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId)
  const errorSpan = document.getElementById(`${fieldId}-error`)

  if (field) {
    field.classList.add("error")
  }

  if (errorSpan) {
    errorSpan.textContent = message
  }
}

function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId)
  const errorSpan = document.getElementById(`${fieldId}-error`)

  if (field) {
    field.classList.remove("error")
  }

  if (errorSpan) {
    errorSpan.textContent = ""
  }
}

function clearAllErrors() {
  document.querySelectorAll(".error").forEach((el) => el.classList.remove("error"))
  document.querySelectorAll(".error-message").forEach((el) => (el.textContent = ""))
}
