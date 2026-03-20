const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get manager dashboard data
router.get('/dashboard', authenticateToken, requireRole('manager'), async (req, res) => {
  try {
    // Get all properties owned by manager
    const properties = await pool.query(
      'SELECT * FROM properties WHERE manager_id = $1',
      [req.user.id]
    );

    // Get all tenants for manager's properties
    const tenants = await pool.query(`
      SELECT t.*, u.name, u.email, p.name as property_name
      FROM tenants t
      JOIN users u ON t.user_id = u.id
      JOIN properties p ON t.property_id = p.id
      WHERE p.manager_id = $1
    `, [req.user.id]);

    // Get all bills for manager's properties
    const bills = await pool.query(`
      SELECT b.*, u.name as tenant_name, p.name as property_name
      FROM bills b
      JOIN tenants t ON b.tenant_id = t.id
      JOIN users u ON t.user_id = u.id
      JOIN properties p ON b.property_id = p.id
      WHERE p.manager_id = $1
    `, [req.user.id]);

    // Get all stays for manager's properties
    const stays = await pool.query(`
      SELECT s.*, u.name as tenant_name, p.name as property_name
      FROM stays s
      JOIN tenants t ON s.tenant_id = t.id
      JOIN users u ON t.user_id = u.id
      JOIN properties p ON s.property_id = p.id
      WHERE p.manager_id = $1
    `, [req.user.id]);

    // Get statistics
    const totalProperties = properties.rows.length;
    const totalTenants = tenants.rows.length;
    const totalBills = bills.rows.length;
    const pendingBills = bills.rows.filter(bill => bill.status === 'pending').length;
    const totalRevenue = bills.rows
      .filter(bill => bill.status === 'paid')
      .reduce((sum, bill) => sum + Number(bill.amount), 0);

    res.json({
      properties: properties.rows,
      tenants: tenants.rows,
      bills: bills.rows,
      stays: stays.rows,
      statistics: {
        totalProperties,
        totalTenants,
        totalBills,
        pendingBills,
        totalRevenue
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all properties for a manager
router.get('/properties', authenticateToken, requireRole('manager'), async (req, res) => {
  try {
    const properties = await pool.query(
      'SELECT * FROM properties WHERE manager_id = $1',
      [req.user.id]
    );
    res.json(properties.rows);
  } catch (error) {
    console.error('Properties error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create property
router.post('/properties', authenticateToken, requireRole('manager'), async (req, res) => {
  try {
    const { name, address, type, monthly_rent, daily_rate, description } = req.body;

    const newProperty = await pool.query(`
      INSERT INTO properties 
      (manager_id, name, address, type, monthly_rent, daily_rate, description) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *
    `, [req.user.id, name, address, type, monthly_rent, daily_rate, description]);

    res.status(201).json(newProperty.rows[0]);
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update property
router.put('/properties/:id', authenticateToken, requireRole('manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, type, monthly_rent, daily_rate, description, status } = req.body;

    const updatedProperty = await pool.query(`
      UPDATE properties 
      SET name = $1, address = $2, type = $3, monthly_rent = $4, daily_rate = $5, 
          description = $6, status = $7, updated_at = NOW()
      WHERE id = $8 AND manager_id = $9
      RETURNING *
    `, [name, address, type, monthly_rent, daily_rate, description, status, id, req.user.id]);

    if (updatedProperty.rows.length === 0) {
      return res.status(404).json({ message: 'Property not found or you do not have permission' });
    }

    res.json(updatedProperty.rows[0]);
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete property
router.delete('/properties/:id', authenticateToken, requireRole('manager'), async (req, res) => {
  try {
    const { id } = req.params;

    const deletedProperty = await pool.query(`
      DELETE FROM properties WHERE id = $1 AND manager_id = $2 RETURNING *
    `, [id, req.user.id]);

    if (deletedProperty.rows.length === 0) {
      return res.status(404).json({ message: 'Property not found or you do not have permission' });
    }

    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all tenants for manager's properties
router.get('/tenants', authenticateToken, requireRole('manager'), async (req, res) => {
  try {
    const tenants = await pool.query(`
      SELECT t.*, u.name, u.email, p.name as property_name
      FROM tenants t
      JOIN users u ON t.user_id = u.id
      JOIN properties p ON t.property_id = p.id
      WHERE p.manager_id = $1
    `, [req.user.id]);

    res.json(tenants.rows);
  } catch (error) {
    console.error('Tenants error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create bill
router.post('/bills', authenticateToken, requireRole('manager'), async (req, res) => {
  try {
    const { tenant_id, property_id, amount, due_date, type, description } = req.body;

    const newBill = await pool.query(`
      INSERT INTO bills 
      (tenant_id, property_id, amount, due_date, type, description) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *
    `, [tenant_id, property_id, amount, due_date, type, description]);

    res.status(201).json(newBill.rows[0]);
  } catch (error) {
    console.error('Create bill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update bill status
router.put('/bills/:id', authenticateToken, requireRole('manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedBill = await pool.query(`
      UPDATE bills SET status = $1, paid_date = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [status, status === 'paid' ? new Date() : null, id]);

    if (updatedBill.rows.length === 0) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.json(updatedBill.rows[0]);
  } catch (error) {
    console.error('Update bill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all bills for manager's properties
router.get('/bills', authenticateToken, requireRole('manager'), async (req, res) => {
  try {
    const bills = await pool.query(`
      SELECT b.*, u.name as tenant_name, p.name as property_name
      FROM bills b
      JOIN tenants t ON b.tenant_id = t.id
      JOIN users u ON t.user_id = u.id
      JOIN properties p ON b.property_id = p.id
      WHERE p.manager_id = $1
    `, [req.user.id]);

    res.json(bills.rows);
  } catch (error) {
    console.error('Bills error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all stays for manager's properties
router.get('/stays', authenticateToken, requireRole('manager'), async (req, res) => {
  try {
    const stays = await pool.query(`
      SELECT s.*, u.name as tenant_name, p.name as property_name
      FROM stays s
      JOIN tenants t ON s.tenant_id = t.id
      JOIN users u ON t.user_id = u.id
      JOIN properties p ON s.property_id = p.id
      WHERE p.manager_id = $1
    `, [req.user.id]);

    res.json(stays.rows);
  } catch (error) {
    console.error('Stays error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
