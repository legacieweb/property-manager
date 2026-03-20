const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

const sendWelcomeEmail = async (email, name, role) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Welcome to Property Management System',
      html: `
        <h1>Welcome ${name}!</h1>
        <p>Thank you for joining our property management system.</p>
        <p>You have been registered as a ${role}.</p>
        <p>Login to your account to get started.</p>
      `
    });
    console.log('Welcome email sent');
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

const sendBillReminder = async (email, name, amount, dueDate) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Bill Payment Reminder',
      html: `
        <h1>Bill Payment Reminder</h1>
        <p>Dear ${name},</p>
        <p>Your bill of $${amount} is due on ${dueDate}.</p>
        <p>Please log in to your account to make the payment.</p>
      `
    });
    console.log('Bill reminder email sent');
  } catch (error) {
    console.error('Error sending bill reminder:', error);
  }
};

const sendBookingConfirmation = async (email, name, property, checkIn, checkOut) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Booking Confirmation',
      html: `
        <h1>Booking Confirmation</h1>
        <p>Dear ${name},</p>
        <p>Your booking for ${property} has been confirmed.</p>
        <p>Check-in: ${checkIn}</p>
        <p>Check-out: ${checkOut}</p>
        <p>Thank you for choosing our property management system.</p>
      `
    });
    console.log('Booking confirmation email sent');
  } catch (error) {
    console.error('Error sending booking confirmation:', error);
  }
};

module.exports = {
  sendWelcomeEmail,
  sendBillReminder,
  sendBookingConfirmation
};
