// Mock database for demonstration purposes
// In production, use the real PostgreSQL database

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Check if we should use mock data
const useMockData = process.env.USE_MOCK_DATA === 'true' || !process.env.DATABASE_URL;

// Mock data
let mockUsers = [
    {
        id: 1,
        name: 'John Manager',
        email: 'john@example.com',
        password: '$2a$10$r9Xy5Jf6h7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3a4b5c6d7e8f9g0h1i', // password: password123
        role: 'manager',
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        id: 2,
        name: 'Jane Tenant',
        email: 'jane@example.com',
        password: '$2a$10$r9Xy5Jf6h7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3a4b5c6d7e8f9g0h1i', // password: password123
        role: 'tenant',
        created_at: new Date(),
        updated_at: new Date()
    }
];

let mockProperties = [
    {
        id: 1,
        manager_id: 1,
        name: 'Modern Apartment',
        address: '123 Main St, City Center',
        type: 'rental',
        monthly_rent: 1200,
        daily_rate: null,
        description: 'A modern apartment in the city center with all amenities',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        id: 2,
        manager_id: 1,
        name: 'Cozy Studio',
        address: '456 Oak Ave, Downtown',
        type: 'airbnb',
        monthly_rent: null,
        daily_rate: 80,
        description: 'A cozy studio perfect for short stays',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        id: 3,
        manager_id: 1,
        name: 'Luxury Villa',
        address: '789 Pine Rd, Suburbs',
        type: 'airbnb',
        monthly_rent: null,
        daily_rate: 250,
        description: 'A luxurious villa with a private pool',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        id: 4,
        manager_id: 1,
        name: 'Sunset Beach House',
        address: '321 Beach Blvd, Coastal Area',
        type: 'airbnb',
        monthly_rent: null,
        daily_rate: 180,
        description: 'Beautiful beach house with ocean views',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        id: 5,
        manager_id: 1,
        name: 'Downtown Loft',
        address: '555 Commerce St, Financial District',
        type: 'rental',
        monthly_rent: 2500,
        daily_rate: null,
        description: 'Premium loft in the heart of downtown',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        id: 6,
        manager_id: 1,
        name: 'Mountain Retreat',
        address: '888 Highland Ave, Mountain View',
        type: 'airbnb',
        monthly_rent: null,
        daily_rate: 150,
        description: 'Serene mountain cabin with hiking trails',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
    }
];

let mockTenants = [
    {
        id: 1,
        user_id: 2,
        property_id: 1,
        move_in_date: new Date('2024-01-01'),
        move_out_date: null,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
    }
];

let mockBills = [
    {
        id: 1,
        tenant_id: 1,
        property_id: 1,
        amount: 1200,
        due_date: new Date('2024-12-01'),
        paid_date: null,
        status: 'pending',
        type: 'rent',
        description: 'November Rent',
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        id: 2,
        tenant_id: 1,
        property_id: 1,
        amount: 150,
        due_date: new Date('2024-12-15'),
        paid_date: null,
        status: 'pending',
        type: 'electricity',
        description: 'Electricity Bill',
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        id: 3,
        tenant_id: 1,
        property_id: 1,
        amount: 80,
        due_date: new Date('2024-12-20'),
        paid_date: new Date('2024-12-18'),
        status: 'paid',
        type: 'water',
        description: 'Water Bill',
        created_at: new Date(),
        updated_at: new Date()
    }
];

let mockStays = [
    {
        id: 1,
        tenant_id: 1,
        property_id: 2,
        check_in_date: new Date('2024-12-25'),
        check_out_date: new Date('2024-12-30'),
        total_amount: 400,
        status: 'confirmed',
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        id: 2,
        tenant_id: 1,
        property_id: 3,
        check_in_date: new Date('2025-01-15'),
        check_out_date: new Date('2025-01-20'),
        total_amount: 1250,
        status: 'confirmed',
        created_at: new Date(),
        updated_at: new Date()
    }
];

