// // Notification system
// function showNotification(title, message, type = "info") {

//   const existingNotification = document.getElementById("notification-modal")
//   if (existingNotification) {
//     existingNotification.remove()
//   }

//   const icons = {
//     success: "✓",
//     error: "✕",
//     warning: "⚠",
//     info: "ℹ",
//   }

//   const colors = {
//     success: "var(--color-success)",
//     error: "var(--color-error)",
//     warning: "var(--color-warning)",
//     info: "var(--color-primary)",
//   }

//   // Create modal overlay
//   const modal = document.createElement("div")
//   modal.id = "notification-modal"
//   modal.className = "notification-modal"
//   modal.style.cssText = `
//     position: fixed;
//     top: 0;
//     left: 0;
//     right: 0;
//     bottom: 0;
//     background-color: rgba(0, 0, 0, 0.5);
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     z-index: 9999;
//     animation: fadeIn 0.2s ease-out;
//   `

//   // Create notification box
//   const notificationBox = document.createElement("div")
//   notificationBox.className = "notification-box"
//   notificationBox.style.cssText = `
//     background-color: white;
//     padding: 2rem;
//     border-radius: 12px;
//     box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
//     max-width: 400px;
//     width: 90%;
//     text-align: center;
//     animation: slideDown 0.3s ease-out;
//   `

//   notificationBox.innerHTML = `
//     <div style="
//       width: 60px;
//       height: 60px;
//       border-radius: 50%;
//       background-color: ${colors[type]};
//       color: white;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       font-size: 2rem;
//       margin: 0 auto 1rem;
//     ">
//       ${icons[type] || icons.info}
//     </div>
//     <h3 style="
//       margin: 0 0 0.5rem 0;
//       color: var(--color-text-normal);
//       font-size: 1.25rem;
//     ">${title}</h3>
//     <p style="
//       margin: 0 0 1.5rem 0;
//       color: var(--color-text-muted);
//       font-size: 0.95rem;
//     ">${message}</p>
//     <button onclick="closeNotification()" style="
//       background-color: ${colors[type]};
//       color: white;
//       border: none;
//       padding: 0.75rem 2rem;
//       border-radius: 8px;
//       font-size: 0.95rem;
//       font-weight: 600;
//       cursor: pointer;
//       font-family: inherit;
//     ">OK</button>
//   `

//   modal.appendChild(notificationBox)
//   document.body.appendChild(modal)

  
//   setTimeout(() => {
//     closeNotification()
//   }, 3000)

//   // Close on overlay click
//   modal.addEventListener("click", (e) => {
//     if (e.target === modal) {
//       closeNotification()
//     }
//   })
// }

// function closeNotification() {
//   const modal = document.getElementById("notification-modal")
//   if (modal) {
//     modal.style.animation = "fadeOut 0.2s ease-out"
//     setTimeout(() => {
//       modal.remove()
//     }, 200)
//   }
// }

// // Add CSS animations
// if (!document.getElementById("notification-styles")) {
//   const style = document.createElement("style")
//   style.id = "notification-styles"
//   style.textContent = `
//     @keyframes fadeIn {
//       from { opacity: 0; }
//       to { opacity: 1; }
//     }
//     @keyframes fadeOut {
//       from { opacity: 1; }
//       to { opacity: 0; }
//     }
//     @keyframes slideDown {
//       from {
//         transform: translateY(-50px);
//         opacity: 0;
//       }
//       to {
//         transform: translateY(0);
//         opacity: 1;
//       }
//     }
//   `
//   document.head.appendChild(style)
// }

// // Validation helpers
// function validateEmail(email) {
//   const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
//   return re.test(email)
// }

// function validatePhone(phone) {
//   const re = /^[\d\s\-+$$$$]+$/
//   return re.test(phone) && phone.replace(/\D/g, "").length >= 10
// }

// function validateRequired(value) {
//   return value && value.trim().length > 0
// }

// function showFieldError(fieldId, message) {
//   const field = document.getElementById(fieldId)
//   const errorSpan = document.getElementById(`${fieldId}-error`)

//   if (field) {
//     field.classList.add("error")
//   }

//   if (errorSpan) {
//     errorSpan.textContent = message
//   }
// }

// function clearFieldError(fieldId) {
//   const field = document.getElementById(fieldId)
//   const errorSpan = document.getElementById(`${fieldId}-error`)

//   if (field) {
//     field.classList.remove("error")
//   }

//   if (errorSpan) {
//     errorSpan.textContent = ""
//   }
// }

// function clearAllErrors() {
//   document.querySelectorAll(".error").forEach((el) => el.classList.remove("error"))
//   document.querySelectorAll(".error-message").forEach((el) => (el.textContent = ""))
// }
function showToast(title, message, type = "info") {
  // Create the toast container if it doesn't exist
  let toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toastContainer";
    toastContainer.className = "toast-container position-fixed top-0 end-0 p-3";
    document.body.appendChild(toastContainer);
  }

  // Determine Bootstrap color class
  const typeClass = {
    success: "text-bg-success",
    error: "text-bg-danger",
    warning: "text-bg-warning",
    info: "text-bg-primary"
  }[type] || "text-bg-secondary";

  // Create toast element
  const toastEl = document.createElement("div");
  toastEl.className = `toast align-items-center ${typeClass} border-0`;
  toastEl.setAttribute("role", "alert");
  toastEl.setAttribute("aria-live", "assertive");
  toastEl.setAttribute("aria-atomic", "true");

  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <strong>${title}</strong><br>${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  toastContainer.appendChild(toastEl);

  // Show the toast
  const bsToast = new bootstrap.Toast(toastEl, { delay: 3000 });
  bsToast.show();

  // Remove toast from DOM after it hides
  toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
}