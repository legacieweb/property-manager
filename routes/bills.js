const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { sendBillReminder } = require('../config/nodemailer');

const router = express.Router();

// Get all bills (admin)
router.get('/', authenticateToken, requireRole('manager'), async (req, res) => {
  try {
    const bills = await pool.query(`
      SELECT b.*, u.name as tenant_name, p.name as property_name
      FROM bills b
      JOIN tenants t ON b.tenant_id = t.id
      JOIN users u ON t.user_id = u.id
      JOIN properties p ON b.property_id = p.id
      ORDER BY due_date DESC
    `);
    res.json(bills.rows);
  } catch (error) {
    console.error('Bills error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send bill reminders
router.post('/reminders', authenticateToken, requireRole('manager'), async (req, res) => {
  try {
    const { daysBeforeDue = 3 } = req.body;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysBeforeDue);

    const bills = await pool.query(`
      SELECT b.*, u.name, u.email
      FROM bills b
      JOIN tenants t ON b.tenant_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE b.status = 'pending' AND b.due_date <= $1
    `, [dueDate]);

    for (const bill of bills.rows) {
      sendBillReminder(bill.email, bill.name, bill.amount, bill.due_date);
    }

    res.json({
      message: `Reminders sent for ${bills.rows.length} bills due within ${daysBeforeDue} days`
    });
  } catch (error) {
    console.error('Reminders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