// Mock pool with methods that mimic real PostgreSQL pool
const mockPool = {
    query: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            // Simulate network delay
            setTimeout(() => {
                try {
                    let result = {};
                    
                    // Handle different query types
                    if (sql.startsWith('SELECT')) {
                        if (sql.includes('users')) {
                            if (sql.includes('email')) {
                                result.rows = mockUsers.filter(user => user.email === params[0]);
                            } else if (sql.includes('id')) {
                                result.rows = mockUsers.filter(user => user.id === params[0]);
                            } else {
                                result.rows = mockUsers;
                            }
                        } else if (sql.includes('properties')) {
                            if (sql.includes('manager_id')) {
                                result.rows = mockProperties.filter(p => p.manager_id === params[0]);
                            } else if (sql.includes('id')) {
                                result.rows = mockProperties.filter(p => p.id === params[0]);
                            } else {
                                result.rows = mockProperties;
                            }
                        } else if (sql.includes('tenants')) {
                            if (sql.includes('user_id')) {
                                result.rows = mockTenants.filter(t => t.user_id === params[0]);
                            } else if (sql.includes('property_id')) {
                                result.rows = mockTenants.filter(t => t.property_id === params[0]);
                            } else if (sql.includes('id')) {
                                result.rows = mockTenants.filter(t => t.id === params[0]);
                            } else {
                                result.rows = mockTenants;
                            }
                        } else if (sql.includes('bills')) {
                            if (sql.includes('tenant_id')) {
                                result.rows = mockBills.filter(b => b.tenant_id === params[0]);
                            } else if (sql.includes('id')) {
                                result.rows = mockBills.filter(b => b.id === params[0]);
                            } else {
                                result.rows = mockBills;
                            }
                        } else if (sql.includes('stays')) {
                            if (sql.includes('tenant_id')) {
                                result.rows = mockStays.filter(s => s.tenant_id === params[0]);
                            } else if (sql.includes('id')) {
                                result.rows = mockStays.filter(s => s.id === params[0]);
                            } else {
                                result.rows = mockStays;
                            }
                        }
                    } else if (sql.startsWith('INSERT')) {
                        let newItem;
                        if (sql.includes('users')) {
                            newItem = {
                                id: mockUsers.length + 1,
                                name: params[0],
                                email: params[1],
                                password: params[2],
                                role: params[3],
                                created_at: new Date(),
                                updated_at: new Date()
                            };
                            mockUsers.push(newItem);
                        } else if (sql.includes('properties')) {
                            newItem = {
                                id: mockProperties.length + 1,
                                manager_id: params[0],
                                name: params[1],
                                address: params[2],
                                type: params[3],
                                monthly_rent: params[4],
                                daily_rate: params[5],
                                description: params[6],
                                status: 'active',
                                created_at: new Date(),
                                updated_at: new Date()
                            };
                            mockProperties.push(newItem);
                        } else if (sql.includes('tenants')) {
                            newItem = {
                                id: mockTenants.length + 1,
                                user_id: params[0],
                                property_id: params[1],
                                move_in_date: params[2],
                                move_out_date: null,
                                status: 'active',
                                created_at: new Date(),
                                updated_at: new Date()
                            };
                            mockTenants.push(newItem);
                        } else if (sql.includes('bills')) {
                            newItem = {
                                id: mockBills.length + 1,
                                tenant_id: params[0],
                                property_id: params[1],
                                amount: params[2],
                                due_date: params[3],
                                type: params[4],
                                description: params[5],
                                paid_date: null,
                                status: 'pending',
                                created_at: new Date(),
                                updated_at: new Date()
                            };
                            mockBills.push(newItem);
                        } else if (sql.includes('stays')) {
                            newItem = {
                                id: mockStays.length + 1,
                                tenant_id: params[0],
                                property_id: params[1],
                                check_in_date: params[2],
                                check_out_date: params[3],
                                total_amount: params[4],
                                status: 'confirmed',
                                created_at: new Date(),
                                updated_at: new Date()
                            };
                            mockStays.push(newItem);
                        }
                        result.rows = [newItem];
                    } else if (sql.startsWith('UPDATE')) {
                        if (sql.includes('properties')) {
                            const propertyId = params[params.length - 1];
                            const property = mockProperties.find(p => p.id === parseInt(propertyId));
                            if (property) {
                                property.name = params[0];
                                property.address = params[1];
                                property.type = params[2];
                                property.monthly_rent = params[3];
                                property.daily_rate = params[4];
                                property.description = params[5];
                                property.status = params[6];
                                property.updated_at = new Date();
                                result.rows = [property];
                            }
                        } else if (sql.includes('bills')) {
                            const billId = params[params.length - 1];
                            const status = params[0];
                            const paidDate = status === 'paid' ? new Date() : null;
                            const bill = mockBills.find(b => b.id === billId);
                            if (bill) {
                                bill.status = status;
                                bill.paid_date = paidDate;
                                bill.updated_at = new Date();
                                result.rows = [bill];
                            }
                        }
                    } else if (sql.startsWith('DELETE')) {
                        if (sql.includes('properties')) {
                            const propertyId = params[0];
                            const deletedProperty = mockProperties.find(p => p.id === propertyId);
                            if (deletedProperty) {
                                mockProperties = mockProperties.filter(p => p.id !== propertyId);
                                result.rows = [deletedProperty];
                            }
                        } else if (sql.includes('tenants')) {
                            const tenantId = params[0];
                            const deletedTenant = mockTenants.find(t => t.id === tenantId);
                            if (deletedTenant) {
                                mockTenants = mockTenants.filter(t => t.id !== tenantId);
                                result.rows = [deletedTenant];
                            }
                        } else if (sql.includes('bills')) {
                            const billId = params[0];
                            const deletedBill = mockBills.find(b => b.id === billId);
                            if (deletedBill) {
                                mockBills = mockBills.filter(b => b.id !== billId);
                                result.rows = [deletedBill];
                            }
                        } else if (sql.includes('stays')) {
                            const stayId = params[0];
                            const deletedStay = mockStays.find(s => s.id === stayId);
                            if (deletedStay) {
                                mockStays = mockStays.filter(s => s.id !== stayId);
                                result.rows = [deletedStay];
                            }
                        }
                    }
                    
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            }, 100); // Simulate network delay
        });
    }
};

