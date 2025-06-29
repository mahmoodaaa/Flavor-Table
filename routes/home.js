// routes/home.js
const express = require("express");
const path = require("path");
const router = express.Router();

// Serve index.html
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

module.exports = router;
