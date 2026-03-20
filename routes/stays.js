const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { sendBookingConfirmation } = require('../config/nodemailer');

const router = express.Router();

// Get all stays (admin)
router.get('/', authenticateToken, requireRole('manager'), async (req, res) => {
  try {
    const stays = await pool.query(`
      SELECT s.*, u.name as tenant_name, p.name as property_name
      FROM stays s
      JOIN tenants t ON s.tenant_id = t.id
      JOIN users u ON t.user_id = u.id
      JOIN properties p ON s.property_id = p.id
      ORDER BY check_in_date DESC
    `);
    res.json(stays.rows);
  } catch (error) {
    console.error('Stays error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get stay by id (admin)
router.get('/:id', authenticateToken, requireRole('manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const stay = await pool.query(`
      SELECT s.*, u.name as tenant_name, p.name as property_name
      FROM stays s
      JOIN tenants t ON s.tenant_id = t.id
      JOIN users u ON t.user_id = u.id
      JOIN properties p ON s.property_id = p.id
      WHERE s.id = $1
    `, [id]);

    if (stay.rows.length === 0) {
      return res.status(404).json({ message: 'Stay not found' });
    }

    res.json(stay.rows[0]);
  } catch (error) {
    console.error('Stay error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update stay status (admin)
router.put('/:id', authenticateToken, requireRole('manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedStay = await pool.query(`
      UPDATE stays SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [status, id]);

    if (updatedStay.rows.length === 0) {
      return res.status(404).json({ message: 'Stay not found' });
    }

    // Send booking confirmation email if status is confirmed
    if (status === 'confirmed') {
      const stay = await pool.query(`
        SELECT s.*, u.name, u.email, p.name as property_name
        FROM stays s
        JOIN tenants t ON s.tenant_id = t.id
        JOIN users u ON t.user_id = u.id
        JOIN properties p ON s.property_id = p.id
        WHERE s.id = $1
      `, [id]);

      if (stay.rows.length > 0) {
        sendBookingConfirmation(
          stay.rows[0].email,
          stay.rows[0].name,
          stay.rows[0].property_name,
          stay.rows[0].check_in_date,
          stay.rows[0].check_out_date
        );
      }
    }

    res.json(updatedStay.rows[0]);
  } catch (error) {
    console.error('Update stay error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create stay (airbnb booking)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { propertyId, checkin, checkout, guests, totalPrice } = req.body;

    // Get property information
    const property = await pool.query(
      'SELECT * FROM properties WHERE id = $1',
      [propertyId]
    );

    if (property.rows.length === 0) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if tenant exists for this user
    // We search by user_id. A user might be a tenant in multiple properties.
    // For simplicity, we just need a tenant_id to associate with the stay.
    let tenant = await pool.query(
      'SELECT * FROM tenants WHERE user_id = $1',
      [req.user.id]
    );

    if (tenant.rows.length === 0) {
      // Create a tenant record if it doesn't exist
      // Here we associate them with the property they are booking
      tenant = await pool.query(`
        INSERT INTO tenants (user_id, property_id, status) 
        VALUES ($1, $2, 'active') 
        RETURNING *
      `, [req.user.id, propertyId]);
    }

    // Create stay
    const newStay = await pool.query(`
      INSERT INTO stays (tenant_id, property_id, check_in_date, check_out_date, total_amount, status) 
      VALUES ($1, $2, $3, $4, $5, 'confirmed') 
      RETURNING *
    `, [tenant.rows[0].id, propertyId, checkin, checkout, totalPrice]);

    res.status(201).json({
      success: true,
      stay: newStay.rows[0]
    });
  } catch (error) {
    console.error('Create stay error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
