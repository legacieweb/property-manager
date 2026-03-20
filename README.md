# Property Management System

A modern property management web application with tenant and manager dashboards, built with Node.js, Express, PostgreSQL (Neon DB), and custom CSS.

## Features

### Manager Dashboard
- **Property Management**: Add, edit, delete, and view properties (rentals and Airbnbs)
- **Tenant Management**: Manage tenant information and assignments
- **Bill Management**: Create, track, and send bill reminders
- **Booking Management**: Handle Airbnb bookings and stays
- **Analytics & Reports**: View property performance, revenue, and occupancy reports
- **Notifications**: Send email reminders for bills and bookings

### Tenant Dashboard
- **Property Overview**: View assigned property details
- **Bill Payment**: View and pay bills online
- **Booking Management**: Make and manage Airbnb bookings
- **Profile Management**: Update personal information and settings
- **Notifications**: Receive email and SMS notifications

### Website Features
- Modern, responsive design with custom CSS
- Property listings with filtering options
- User authentication (signup/login)
- Contact form
- About us and services sections

## Tech Stack

### Backend
- Node.js
- Express.js
- PostgreSQL (Neon DB)
- Nodemailer (email notifications)
- bcryptjs (password hashing)
- jsonwebtoken (JWT authentication)
- cors (cross-origin resource sharing)
- dotenv (environment variables)

### Frontend
- Vanilla JavaScript (ES6+)
- Custom CSS with modern design
- Font Awesome 6.0.0 (icons)
- Responsive design for all devices

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd property-management
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   - Copy `.env.example` to `.env`
   - Fill in your database URL, JWT secret, and SMTP configuration

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Visit `http://localhost:3000`

## Database Setup

The application uses Neon DB (PostgreSQL) with the following tables:

- `users`: User information (managers and tenants)
- `properties`: Property details
- `tenants`: Tenant information and assignments
- `bills`: Bill information
- `stays`: Airbnb stay bookings

Tables are automatically created when the server starts for the first time.

## Usage

### Manager Registration
1. Visit the homepage
2. Click "Register"
3. Fill in the form and select "Manager" as the role
4. Complete the registration process

### Tenant Registration
1. Visit the homepage
2. Click "Register"
3. Fill in the form and select "Tenant" as the role
4. Complete the registration process

### Property Management
Managers can add properties from their dashboard. Properties can be of type "rental" or "airbnb" with different pricing models.

### Bill Management
Managers can create bills for tenants, and tenants can pay bills online.

### Booking Management
Tenants can book Airbnb properties directly from their dashboard.

## Email Notifications

The application uses Nodemailer to send email notifications for:
- Welcome emails
- Bill reminders
- Booking confirmations

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch for your feature
3. Make your changes
4. Write tests (if applicable)
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have questions, please open an issue on the GitHub repository.
