// Self-checkout functionality
let cart = []
let customerPoints = 0

// Declare necessary variables
let showToast
let updatePageLanguage
let getCurrentLanguage

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  // Load customer points (you can modify this to load from a logged-in customer)
  loadCustomerPoints()

  // Allow Enter key to scan
  document.getElementById("scan-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      scanItem()
    }
  })

  renderCart()
})

// Load customer points (placeholder - replace with actual customer data)
function loadCustomerPoints() {
  // For demo purposes, starting with 0 points
  // In production, this would load from the logged-in customer
  customerPoints = 0
  updateTotals()
}

// Scan an item by UPC or EPC
async function scanItem() {
  const input = document.getElementById("scan-input")
  const code = input.value.trim()

  if (!code) {
    showToast("Error", "Please enter a UPC or EPC code", "error")
    return
  }

  try {
    // Fetch all products and find matching item
    const response = await fetch("/api/products")
    if (!response.ok) {
      throw new Error("Failed to fetch products")
    }

    const products = await response.json()
    const product = products.find((p) => p.upc === code || p.epc === code)

    if (!product) {
      showToast("Not Found", "Item not found. Please try again.", "warning")
      input.value = ""
      return
    }

    // Check if item already in cart
    const existingItem = cart.find((item) => item.product_id === product.product_id)

    if (existingItem) {
      existingItem.quantity++
    } else {
      cart.push({
        ...product,
        quantity: 1,
      })
    }

    showToast("Success", `Added ${product.name} to cart`, "success")
    input.value = ""
    renderCart()
    updateTotals()
  } catch (error) {
    console.error("Error scanning item:", error)
    showToast("Error", "Failed to scan item", "error")
  }
}

// Render the cart
function renderCart() {
  const itemsList = document.getElementById("items-list")

  if (cart.length === 0) {
    itemsList.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">🛒</div>
                <h3 data-i18n="noItems">No items scanned yet</h3>
                <p data-i18n="scanToBegin">Scan an item to begin</p>
            </div>
        `
    updatePageLanguage() // Update translations for dynamically added content
    return
  }

  itemsList.innerHTML = cart
    .map(
      (item, index) => `
        <div class="item-row">
            <div class="item-info">
                <h4>${item.name}</h4>
                <div class="item-upc">UPC: ${item.upc || "N/A"}</div>
                <div class="item-points">+${item.points_worth} ${getCurrentLanguage() === "fr" ? "points" : "points"}</div>
            </div>
            <div class="item-price">$${Number.parseFloat(item.price).toFixed(2)}</div>
            <div class="item-quantity">${item.quantity}x</div>
            <div class="item-remove">
                <button class="btn-remove" onclick="removeItem(${index})">
                    <i class="fas fa-trash"></i>
                    ${getCurrentLanguage() === "fr" ? "Retirer" : "Remove"}
                </button>
            </div>
        </div>
    `,
    )
    .join("")
}

// Declare functions for showToast, updatePageLanguage, and getCurrentLanguage
// showToast = (title, message, type) => {
//   // Implementation of showToast
//   console.log(`${title}: ${message}`)
// }
// updatePageLanguage = () => {
//   // Implementation of updatePageLanguage
//   console.log("Page language updated")
// }
// getCurrentLanguage = () => {
//   // Implementation of getCurrentLanguage
//   return "en" // Default to English
// }
// QR Code Scanner Listener — collect characters until Enter is pressed.
// Capture all key input except when focus is on inputs/buttons/textareas/contenteditable
// and ignore events with modifier keys to allow normal shortcuts.
// Uses timer to distinguish between scanner (fast) and manual typing (slow).

// Update totals
function updateTotals() {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const pointsEarned = cart.reduce((sum, item) => sum + item.points_worth * item.quantity, 0)
  const totalPoints = customerPoints + pointsEarned

  document.getElementById("subtotal-value").textContent = `$${subtotal.toFixed(2)}`
  document.getElementById("points-earned-value").textContent = pointsEarned
  document.getElementById("total-points-value").textContent = totalPoints
  document.getElementById("total-value").textContent = `$${subtotal.toFixed(2)}`

  // Enable/disable pay button
  const payBtn = document.getElementById("pay-btn")
  payBtn.disabled = cart.length === 0
}

function removeItem(index) {
  if (index >= 0 && index < cart.length) {
    const item = cart[index]
    cart.splice(index, 1)
    showToast(
      "Success",
      getCurrentLanguage() === "fr" ? `${item.name} retiré du panier` : `${item.name} removed from cart`,
      "success",
    )
    renderCart()
    updateTotals()
  }
}

// Clear the cart
function clearCart() {
  if (cart.length === 0) return

  if (
    confirm(
      getCurrentLanguage() === "fr"
        ? "Êtes-vous sûr de vouloir vider le panier?"
        : "Are you sure you want to clear the cart?",
    )
  ) {
    cart = []
    renderCart()
    updateTotals()
    showToast("Success", getCurrentLanguage() === "fr" ? "Panier vidé" : "Cart cleared", "success")
  }
}

// Process payment
function processPayment() {
  if (cart.length === 0) return

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const pointsEarned = cart.reduce((sum, item) => sum + item.points_worth * item.quantity, 0)

  // In a real implementation, this would process payment and update customer points
  const message =
    getCurrentLanguage() === "fr"
      ? `Paiement de $${total.toFixed(2)} traité avec succès! Vous avez gagné ${pointsEarned} points.`
      : `Payment of $${total.toFixed(2)} processed successfully! You earned ${pointsEarned} points.`

  showToast("Success", message, "success")

  // Update customer points
  customerPoints += pointsEarned

  // Clear cart
  cart = []
  renderCart()
  updateTotals()
}

// Declare functions for showToast, updatePageLanguage, and getCurrentLanguage
showToast = (title, message, type) => {
  // Implementation of showToast
  console.log(`${title}: ${message}`)
}

updatePageLanguage = () => {
  // Implementation of updatePageLanguage
  console.log("Page language updated")
}

getCurrentLanguage = () => {
  // Implementation of getCurrentLanguage
  return "en" // Default to English
}
