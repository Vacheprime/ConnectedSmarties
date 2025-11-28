import { showToast } from "./notifications.js"

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
            <td>${product.upc || "-"}</td>
            <td>${product.available_stock || 0}</td>
            <td>${product.category || "-"}</td>
            <td>${product.points_worth || 0}</td>
            <td>${product.producer_company}</td>
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
  const errors = [];
  const namePattern = /^[A-Za-z0-9\s]+$/;
  const categoryPattern = /^[A-Za-z\s]+$/;
  const upcPattern = /^\d{12}$/;

  // Required fields
  if (!data.name || !data.price) {
    errors.push("Field is missing, must require the following fields: name, price");
  }

  // Name
  if (data.name && !namePattern.test(data.name)) {
    errors.push("Product name must contain only letters, numbers, and spaces.");
  }

  // Category
  if (data.category && !categoryPattern.test(data.category)) {
    errors.push("Category must contain only letters and spaces.");
  }

  // Price
  const price = parseFloat(data.price);
  if (isNaN(price)) {
    errors.push("Price must be a valid number.");
  } else if (price < 0 || price >= 1000) {
    errors.push("Price cannot be negative and cannot exceed 999.99");
  }

  // UPC
  const upc = String(data.upc || "").trim();
  if (!upcPattern.test(upc)) {
    errors.push("UPC must be exactly 12 digits.");
  }

  return errors;
}


// Save product (add or update)
async function saveProduct(event) {
  event.preventDefault()
  window.clearAllErrors()

  const form = document.getElementById("product-form")
  const formData = new FormData(form)
  const productId = formData.get("product_id")

    const data = {
    name: formData.get("name").trim(),
    price: formData.get("price").trim(),
    upc: formData.get("upc").trim(),
    category: formData.get("category").trim(),
    points_worth: formData.get("points_worth").trim() || "0",
    producer_company: formData.get("producer_company").trim()
  };

  // Validation
  const errors = validateProduct(data);
  if(errors.length > 0) {
    showToast("Validation Error", errors.join("<br>"), "error");
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
      throw new Error(error.error || `Failed to ${isEdit ? "update" : "add"} product`)
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
      document.getElementById("upc").value = product.upc || ""
      document.getElementById("category").value = product.category || ""
      document.getElementById("points_worth").value = product.points_worth || 0
      document.getElementById("producer_company").value = product.producer_company

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
  window.clearAllErrors()
}

// Inventory batch functions
let currentProductId = null;
let generatedEPCs = [];

function openInventoryModal() {
    currentProductId = document.getElementById('product_id').value;
    if (!currentProductId) {
        showToast('Error', 'Please save the product first before adding inventory.', 'error');
        return;
    }
    
    // Reset the form and EPC list
    document.getElementById('inventory-batch-form').reset();
    generatedEPCs = [];
    updateEPCDisplay();
    clearEPCErrors();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('inventoryBatchModal'));
    modal.show();
}

function generateEPCsFromRange() {
    clearEPCErrors();
    
    const prefix = document.getElementById('epc_prefix').value.trim();
    const start = parseInt(document.getElementById('epc_start').value);
    const end = parseInt(document.getElementById('epc_end').value);
    
    // Validate inputs
    if (!prefix) {
        showFieldError('epc_range', 'Prefix is required');
        return;
    }
    
    if (isNaN(start) || isNaN(end)) {
        showFieldError('epc_range', 'Start and end numbers must be valid integers');
        return;
    }
    
    if (start < 0 || end < 0) {
        showFieldError('epc_range', 'Start and end numbers must be non-negative');
        return;
    }
    
    if (start > end) {
        showFieldError('epc_range', 'Start number must be less than or equal to end number');
        return;
    }
    
    const epcLength = 24;
    const maxNumberLength = String(end).length;
    
    if (prefix.length + maxNumberLength > epcLength) {
        showFieldError('epc_range', `Prefix and number range exceed maximum EPC length of ${epcLength} characters`);
        return;
    }
    
    // Generate EPCs
    const newEPCs = [];
    const duplicates = [];
    for (let i = start; i <= end; i++) {
        const numberStr = String(i);
        const paddingLength = epcLength - prefix.length - numberStr.length;
        const padding = '0'.repeat(paddingLength);
        const epc = `${prefix}${padding}${numberStr}`;
        
        // Check if EPC already exists in the list
        if (generatedEPCs.includes(epc)) {
            duplicates.push(epc);
        } else {
            newEPCs.push(epc);
        }
    }
    
    // Warn user if duplicates were found
    if (duplicates.length > 0) {
        showToast('Warning', `Skipped ${duplicates.length} duplicate EPC(s)`, 'warning');
    }
    
    // Only add non-duplicate EPCs
    if (newEPCs.length === 0) {
        showFieldError('epc_range', 'All EPCs in this range already exist in the list');
        return;
    }
    
    generatedEPCs = [...generatedEPCs, ...newEPCs];
    updateEPCDisplay();
    
    // Clear range inputs
    document.getElementById('epc_prefix').value = '';
    document.getElementById('epc_start').value = '';
    document.getElementById('epc_end').value = '';
    
    showToast('Success', `Generated ${newEPCs.length} EPC(s) (${duplicates.length} duplicate(s) skipped)`, 'success');
}

