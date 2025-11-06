

// Notification system (debug-safe version)
function showToast(title, message, type = "info") {
  console.log("showToast called:", { title, message, type });

  try {
    // Create toast container if it doesn’t exist
    let toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
      console.log("No toast-container found — creating one.");
      toastContainer = document.createElement("div");
      toastContainer.id = "toast-container";
      toastContainer.className = "toast-container position-fixed top-0 end-0 p-3";
      document.body.appendChild(toastContainer);
    }

    // Make sure container is visible and above everything
    toastContainer.style.position = "fixed";
    toastContainer.style.top = "1rem";
    toastContainer.style.right = "1rem";
    toastContainer.style.zIndex = "9999";

    // Determine Bootstrap color class
    const typeClassMap = {
      success: "text-bg-success",
      error: "text-bg-danger",
      warning: "text-bg-warning",
      info: "text-bg-primary"
    };

    const typeClass = typeClassMap[type] || "text-bg-secondary";
    console.log("Toast typeClass:", typeClass);

    // Create the toast element
    const toastEl = document.createElement("div");
    toastEl.className = `toast align-items-center ${typeClass} border-0 mt-2 fade`;
    toastEl.setAttribute("role", "alert");
    toastEl.setAttribute("aria-live", "assertive");
    toastEl.setAttribute("aria-atomic", "true");

    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          <strong>${title}</strong><br>${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;

    console.log("Appending toast to container...");
    toastContainer.appendChild(toastEl);

    // Ensure Bootstrap is available
    if (typeof bootstrap === "undefined" || !bootstrap.Toast) {
      console.error("Bootstrap.Toast is not available!");
      alert(`${title}: ${message}`); // fallback for debugging
      return;
    }

    // Initialize and show the toast
    console.log("Initializing Bootstrap toast...");
    const bsToast = new bootstrap.Toast(toastEl, { delay: 4000 });
    bsToast.show();

    // Clean up toast after hiding
    toastEl.addEventListener("hidden.bs.toast", () => {
      console.log("Toast hidden → removing element.");
      toastEl.remove();
    });

    console.log("✅ Toast should now be visible!");
  } catch (err) {
    console.error("showToast() failed:", err);
    alert("Toast error: " + err.message); // fallback visible alert
  }
}
