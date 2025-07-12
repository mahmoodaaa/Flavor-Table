// public/register.js
document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();

    if (response.ok) {
      alert("Registration successful!");
      console.log("Registered:", data);
      // Optionally redirect to login
      window.location.href = "/login.html";
    } else {
      alert("Error: " + (data || "Unknown error"));
    }
  } catch (err) {
    console.error("Registration error:", err);
    alert("Something went wrong. Try again.");
  }
});