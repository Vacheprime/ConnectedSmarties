import { showToast } from './notifications.js'

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

// Load customers from database
async function loadCustomers() {
  try {
    const response = await fetch("/customers/data")
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

// Password toggle logic
document.addEventListener('DOMContentLoaded', function() {
  const togglePasswordButton = document.getElementById('togglePassword');
  if (togglePasswordButton) {
    const passwordInput = document.getElementById(togglePasswordButton.dataset.target);
    const eyeIcon = document.getElementById('password-toggle-icon');

    togglePasswordButton.addEventListener('click', function() {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      eyeIcon.classList.toggle('fa-eye');
      eyeIcon.classList.toggle('fa-eye-slash');
    });
  }
});


// Function to validate inputs for adding a Customer
function validateCustomer(data) {
  let isValid = true;
  const namePattern = /^[A-Za-z\s'-]{2,50}$/;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^[0-9]{10,15}$/;
  const passwordPattern = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*[0-9]).{8,}$/;

  // First Name
  if (!data.first_name) {
    setFieldError('first_name', 'First name is required.');
    isValid = false;
  } else if (!namePattern.test(data.first_name)) {
    setFieldError('first_name', 'Please enter a valid name.');
    isValid = false;
  }

  // Last Name
  if (!data.last_name) {
    setFieldError('last_name', 'Last name is required.');
    isValid = false;
  } else if (!namePattern.test(data.last_name)) {
    setFieldError('last_name', 'Please enter a valid name.');
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
    setFieldError('password', 'Password must be 8+ chars, with 1 uppercase, 1 number, and 1 special char.');
    isValid = false;
  }

  // Phone validation
  if (!data.phone_number) {
    setFieldError('phone_number', 'Phone number is required.');
    isValid = false;
  } else if (!phonePattern.test(data.phone_number)) {
    setFieldError('phone_number', 'Please enter 10-15 digits only.');
    isValid = false;
  }

  // Reward points validation
  const points = parseInt(data.rewards_points);
  if (isNaN(points) || points < 0) {
    setFieldError('rewards_points', 'Points must be a positive number.');
    isValid = false;
  }

  return isValid;
}

// Add customer
async function addCustomer(event) {
  event.preventDefault();
  clearAllErrors();

  const form = document.getElementById("customer-form");
  const formData = new FormData(form);

  const data = {
    first_name: formData.get("first_name")?.trim(),
    last_name: formData.get("last_name")?.trim(),
    email: formData.get("email")?.trim(),
    password: formData.get("password")?.trim(),
    phone_number: formData.get("phone_number")?.trim(),
    rewards_points: formData.get("rewards_points")?.trim() || "0",
  };

  if (!validateCustomer(data)) {
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

    if (response.ok) {
      const result = await response.json();
      showToast("Success", "Customer successfully created!", "success");
      form.reset();
      loadCustomers();
    } else {
      const error = await response.json();
      if (error.error && error.error.includes("email")) {
        setFieldError('email', 'This email is already registered.');
      } else if (error.error && error.error.includes("phone")) {
        setFieldError('phone_number', 'This phone number is already registered.');
      } else {
        throw new Error(error.error || "Failed to add customer");
      }
    }
  } catch (error) {
    console.error("Error adding customer:", error);
    showToast("Error", error.message, "error");
  }
}

// Delete customer
async function deleteCustomer(customerId) {
  if (!confirm("Are you sure you want to delete this customer?")) {
    return
  }

  try {
    const response = await fetch(`/customers/delete/${customerId}`, {
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
  loadCustomers();

  // Add real-time validation to clear errors on input
  document.getElementById("customer-form").querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => {
      // Clear the error for this specific field
      setFieldError(input.id, '');
    });
  });
});

// Expose functions to global scope
if (typeof window !== "undefined") {
  window.displayCustomers = displayCustomers
  window.addCustomer = addCustomer
  window.deleteCustomer = deleteCustomer
  window.resetForm = resetForm
  window.loadCustomers = loadCustomers
}