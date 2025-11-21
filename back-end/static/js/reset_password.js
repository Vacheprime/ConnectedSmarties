function togglePasswordVisibility(inputId) {
  const passwordInput = document.getElementById(inputId);
  const toggleIcon = document.getElementById(`${inputId}-toggle-icon`);

  if (!passwordInput || !toggleIcon) return;

  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    toggleIcon.classList.remove("fa-eye");
    toggleIcon.classList.add("fa-eye-slash");
  } else {
    passwordInput.type = "password";
    toggleIcon.classList.remove("fa-eye-slash");
    toggleIcon.classList.add("fa-eye");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".password-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target;
      if (target) togglePasswordVisibility(target);
    });
  });

  const form = document.getElementById("reset-form")

  form.addEventListener("submit", async (e) => {
    e.preventDefault()

    const email = document.getElementById("email").value.trim()

    if (!email) {
      alert("Please enter your email address.")
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address.")
      return
    }

    try {
      const response = await fetch("/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(data.message || "Password reset email sent successfully! Please check your inbox.")
        // Redirect to login page after 2 seconds
        setTimeout(() => {
          window.location.href = "/"
        }, 2000)
      } else {
        alert(data.error || "Failed to send reset email. Please try again.")
      }
    } catch (err) {
      console.error("Reset password request failed:", err)
      alert("Server error. Please try again later.")
    }
  })
})
