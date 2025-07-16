const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Pool } = require('pg');  // <-- This is where pg is used!

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Postgres connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }  // Required for Neon (SSL connection)
});

// Basic route
app.get('/', (req, res) => {
  res.send('Express API is live 🚀');
});

// Example API route
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});


// Example route to test DB connection
app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ db_time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});


// 🔹 NEW: Get all users
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).send('Error fetching users');
  }
});

// 🔹 NEW: Add a user
app.post('/api/users', async (req, res) => {
  const { name, email, address, serviceCode } = req.body;
  if (!name || !email || !address || !serviceCode) {
    return res.status(400).send('All fields required');
  }

  try {
    const result = await pool.query(
      'INSERT INTO users (name, email, address, service_code) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, address, serviceCode]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding user:', err);
    res.status(500).send('Error adding user');
  }
});

// 🔹 NEW: Delete user by ID
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).send('User not found');
    }
    res.status(204).send();  // No content
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).send('Error deleting user');
  }
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
