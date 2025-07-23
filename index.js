const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Postgres connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Root endpoint (optional)
app.get("/", (req, res) => {
  res.send("Express API is live 🚀");
});

// API status check
app.get("/api/status", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// Get all customers
app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM customers ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching customers:", err);
    res.status(500).send("Error fetching customers");
  }
});

// Add new customer
app.post("/api/users", async (req, res) => {
  const { name, email, address, state, zipCode } = req.body;

  if (!name || !email || !address) {
    return res.status(400).send("Name, email, and address are required");
  }

  try {
    const result = await pool.query(
      "INSERT INTO customers (name, email, address, state, zip_code) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [name, email, address, state, zipCode]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error adding customer:", err);
    res.status(500).send("Error adding customer");
  }
});

// Delete customer
app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM customers WHERE id = $1", [
      id,
    ]);
    if (result.rowCount === 0) {
      return res.status(404).send("Customer not found");
    }
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting customer:", err);
    res.status(500).send("Error deleting customer");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Get all customers
app.get("/api/services", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM services ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching services:", err);
    res.status(500).send("Error fetching services");
  }
});
