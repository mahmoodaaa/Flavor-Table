// public/register.js
document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const errorMsg = document.getElementById("register-error");

  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      alert("Registration successful! Please log in.");
      window.location.href = "/login.html";
    } else {
      errorMsg.textContent = data.message || "Registration failed.";
    }
  } catch (error) {
    console.error("Registration error", error);
    errorMsg.textContent = "Something went wrong. Try again.";
  }
});