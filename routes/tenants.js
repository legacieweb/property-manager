const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get tenant dashboard data
router.get('/dashboard', authenticateToken, requireRole('tenant'), async (req, res) => {
  try {
    // Get tenant information
    const tenantInfo = await pool.query(
      'SELECT * FROM tenants WHERE user_id = $1',
      [req.user.id]
    );

    if (tenantInfo.rows.length === 0) {
      return res.json({
        property: null,
        bills: [],
        stays: [],
        statistics: {
          totalBills: 0,
          pendingBills: 0,
          paidBills: 0,
          totalAmount: 0
        }
      });
    }

    const tenant = tenantInfo.rows[0];

    // Get property information
    const property = await pool.query(
      'SELECT * FROM properties WHERE id = $1',
      [tenant.property_id]
    );

    // Get bills for tenant
    const bills = await pool.query(
      'SELECT * FROM bills WHERE tenant_id = $1 ORDER BY due_date DESC',
      [tenant.id]
    );

    // Get stays for tenant (airbnb)
    const stays = await pool.query(
      'SELECT * FROM stays WHERE tenant_id = $1 ORDER BY check_in_date DESC',
      [tenant.id]
    );

    // Calculate statistics
    const totalBills = bills.rows.length;
    const pendingBills = bills.rows.filter(bill => bill.status === 'pending').length;
    const paidBills = bills.rows.filter(bill => bill.status === 'paid').length;
    const totalAmount = bills.rows.reduce((sum, bill) => sum + bill.amount, 0);

    res.json({
      property: property.rows[0],
      bills: bills.rows,
      stays: stays.rows,
      statistics: {
        totalBills,
        pendingBills,
        paidBills,
        totalAmount
      }
    });
  } catch (error) {
    console.error('Tenant dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all bills for tenant
router.get('/bills', authenticateToken, requireRole('tenant'), async (req, res) => {
  try {
    const tenant = await pool.query(
      'SELECT * FROM tenants WHERE user_id = $1',
      [req.user.id]
    );

    if (tenant.rows.length === 0) {
      return res.json([]);
    }

    const bills = await pool.query(
      'SELECT * FROM bills WHERE tenant_id = $1 ORDER BY due_date DESC',
      [tenant.rows[0].id]
    );

    res.json(bills.rows);
  } catch (error) {
    console.error('Bills error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all stays for tenant (airbnb)
router.get('/stays', authenticateToken, requireRole('tenant'), async (req, res) => {
  try {
    const tenant = await pool.query(
      'SELECT * FROM tenants WHERE user_id = $1',
      [req.user.id]
    );

    if (tenant.rows.length === 0) {
      return res.json([]);
    }

    const stays = await pool.query(
      'SELECT s.*, p.name as property_name FROM stays s JOIN properties p ON s.property_id = p.id WHERE tenant_id = $1 ORDER BY check_in_date DESC',
      [tenant.rows[0].id]
    );

    res.json(stays.rows);
  } catch (error) {
    console.error('Stays error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Pay bill
router.put('/bills/:id/pay', authenticateToken, requireRole('tenant'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if bill belongs to tenant
    const tenant = await pool.query(
      'SELECT * FROM tenants WHERE user_id = $1',
      [req.user.id]
    );

    if (tenant.rows.length === 0) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const bill = await pool.query(
      'SELECT * FROM bills WHERE id = $1 AND tenant_id = $2',
      [id, tenant.rows[0].id]
    );

    if (bill.rows.length === 0) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    const updatedBill = await pool.query(`
      UPDATE bills SET status = 'paid', paid_date = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [new Date(), id]);

    res.json({
      message: 'Bill paid successfully',
      bill: updatedBill.rows[0]
    });
  } catch (error) {
    console.error('Pay bill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create stay (airbnb booking)
router.post('/stays', authenticateToken, requireRole('tenant'), async (req, res) => {
  try {
    const { property_id, check_in_date, check_out_date } = req.body;

    // Get property information
    const property = await pool.query(
      'SELECT * FROM properties WHERE id = $1',
      [property_id]
    );

    if (property.rows.length === 0 || property.rows[0].type !== 'airbnb') {
      return res.status(404).json({ message: 'Airbnb property not found' });
    }

    // Check if tenant exists
    let tenant = await pool.query(
      'SELECT * FROM tenants WHERE user_id = $1',
      [req.user.id]
    );

    if (tenant.rows.length === 0) {
      // Create tenant record
      tenant = await pool.query(`
        INSERT INTO tenants (user_id, property_id) VALUES ($1, $2) RETURNING *
      `, [req.user.id, property_id]);
    }

    // Calculate stay duration and total amount
    const checkIn = new Date(check_in_date);
    const checkOut = new Date(check_out_date);
    const days = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const totalAmount = days * property.rows[0].daily_rate;

    // Create stay
    const newStay = await pool.query(`
      INSERT INTO stays (tenant_id, property_id, check_in_date, check_out_date, total_amount) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *
    `, [tenant.rows[0].id, property_id, check_in_date, check_out_date, totalAmount]);

    res.status(201).json(newStay.rows[0]);
  } catch (error) {
    console.error('Create stay error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel stay
router.delete('/stays/:id', authenticateToken, requireRole('tenant'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if stay belongs to tenant
    const tenant = await pool.query(
      'SELECT * FROM tenants WHERE user_id = $1',
      [req.user.id]
    );

    if (tenant.rows.length === 0) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const deletedStay = await pool.query(`
      DELETE FROM stays WHERE id = $1 AND tenant_id = $2 RETURNING *
    `, [id, tenant.rows[0].id]);

    if (deletedStay.rows.length === 0) {
      return res.status(404).json({ message: 'Stay not found' });
    }

    res.json({ message: 'Stay canceled successfully' });
  } catch (error) {
    console.error('Cancel stay error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
