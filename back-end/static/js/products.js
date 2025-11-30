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

// Load products from database
async function loadProducts() {
  try {
    const response = await fetch("/api/products")
    if (response.ok) {
      const products = await response.json()
      displayProducts(products)
    } else {
      throw new Error("Failed to load products")
    }
  } catch (error) {
    console.error("Error loading products:", error)
    showToast("Database Error", "Failed to load products", "error")
    document.getElementById("products-tbody").innerHTML =
      '<tr><td colspan="9" class="loading">Error loading products</td></tr>'
  }
}

// Display products in table
function displayProducts(products) {
  const tbody = document.getElementById("products-tbody")

  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="loading">No products found</td></tr>'
    return
  }

  tbody.innerHTML = products
    .map(
      (product) => `
        <tr>
            <td>${product.product_id}</td>
            <td>${product.name}</td>
            <td>$${Number.parseFloat(product.price).toFixed(2)}</td>
            <td>${product.epc}</td>
            <td>${product.upc || "-"}</td>
            <td>${product.available_stock || 0}</td>
            <td>${product.category || "-"}</td>
            <td>${product.points_worth || 0}</td>
            <td>${product.producer_company || "-"}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editProduct(${product.product_id})">Edit</button>
                <button class="action-btn delete-btn" onclick="deleteProduct(${product.product_id})">Delete</button>
            </td>
        </tr>
    `,
    )
    .join("")
}

