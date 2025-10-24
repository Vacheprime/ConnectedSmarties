// Load customers from database
async function loadCustomers() {
  try {
    const response = await fetch("/customers/data");
    if (response.ok) {
      const customers = await response.json()
      displayCustomers(customers)
    } else {
      throw new Error("Failed to load customers")
    }
  } catch (error) {
    console.error("Error loading customers:", error)
    showToast("Database Error", "Failed to load customers", "error")
    document.getElementById("customers-tbody").innerHTML =
      '<tr><td colspan="7" class="loading">Error loading customers</td></tr>'
  }
}

// Display customers in table
function displayCustomers(customers) {
  const tbody = document.getElementById("customers-tbody")

  if (customers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="loading">No customers found</td></tr>'
    return
  }

  tbody.innerHTML = customers
    .map(
      (customer) => `
        <tr>
            <td>${customer.customer_id}</td>
            <td>${customer.first_name}</td>
            <td>${customer.last_name}</td>
            <td>${customer.email}</td>
            <td>${customer.phone_number}</td>
            <td>${customer.rewards_points}</td>
            <td>
                <button class="action-btn delete-btn" onclick="deleteCustomer(${customer.customer_id})">Delete</button>
            </td>
        </tr>
    `,
    )
    .join("")
}

// Add customer
async function addCustomer(event) {
  event.preventDefault()
  clearAllErrors()

  const form = document.getElementById("customer-form")
  const formData = new FormData(form)

  // Validation
  let isValid = true

  const firstName = formData.get("first_name")
  if (!validateRequired(firstName)) {
    showFieldError("first_name", "First name is required")
    isValid = false
  }

  const lastName = formData.get("last_name")
  if (!validateRequired(lastName)) {
    showFieldError("last_name", "Last name is required")
    isValid = false
  }

  const email = formData.get("email")
  if (!validateRequired(email)) {
    showFieldError("email", "Email is required")
    isValid = false
  } else if (!validateEmail(email)) {
    showFieldError("email", "Please enter a valid email address")
    isValid = false
  }

  const phone = formData.get("phone_number")
  if (!validateRequired(phone)) {
    showFieldError("phone_number", "Phone number is required")
    isValid = false
  } else if (!validatePhone(phone)) {
    showFieldError("phone_number", "Please enter a valid phone number (at least 10 digits)")
    isValid = false
  }

  if (!isValid) {
    showToast("Validation Error", "Please fix the errors in the form", "error")
    return
  }

  // Submit data
  try {
    const data = {
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone_number: phone,
      rewards_points: Number.parseInt(formData.get("rewards_points")) || 0,
    }

    const response = await fetch("/customers/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (response.ok) {
      const result = await response.json()
      showToast("Success", "Customer successfully created!", "success")
      form.reset()
      loadCustomers()
    } else {
      const error = await response.json()
      throw new Error(error.error || "Failed to add customer")
    }
  } catch (error) {
    console.error("Error adding customer:", error)
    showToast("Error", error.message, "error")
  }
}

// Delete customer
async function deleteCustomer(customerId) {
  if (!confirm("Are you sure you want to delete this customer?")) {
    return
  }

  try {
    const response = await fetch(`/api/customers/${customerId}`, {
      method: "DELETE",
    })

    if (response.ok) {
      showToast("Success", "Customer successfully deleted!", "success")
      loadCustomers()
    } else {
      const error = await response.json()
      throw new Error(error.error || "Failed to delete customer")
    }
  } catch (error) {
    console.error("Error deleting customer:", error)
    showToast("Error", error.message, "error")
  }
}

// Reset form
function resetForm() {
  document.getElementById("customer-form").reset()
  clearAllErrors()
}

// Add real-time validation
document.addEventListener("DOMContentLoaded", () => {
  loadCustomers()

  // Real-time validation
  const emailInput = document.getElementById("email")
  if (emailInput) {
    emailInput.addEventListener("blur", () => {
      const value = emailInput.value
      if (value && !validateEmail(value)) {
        showFieldError("email", "Please enter a valid email address")
      } else {
        clearFieldError("email")
      }
    })
  }

  const phoneInput = document.getElementById("phone_number")
  if (phoneInput) {
    phoneInput.addEventListener("blur", () => {
      const value = phoneInput.value
      if (value && !validatePhone(value)) {
        showFieldError("phone_number", "Please enter a valid phone number")
      } else {
        clearFieldError("phone_number")
      }
    })
  }
})

// Declare variables
function showToast(title, message, type) {
  console.log(`${type}: ${title} - ${message}`)
}

function clearAllErrors() {
  // Clear all errors logic here
}

function validateRequired(value) {
  return value.trim() !== ""
}

function showFieldError(fieldId, errorMessage) {
  const field = document.getElementById(fieldId)
  if (field) {
    field.nextElementSibling.textContent = errorMessage
  }
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function validatePhone(phone) {
  const phoneRegex = /^\d{10,}$/
  return phoneRegex.test(phone)
}

function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId)
  if (field) {
    field.nextElementSibling.textContent = ""
  }
}
