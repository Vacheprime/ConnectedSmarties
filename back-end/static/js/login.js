async function login(event) {
    event.preventDefault();
    window.clearAllErrors?.(); 

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    // Input validation
    if (!email || !password) {
        showToast("Login Error", "Please fill in both email and password.", "error");
        return;
    }

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Redirect user to their correct dashboard (customer/admin)
            showToast("Login Successful", "Redirecting...", "success");
            setTimeout(() => {
                window.location.href = data.redirect;
            }, 1000);
        } else {
            showToast("Login Failed", data.error || "Invalid credentials.", "error");
        }
    } catch (err) {
        console.error("Error during login:", err);
        showToast("Server Error", "Something went wrong. Please try again.", "error");
    }
}
