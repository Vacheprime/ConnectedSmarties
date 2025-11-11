function togglePasswordVisibility(inputId) {
  const passwordInput = document.getElementById(inputId)
  const toggleIcon = document.getElementById(`${inputId}-toggle-icon`)

  if (passwordInput.type === "password") {
    passwordInput.type = "text"
    toggleIcon.classList.remove("fa-eye")
    toggleIcon.classList.add("fa-eye-slash")
  } else {
    passwordInput.type = "password"
    toggleIcon.classList.remove("fa-eye-slash")
    toggleIcon.classList.add("fa-eye")
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      alert("Please fill in both fields.");
      return;
    }

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.redirect) {
        window.location.href = data.redirect;
      } else {
        alert(data.error || "Invalid credentials.");
      }
    } catch (err) {
      console.error("Login request failed:", err);
      alert("Server error. Please try again later.");
    }
  });
});