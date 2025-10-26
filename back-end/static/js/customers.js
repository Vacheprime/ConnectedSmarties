// Load customers from database
async function loadCustomers() {
  try {
    const response = await fetch("/customers/data");
    if (response.ok) {
      const customers = await response.json();
      displayCustomers(customers);
    } else {
      throw new Error("Failed to load customers");
    }
  } catch (error) {
    console.error("Error loading customers:", error);
    showToast("Database Error", "Failed to load customers", "error");
    document.getElementById("customers-tbody").innerHTML =
      '<tr><td colspan="7" class="loading">Error loading customers</td></tr>';
  }
}

// Display customers in table
function displayCustomers(customers) {
  const tbody = document.getElementById("customers-tbody");

  if (customers.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="loading">No customers found</td></tr>';
    return;
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
    `
    )
    .join("");
}


// Function to validate inputs for adding a Customer
function validateCustomer(data) {
  const errors = [];
  const namePattern = /^[A-Za-z]+(?:[-' ][A-Za-z]+)*$/;
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const phonePattern = /(\+\d{1,3})?\s?\(?\d{1,4}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;

  // Required fields
  if (!data.first_name || !data.last_name || !data.email || !data.phone_number) {
    errors.push("Field is missing, must require the following fields: first name, last name, and email.");
  }

  // Name validation
  if (
    (data.first_name && !namePattern.test(data.first_name)) ||
    (data.last_name && !namePattern.test(data.last_name))
  ) {
    errors.push("Invalid name format: only letters, spaces, hyphens, and apostrophes are allowed.");
  }

  // Email validation
  if (data.email && !emailPattern.test(data.email)) {
    errors.push("Invalid Email Format");
  }

  // Phone validation
  if (data.phone_number && !phonePattern.test(data.phone_number)) {
    errors.push("Phone Number Format Invalid");
  }

  // Reward points validation
  if (data.rewards_points !== undefined && data.rewards_points !== "") {
    if (isNaN(parseInt(data.rewards_points))) {
      errors.push("Reward points must be an integer.");
    }
  }

  return errors;
}
// Add customer
async function addCustomer(event) {
  event.preventDefault();

  const form = document.getElementById("customer-form");
  const formData = new FormData(form);

  const data = {
    first_name: formData.get("first_name").trim(),
    last_name: formData.get("last_name").trim(),
    email: formData.get("email").trim(),
    phone_number: formData.get("phone_number").trim(),
    rewards_points: formData.get("rewards_points").trim() || "0",
  };

  const errors = validateCustomer(data);
  if (errors.length > 0) {
    showToast("Validation Error", errors.join("<br>"), "error");
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
      throw new Error(error.error || "Failed to add customer");
    }
  } catch (error) {
    console.error("Error adding customer:", error);
    showToast("Error", error.message, "error");
  }
}

// Delete customer
async function deleteCustomer(customerId) {
  if (!confirm("Are you sure you want to delete this customer?")) {
    return;
  }

  try {
    const response = await fetch(`/customers/delete/${customerId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      showToast("Success", "Customer successfully deleted!", "success");
      loadCustomers();
    } else {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete customer");
    }
  } catch (error) {
    console.error("Error deleting customer:", error);
    showToast("Error", error.message, "error");
  }
}

// Reset form
function resetForm() {
  document.getElementById("customer-form").reset();
  clearAllErrors();
}

function clearAllErrors() {
  // Clear all errors logic here
}

function validateRequired(value) {
  return value.trim() !== "";
}

function showFieldError(fieldId, errorMessage) {
  const field = document.getElementById(fieldId);
  if (field) {
    field.nextElementSibling.textContent = errorMessage;
  }
}

function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  if (field) {
    field.nextElementSibling.textContent = "";
  }
}