function addManualEPC() {
    clearEPCErrors();
    
    const epcInput = document.getElementById('manual_epc').value.trim().toUpperCase();
    
    // Validate EPC
    if (!epcInput) {
        showFieldError('manual_epc', 'Please enter an EPC');
        return;
    }
    
    if (epcInput.length !== 24) {
        showFieldError('manual_epc', 'EPC must be exactly 24 characters');
        return;
    }
    
    if (!/^[0-9A-Fa-f]{24}$/.test(epcInput)) {
        showFieldError('manual_epc', 'EPC must contain only hexadecimal characters (0-9, A-F)');
        return;
    }
    
    if (generatedEPCs.includes(epcInput)) {
        showFieldError('manual_epc', 'This EPC has already been added');
        return;
    }
    
    // Add EPC
    generatedEPCs.push(epcInput);
    updateEPCDisplay();
    
    // Clear input
    document.getElementById('manual_epc').value = '';
    showToast('Success', 'EPC added', 'success');
}

function removeEPC(epc) {
    generatedEPCs = generatedEPCs.filter(e => e !== epc);
    updateEPCDisplay();
}

function updateEPCDisplay() {
    const epcList = document.getElementById('epc_list');
    const epcCount = document.getElementById('epc_count');
    
    epcCount.textContent = generatedEPCs.length;
    
    if (generatedEPCs.length === 0) {
        epcList.innerHTML = '<p class="text-muted">No EPCs added yet</p>';
        return;
    }
    
    epcList.innerHTML = generatedEPCs
        .map(epc => `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <span><code>${epc}</code></span>
                <button type="button" class="btn btn-sm btn-danger" onclick="removeEPC('${epc}')">Remove</button>
            </div>
        `)
        .join('');
}

function clearEPCErrors() {
    document.getElementById('epc_range-error').textContent = '';
    document.getElementById('manual_epc-error').textContent = '';
}

async function submitInventoryBatch() {
    clearEPCErrors();
    
    // Validate that EPCs have been added
    if (generatedEPCs.length === 0) {
        showToast('Error', 'Please add at least one EPC', 'error');
        return;
    }
    
    const receivedDateInput = document.getElementById('batch_received_date').value;
    
    // Format received_date to "YYYY-MM-DD HH:MM:SS" and validate it's not in the future
    let receivedDate = null;
    if (receivedDateInput) {
        const dateObj = new Date(receivedDateInput);
        const now = new Date();
        
        // Check if date is in the future
        if (dateObj > now) {
            showFieldError('batch_quantity', 'Received date cannot be in the future');
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
            epcs: generatedEPCs,
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
            generatedEPCs = []; // Clear EPCs after successful submission
        } else {
            showToast('Error', data.error || 'Failed to add inventory batch', 'error');
        }
    } catch (error) {
        showToast('Error', error.message, 'error');
    }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  loadProducts()

  // Real-time validation for price
  const priceInput = document.getElementById("price")
  if (priceInput) {
    priceInput.addEventListener("blur", () => {
      const value = priceInput.value
      if (value && Number.parseFloat(value) < 0) {
        showToast("Validation Error", "Price must be a positive number", "error")
      } else {
        window.clearFieldError("price")
      }
    })
  }
})

// Helper functions
function validateRequired(value) {
  return value !== null && value !== ""
}

function clearAllErrors() {
  const errorElements = document.querySelectorAll(".error")
  errorElements.forEach((element) => {
    element.style.display = "none"
  })
}

function showFieldError(fieldId, errorMessage) {
  const errorElement = document.getElementById(`${fieldId}-error`)
  if (errorElement) {
    errorElement.textContent = errorMessage
    errorElement.style.display = "block"
  }
}

function clearFieldError(fieldId) {
  const errorElement = document.getElementById(`${fieldId}-error`)
  if (errorElement) {
    errorElement.style.display = "none"
  }
}

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
  window.generateEPCsFromRange = generateEPCsFromRange
  window.addManualEPC = addManualEPC
  window.removeEPC = removeEPC
}