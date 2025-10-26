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
    window.showToast("Database Error", "Failed to load products", "error")
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
            <td>
                <button class="action-btn edit-btn" onclick="editProduct(${product.product_id})">Edit</button>
                <button class="action-btn delete-btn" onclick="deleteProduct(${product.product_id})">Delete</button>
            </td>
        </tr>
    `,
    )
    .join("")
}

async function saveProduct(event) {
  event.preventDefault()
  window.clearAllErrors()

  const form = document.getElementById("product-form")
  const formData = new FormData(form)
  const productId = formData.get("product_id")

  // Validation
  let isValid = true

  const name = formData.get("name")
  if (!window.validateRequired(name)) {
    window.showToast("Validation Error", "Product name is required", "error")
    isValid = false
  }

  const price = formData.get("price")
  if (!window.validateRequired(price)) {
    window.showToast("Validation Error", "Price is required", "error")
    isValid = false
  } else if (Number.parseFloat(price) < 0) {
    window.showToast("Validation Error", "Price must be a positive number", "error")
    isValid = false
  }

  const epc = formData.get("epc")
  if (!window.validateRequired(epc)) {
    window.showToast("Validation Error", "EPC is required", "error")
    isValid = false
  }

  const availableStock = formData.get("available_stock")
  if (availableStock && Number.parseInt(availableStock) < 0) {
    window.showToast("Validation Error", "Stock must be a non-negative number", "error")
    isValid = false
  }

  const pointsWorth = formData.get("points_worth")
  if (pointsWorth && Number.parseInt(pointsWorth) < 0) {
    window.showToast("Validation Error", "Points must be a non-negative number", "error")
    isValid = false
  }

  if (!isValid) {
    window.showToast("Validation Error", "Please fix the errors in the form", "error")
    return
  }

  // Prepare data
  const data = {
    name: name,
    price: Number.parseFloat(price),
    epc: epc,
    upc: formData.get("upc") || null,
    available_stock: Number.parseInt(availableStock) || 0,
    category: formData.get("category") || null,
    points_worth: Number.parseInt(pointsWorth) || 0,
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
      window.showToast("Success", `Product successfully ${action}!`, "success")
      resetForm()
      loadProducts()
    } else {
      const error = await response.json()
      throw new Error(error.error || `Failed to ${isEdit ? "update" : "add"} product`)
    }
  } catch (error) {
    console.error("Error saving product:", error)
    window.showToast("Error", error.message, "error")
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
      document.getElementById("available_stock").value = product.available_stock || 0
      document.getElementById("category").value = product.category || ""
      document.getElementById("points_worth").value = product.points_worth || 0

      // Update form title and button
      document.getElementById("form-title").textContent = "Edit Product"
      document.getElementById("submit-btn").textContent = "Update Product"

      // Scroll to form
      document.querySelector(".form-section").scrollIntoView({ behavior: "smooth" })
    } else {
      throw new Error("Failed to load product details")
    }
  } catch (error) {
    console.error("Error loading product:", error)
    window.showToast("Error", error.message, "error")
  }
}

// Delete product
async function deleteProduct(productId) {
  if (!confirm("Are you sure you want to delete this product?")) {
    return
  }

  try {
    const response = await fetch(`/api/products/${productId}`, {
      method: "DELETE",
    })

    if (response.ok) {
      window.showToast("Success", "Product successfully deleted!", "success")
      loadProducts()
    } else {
      const error = await response.json()
      throw new Error(error.error || "Failed to delete product")
    }
  } catch (error) {
    console.error("Error deleting product:", error)
    window.showToast("Error", error.message, "error")
  }
}

// Reset form
function resetForm() {
  document.getElementById("product-form").reset()
  document.getElementById("product_id").value = ""
  document.getElementById("form-title").textContent = "Add New Product"
  document.getElementById("submit-btn").textContent = "Add Product"
  window.clearAllErrors()
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
        window.showToast("Validation Error", "Price must be a positive number", "error")
      } else {
        window.clearFieldError("price")
      }
    })
  }

  // Real-time validation for stock
  const stockInput = document.getElementById("available_stock")
  if (stockInput) {
    stockInput.addEventListener("blur", () => {
      const value = stockInput.value
      if (value && Number.parseInt(value) < 0) {
        window.showToast("Validation Error", "Stock must be a non-negative number", "error")
      } else {
        window.clearFieldError("available_stock")
      }
    })
  }
})
