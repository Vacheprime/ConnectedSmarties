// === LOGOUT ===
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

export { logoutUser };

if (typeof window !== "undefined") {
    window.logoutUser = logoutUser;
}