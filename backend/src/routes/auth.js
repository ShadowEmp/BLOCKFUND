const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authenticateToken = require('../middleware/auth');
const { Op } = require('sequelize');

router.post('/register', async (req, res) => {
  try {
    const { password } = req.body;
    const wallet_address = req.body.wallet_address?.toLowerCase();
    const email = req.body.email?.toLowerCase();

    if (!wallet_address || !email || !password) {
      return res.status(400).json({ error: 'Wallet address, email, and password are required' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ wallet_address }, { email }]
      }
    });
    if (existingUser?.wallet_address === wallet_address) {
      return res.status(400).json({ error: 'User with this wallet already exists' });
    }
    if (existingUser?.email === email) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      wallet_address,
      email,
      password_hash
    });

    res.status(201).json({ message: 'User registered successfully', userId: user.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    const email = req.body.email?.toLowerCase();
    const wallet_address = req.body.wallet_address?.toLowerCase();

    if (!wallet_address || !email || !password) {
      return res.status(400).json({ error: 'Wallet address, email, and password are required' });
    }
    
    // Find user
    const user = await User.findOne({ where: { email, wallet_address } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

    // Generate JWT
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'JWT secret is not configured' });
    }

    const token = jwt.sign(
      { id: user.id, wallet_address: user.wallet_address, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, wallet_address: user.wallet_address, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch profile' });
  }
});

module.exports = router;