// Function to validate inputs for adding a Product
function validateProduct(data) {
  let isValid = true;
  const namePattern = /^[A-Za-z0-9\s'-]{2,100}$/;
  const categoryPattern = /^[A-Za-z\s'-]{2,50}$/;
  const upcPattern = /^[0-9]{12,13}$/;
  const epcPattern = /^[A-Za-z0-9]{4,64}$/;

  // Name
  if (!data.name) {
    setFieldError('name', 'Product name is required.');
    isValid = false;
  } else if (!namePattern.test(data.name)) {
    setFieldError('name', 'Name can only contain letters, numbers, spaces, \', -.');
    isValid = false;
  }

  // Price
  const price = parseFloat(data.price);
  if (!data.price) {
     setFieldError('price', 'Price is required.');
     isValid = false;
  } else if (isNaN(price) || price <= 0) {
    setFieldError('price', 'Price must be a positive number.');
    isValid = false;
  }

  // EPC
  if (!data.epc) {
    setFieldError('epc', 'EPC is required.');
    isValid = false;
  } else if (!epcPattern.test(data.epc)) {
    setFieldError('epc', 'EPC must be 4-64 alphanumeric characters.');
    isValid = false;
  }
  
  // UPC (Optional, but validated if present)
  if (data.upc && !upcPattern.test(data.upc)) {
    setFieldError('upc', 'UPC must be 12 or 13 digits.');
    isValid = false;
  }

  // Category (Optional, but validated if present)
  if (data.category && !categoryPattern.test(data.category)) {
    setFieldError('category', 'Category must contain only letters, spaces, \', -.');
    isValid = false;
  }
  
  // Points
  const points = parseInt(data.points_worth);
  if (isNaN(points) || points < 0) {
    setFieldError('points_worth', 'Points must be a positive number.');
    isValid = false;
  }

  return isValid;
}


// Save product (add or update)
async function saveProduct(event) {
  event.preventDefault()
  clearAllErrors()

  const form = document.getElementById("product-form")
  const formData = new FormData(form)
  const productId = formData.get("product_id")

  const data = {
    name: formData.get("name").trim(),
    price: formData.get("price").trim(),
    epc: formData.get("epc").trim(),
    upc: formData.get("upc").trim(),
    category: formData.get("category").trim(),
    points_worth: formData.get("points_worth").trim() || "0",
    producer_company: formData.get("producer_company").trim()
  };

  // Validation
  if (!validateProduct(data)) {
    showToast("Validation Error", "Please fix the errors in the form.", "error");
    return;
  }

  // Submit data
  try {
    const isEdit = productId && productId !== ""
    const url = isEdit ? `/api/products/${productId}` : "/api/products"
    const method = isEdit ? "PUT" : "POST"

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (response.ok) {
      const result = await response.json()
      const action = isEdit ? "edited" : "created"
      showToast("Success", `Product successfully ${action}!`, "success")
      resetForm()
      loadProducts()
    } else {
      const error = await response.json()
       if (error.error && error.error.includes("epc")) {
        setFieldError('epc', 'This EPC is already in use.');
      } else if (error.error && error.error.includes("upc")) {
        setFieldError('upc', 'This UPC is already in use.');
      } else {
        throw new Error(error.error || `Failed to ${isEdit ? "update" : "add"} product`);
      }
    }
  } catch (error) {
    console.error("Error saving product:", error)
    showToast("Error", error.message, "error")
  }
}

// Edit product - populate form with product data
async function editProduct(productId) {
  try {
    const response = await fetch(`/api/products/${productId}`)
    if (response.ok) {
      const product = await response.json()

      // Populate form
      document.getElementById("product_id").value = product.product_id
      document.getElementById("name").value = product.name
      document.getElementById("price").value = product.price
      document.getElementById("epc").value = product.epc
      document.getElementById("upc").value = product.upc || ""
      document.getElementById("category").value = product.category || ""
      document.getElementById("points_worth").value = product.points_worth || 0
      document.getElementById("producer_company").value = product.producer_company || ""

      // Update form title and button
      document.getElementById("form-title").textContent = "Edit Product"
      document.getElementById("submit-btn").textContent = "Update Product"

      // Show inventory button
      document.getElementById("add-inventory-btn").style.display = "inline-block";

      // Scroll to form
      document.querySelector(".form-section").scrollIntoView({ behavior: "smooth" })
    } else {
      throw new Error("Failed to load product details")
    }
  } catch (error) {
    console.error("Error loading product:", error)
    showToast("Error", error.message, "error")
  }
}

// Delete product
async function deleteProduct(productId) {
  if (!confirm("Are you sure you want to delete this product?")) {
    return
  }

  try {
    const response = await fetch(`/products/delete/${productId}`, {
      method: "DELETE",
    })

    if (response.ok) {
      showToast("Success", "Product successfully deleted!", "success")
      loadProducts()
    } else {
      const error = await response.json()
      throw new Error(error.error || "Failed to delete product")
    }
  } catch (error) {
    console.error("Error deleting product:", error)
    showToast("Error", error.message, "error")
  }
}

// Reset form
function resetForm() {
  document.getElementById("product-form").reset()
  document.getElementById("product_id").value = ""
  document.getElementById("form-title").textContent = "Add New Product"
  document.getElementById("submit-btn").textContent = "Add Product"
  document.getElementById("add-inventory-btn").style.display = "none";
  clearAllErrors()
}

// Inventory batch functions
let currentProductId = null;

function openInventoryModal() {
    currentProductId = document.getElementById('product_id').value;
    if (!currentProductId) {
        showToast('Please save the product first before adding inventory.', 'error');
        return;
    }
    
    // Clear the form
    document.getElementById('inventory-batch-form').reset();
    setFieldError('batch_quantity', '');
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('inventoryBatchModal'));
    modal.show();
}

async function submitInventoryBatch() {
    const quantityInput = document.getElementById('batch_quantity');
    const quantity = parseInt(quantityInput.value);
    const receivedDateInput = document.getElementById('batch_received_date').value;
    
    // Validate quantity
    if (!quantity || quantity <= 0) {
        setFieldError('batch_quantity', 'Quantity must be a positive integer');
        return;
    } else {
         setFieldError('batch_quantity', '');
    }
    
    // Format received_date to "YYYY-MM-DD HH:MM:SS" and validate it's not in the future
    let receivedDate = null;
    if (receivedDateInput) {
        const dateObj = new Date(receivedDateInput);
        const now = new Date();
        
        if (dateObj > now) {
            setFieldError('batch_quantity', 'Received date cannot be in the future'); // Re-using error span for simplicity
            return;
        }
        
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        const seconds = '00';
        receivedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    try {
        const payload = {
            product_id: currentProductId,
            quantity: quantity,
            received_date: receivedDate
        };
        
        const response = await fetch('/api/inventory/add-batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Success', 'Inventory batch added successfully!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('inventoryBatchModal')).hide();
            loadProducts(); // Refresh the products table
        } else {
            showToast('Error', data.error || 'Failed to add inventory batch', 'error');
        }
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  loadProducts()

  // Add real-time validation to clear errors on input
  document.getElementById("product-form").querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => {
      // Clear the error for this specific field
      setFieldError(input.id, '');
    });
  });
});

// Expose functions to global scope
if (typeof window !== "undefined") {
  window.saveProduct = saveProduct
  window.editProduct = editProduct
  window.deleteProduct = deleteProduct
  window.resetForm = resetForm
  window.clearFieldError = clearFieldError
  window.showFieldError = showFieldError
  window.clearAllErrors = clearAllErrors
  window.loadProducts = loadProducts
  window.openInventoryModal = openInventoryModal
  window.submitInventoryBatch = submitInventoryBatch
}