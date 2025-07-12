const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const express = require('express');
const router = express.Router();
const pg = require('pg');
require("dotenv").config();
const routeGuard = require("../middleware/verifyToken");



const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/flavor_table',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false,
});

router.post('/register', async (req, res) => {

     const { username, password,email} = req.body;
    
    try {
       

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the user into the database
        const result = await pool.query(
            'INSERT INTO users (username, password,email) VALUES ($1, $2,$3) RETURNING id, username, email,password',
            [username, hashedPassword,email]
        );
            res.status(201).json(result.rows[0]);
    // res.json(result.rows[0]);
  } catch (error) {
    console.error("");
    console.log("errore register route " + error);

    if (error.code === "23505") {
      res.status(409).json("username or Email already exist :");
    }

    res.status(500).send("Error ", error.message);
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const userResult = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (userResult.rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });

    const user = userResult.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Get all users - protected route
router.get('/users', routeGuard, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, password FROM users');
    res.json(result.rows);
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.get("/secret", routeGuard, async (req, res) => {
  res.send("Hello, this is a protected route");
});

// Get user profile
router.get("/users/profile", async (req, res) => {
  const { username } = req.query;

  try {
    const result = await pool.query(
      "SELECT email, username FROM users WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



// Update profile
router.put("/users/profile", routeGuard, async (req, res) => {
  const { username, email } = req.body;
  try {
    const result = await pool.query(
      "UPDATE users SET username = $1, email = $2 WHERE id = $3 RETURNING username, email",
      [username, email, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



// Update user password 
router.put("/users/password", routeGuard, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const result = await pool.query("SELECT password FROM users WHERE id = $1", [req.user.id]);
    const valid = await bcrypt.compare(oldPassword, result.rows[0].password);
    if (!valid) return res.status(403).json({ error: "Old password is incorrect" });

    const hashedNew = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashedNew, req.user.id]);

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;