const realPool = useMockData ? null : new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const pool = useMockData ? mockPool : realPool;

const createTables = async () => {
    if (useMockData) {
        console.log('Using mock database (no tables to create)');
        return;
    }
    
    try {
        // Create users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL CHECK (role IN ('manager', 'tenant')),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Create properties table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS properties (
                id SERIAL PRIMARY KEY,
                manager_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                address TEXT NOT NULL,
                type VARCHAR(50) NOT NULL CHECK (type IN ('rental', 'airbnb')),
                monthly_rent DECIMAL(10,2),
                daily_rate DECIMAL(10,2),
                description TEXT,
                status VARCHAR(50) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Create tenants table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tenants (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
                move_in_date DATE,
                move_out_date DATE,
                status VARCHAR(50) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Create bills table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS bills (
                id SERIAL PRIMARY KEY,
                tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
                property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
                amount DECIMAL(10,2) NOT NULL,
                due_date DATE NOT NULL,
                paid_date DATE,
                status VARCHAR(50) DEFAULT 'pending',
                type VARCHAR(50) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Create stays table for airbnb bookings
        await pool.query(`
            CREATE TABLE IF NOT EXISTS stays (
                id SERIAL PRIMARY KEY,
                tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
                property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
                check_in_date DATE NOT NULL,
                check_out_date DATE NOT NULL,
                total_amount DECIMAL(10,2) NOT NULL,
                status VARCHAR(50) DEFAULT 'confirmed',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        console.log('Database tables created successfully');
    } catch (error) {
        console.error('Error creating tables:', error);
    }
};

module.exports = { pool, createTables };
