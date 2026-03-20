const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all properties (public)
router.get('/', async (req, res) => {
  try {
    const { type, status } = req.query;
    let query = 'SELECT * FROM properties WHERE status = $1';
    let params = ['active'];

    if (type) {
      query += ' AND type = $2';
      params.push(type);
    }

    const properties = await pool.query(query, params);
    res.json(properties.rows);
  } catch (error) {
    console.error('Properties error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get property by id (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const property = await pool.query(
      'SELECT * FROM properties WHERE id = $1 AND status = $2',
      [id, 'active']
    );

    if (property.rows.length === 0) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.json(property.rows[0]);
  } catch (error) {
    console.error('Property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
