function showToast(title, message, type = "info") {
  try {
    // Create toast container if it doesn’t exist
    let toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "toast-container";
      document.body.appendChild(toastContainer);
    }

    toastContainer.style.position = "fixed";
    toastContainer.style.top = "1rem";
    toastContainer.style.right = "1rem";
    toastContainer.style.zIndex = "9999";
    toastContainer.style.display = "flex";
    toastContainer.style.flexDirection = "column";
    toastContainer.style.alignItems = "end";
    toastContainer.style.gap = "0.5rem";

    const typeClassMap = {
      success: "text-bg-success",
      error: "text-bg-danger",
      warning: "text-bg-warning",
      info: "text-bg-primary",
    };
    const typeClass = typeClassMap[type] || "text-bg-secondary";

    // Toast HTML structure
    const toastEl = document.createElement("div");
    toastEl.className = `toast align-items-center ${typeClass} border-0 shadow`;
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

    toastContainer.appendChild(toastEl);

    if (typeof bootstrap !== "undefined" && bootstrap.Toast) {
      const bsToast = new bootstrap.Toast(toastEl, { delay: 4000 });
      bsToast.show();

      // Remove after it disappears
      toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
    } else {
      alert(`${title}: ${message}`); 
    }
  } catch (err) {
    console.error("showToast() failed:", err);
    alert("Toast error: " + err.message);
  }
}
