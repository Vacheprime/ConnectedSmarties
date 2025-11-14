import { showToast } from "./notifications.js"
// Self-checkout functionality
let cart = []
let customerPoints = 0

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

  // Reset modal when closed by any method
  const paymentModal = document.getElementById("paymentModal")
  if (paymentModal) {
    paymentModal.addEventListener("hide.bs.modal", () => {
      resetPaymentModal()
    })
  }

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
  console.log("Scanning item with code:", code)
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

function isModalOpen(modalId) {
  const modalEl = document.getElementById(modalId)
  return modalEl && modalEl.classList.contains('show')
}

function isModalInConfirmationState() {
  const confirmationSection = document.querySelector(".confirmation-section")
  return confirmationSection !== null && confirmationSection.style.display !== "none"
}

function isPaymentModalInConfirmationState() {
  return isModalOpen('paymentModal') && isModalInConfirmationState()
}

async function signInCustomer(customerId = null) {
  if (customerId === null) {
    // Get the customer ID from the input
    const customerIdInput = document.getElementById("membership-input");
    const customerId = customerIdInput.value.trim();

    if (!customerId) {
      showToast("Error", "Please enter a Customer ID", "error");
      return;
    }
  }

  // Validate the membership number
  const response = await fetch(`/api/customers/verify_membership/${customerId}`);
  
  // Show error if membership number not found
  if (!response.ok) {
    showToast("Error", "Membership number not found.", "error");
    return;
  }

  // Success - show confirmation screen
  showMembershipConfirmation(customerId);
}

function showMembershipConfirmation(memberId) {
  // Hide the membership input section
  const membershipSection = document.querySelector(".membership-section");
  const guestSection = document.querySelector(".guest-section");
  
  membershipSection.style.display = "none";
  guestSection.style.display = "none";

  // Create and show confirmation section
  const confirmationHTML = `
    <div class="confirmation-section text-center">
      <p class="mb-3">Membership Verified</p>
      <div class="member-id-display mb-4">
        <h4>${memberId}</h4>
      </div>
      <button type="button" class="btn btn-success btn-lg" onclick="confirmMembershipPayment('${memberId}')">Confirm Payment</button>
    </div>
  `;

  const modalBody = document.querySelector("#paymentModal .modal-body");
  modalBody.insertAdjacentHTML("afterbegin", confirmationHTML);
}

function confirmMembershipPayment(memberId) {
  // Process payment with membership
  processPayment(memberId);

  // Close modal and cleanup
  closePaymentModal();
  resetPaymentModal();
}

function closePaymentModal() {
  const modalEl = document.getElementById("paymentModal");
  const bsModal = bootstrap.Modal.getInstance(modalEl);
  if (bsModal) {
    bsModal.hide();
  }
}

function resetPaymentModal() {
  // Reset modal to initial state
  const membershipSection = document.querySelector(".membership-section");
  const guestSection = document.querySelector(".guest-section");
  const confirmationSection = document.querySelector(".confirmation-section");

  membershipSection.style.display = "block";
  guestSection.style.display = "block";
  
  if (confirmationSection) {
    confirmationSection.remove();
  }

  // Clear membership input
  document.getElementById("membership-input").value = "";
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
function processPayment(membershipNumber = null) {
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

// Barcode / QR code scanner handling
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
        // Scan as product
        if (!isModalOpen('paymentModal')) {
          scanItem(scannerBuffer)
          
        } else if (!isPaymentModalInConfirmationState()) {
          // Scan as membership number if payment modal is open
          signInCustomer(scannerBuffer)
        }

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

// Export functions to global scope
if (typeof window !== "undefined") {
  window.removeItem = removeItem
  window.clearCart = clearCart
  window.scanItem = scanItem
  window.processPayment = processPayment
  window.signInCustomer = signInCustomer
  window.closePaymentModal = closePaymentModal
  window.showMembershipConfirmation = showMembershipConfirmation
  window.confirmMembershipPayment = confirmMembershipPayment
  window.resetPaymentModal = resetPaymentModal
  window.isModalOpen = isModalOpen
  window.isModalInConfirmationState = isModalInConfirmationState
  window.isPaymentModalInConfirmationState = isPaymentModalInConfirmationState
}
