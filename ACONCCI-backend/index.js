const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Signup
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  const existing = await db.query(
    'SELECT * FROM users WHERE email = $1', [email]
  );
  if (existing.rows.length > 0) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const password_hash = await bcrypt.hash(password, 10);

  await db.query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2)',
    [email, password_hash]
  );

  res.json({ message: 'Account created successfully' });
});

// Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const result = await db.query(
    'SELECT * FROM users WHERE email = $1', [email]
  );
  const user = result.rows[0];
  if (!user) return res.status(401).json({ error: 'User not found' });

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return res.status(401).json({ error: 'Wrong password' });

  const accessToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.REFRESH_SECRET,
    { expiresIn: '30d' }
  );

  res.json({ accessToken, refreshToken });
});

// Refresh
app.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });

  const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

  const accessToken = jwt.sign(
    { userId: decoded.userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ accessToken });
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});