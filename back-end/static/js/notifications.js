// Toast notification system
function showToast(title, message, type = "info") {
  const container = document.getElementById("toast-container")

  const toast = document.createElement("div")
  toast.className = `toast ${type}`

  const icons = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  }

  toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="closeToast(this)">×</button>
    `

  container.appendChild(toast)

  // Auto remove after 5 seconds
  setTimeout(() => {
    removeToast(toast)
  }, 5000)
}

function closeToast(button) {
  const toast = button.closest(".toast")
  removeToast(toast)
}

function removeToast(toast) {
  toast.style.animation = "slideOut 0.3s ease-out"
  setTimeout(() => {
    toast.remove()
  }, 300)
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
