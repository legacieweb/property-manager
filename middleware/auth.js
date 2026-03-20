const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
require('dotenv').config();

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === 'manager') {
      req.user = {
        id: decoded.userId,
        name: 'Manager',
        email: process.env.MANAGER_EMAIL,
        role: 'manager'
      };
      next();
      return;
    }

    const user = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);

    if (user.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = {
      id: decoded.userId,
      name: user.rows[0].name,
      email: user.rows[0].email,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ message: 'Access forbidden' });
    }
    next();
  };
};

module.exports = { authenticateToken, requireRole };
