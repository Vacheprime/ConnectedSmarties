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

function logoutUser() {
    fetch("/logout")
        .then(response => {
            if (response.redirected) {
                window.location.href = response.url;
            } else {
                window.location.href = "/";
            }
        })
        .catch(err => console.error("Logout failed:", err));
}