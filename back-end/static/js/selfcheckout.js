import { showToast } from './notifications.js';
import { updatePageLanguage, getCurrentLanguage } from './i18n.js';

// Self-checkout functionality
let cart = []
let customerPoints = 0

// Declare necessary variables
//let showToast
//let updatePageLanguage
//let getCurrentLanguage

// QR scanner buffer
let scannerBuffer = ""
let scannerTimeout = null
let firstKeyEvent = null
const SCANNER_TIMEOUT_MS = 50 // Time window to detect scanner input (ms)

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  // Load customer points (you can modify this to load from a logged-in customer)
  loadCustomerPoints()

  // Allow Enter key to scan
  document.getElementById("scan-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const input = document.getElementById("scan-input")
      const code = input.value.trim()
      if (code) {
        scanItem(code)
        input.value = ""
      }
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

async function manuallyScanItem() {
  const input = document.getElementById("scan-input")
  const code = input.value.trim()
  if (code) {
    await scanItem(code)
    input.value = ""
  }
}

// Scan an item by UPC or EPC
async function scanItem(code) {
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
    const product = products.find((p) => p.upc == code || p.epc == code)

    if (!product) {
      showToast("Not Found", "Item not found. Please try again.", "warning")
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
      (item) => `
        <div class="item-row">
            <div class="item-info">
                <h4>${item.name}</h4>
                <div class="item-upc">UPC: ${item.upc || "N/A"}</div>
                <div class="item-points">+${item.points_worth} ${getCurrentLanguage() === "fr" ? "points" : "points"}</div>
            </div>
            <div class="item-price">$${Number.parseFloat(item.price).toFixed(2)}</div>
            <div class="item-quantity">${item.quantity}x</div>
        </div>
    `,
    )
    .join("")
}

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
// showToast = (title, message, type) => {
//   // Implementation of showToast
//   console.log(`${title}: ${message}`)
// }

// updatePageLanguage = () => {
//   // Implementation of updatePageLanguage
//   console.log("Page language updated")
// }

// getCurrentLanguage = () => {
//   // Implementation of getCurrentLanguage
//   return "en" // Default to English
// }

// QR Code Scanner Listener — collect characters until Enter is pressed.
// Capture all key input except when focus is on inputs/buttons/textareas/contenteditable
// and ignore events with modifier keys to allow normal shortcuts.
// Uses timer to distinguish between scanner (fast) and manual typing (slow).
window.addEventListener(
  "keydown",
  (e) => {
    const active = document.activeElement
    if (
      active &&
      (active.tagName === "INPUT" ||
        active.tagName === "TEXTAREA" ||
        active.tagName === "BUTTON" ||
        active.isContentEditable)
    ) {
      // Let the focused control handle the key
      return
    }

    // If this is the first key in a potential scan sequence
    if (!firstKeyEvent && scannerBuffer === "") {
      // Store the event to potentially replay it later
      firstKeyEvent = {
        key: e.key,
        code: e.code,
        ctrlKey: e.ctrlKey,
        altKey: e.altKey,
        shiftKey: e.shiftKey,
        metaKey: e.metaKey,
      }

      // Prevent default for now
      e.preventDefault()
      e.stopImmediatePropagation()

      // Start timer - if it expires, this was manual input
      scannerTimeout = setTimeout(() => {
        // Timer expired - this is manual input, not scanner
        // Replay the first key event by simulating it
        const replayEvent = new KeyboardEvent("keydown", firstKeyEvent)
        
        // Clear state
        firstKeyEvent = null
        scannerBuffer = ""
        scannerTimeout = null

        // Don't re-trigger our listener for the replayed event
        // The browser will handle it naturally
      }, SCANNER_TIMEOUT_MS)

      // Handle Enter on first key
      if (e.key === "Enter") {
        clearTimeout(scannerTimeout)
        scannerTimeout = null
        firstKeyEvent = null
        return
      }

      // Add to buffer
      if (e.key && e.key.length === 1) {
        scannerBuffer += e.key
      }
      return
    }

    // We have a scan in progress - definitely scanner input
    e.preventDefault()
    e.stopImmediatePropagation()

    // Clear and restart the timeout
    if (scannerTimeout) {
      clearTimeout(scannerTimeout)
    }
    scannerTimeout = setTimeout(() => {
      // Scan incomplete - reset
      scannerBuffer = ""
      firstKeyEvent = null
      scannerTimeout = null
    }, SCANNER_TIMEOUT_MS)

    if (e.key === "Enter") {
      // Finish scan
      clearTimeout(scannerTimeout)
      scannerTimeout = null
      
      if (scannerBuffer.trim()) {
        scanItem(scannerBuffer)
      }
      console.log(scannerBuffer)
      scannerBuffer = ""
      firstKeyEvent = null
      return
    }

    // Append printable characters only (single-char keys)
    if (e.key && e.key.length === 1) {
      scannerBuffer += e.key
    }
  },
  /* useCapture */ true,
)

// Expose functions to global scope for button onclick handlers
if (typeof window !== "undefined") {
  window.checkout = {
    clearCart,
    processPayment,
    scanItem,
    manuallyScanItem
  }
}
