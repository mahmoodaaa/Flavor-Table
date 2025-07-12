// public/login.js
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const errorMsg = document.getElementById("login-error");

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

   if (response.ok && data.token) {
  localStorage.setItem("token", data.token);
  alert("Login successful!");
  window.location.href = "/profile.html"; // ✅ redirect to dashboard/profile
 // redirect to home or profile
    } else {
      errorMsg.textContent = data.message || "Invalid login credentials";
    }
  } catch (error) {
    console.error("Login failed", error);
    errorMsg.textContent = "Something went wrong. Try again.";
  }
});