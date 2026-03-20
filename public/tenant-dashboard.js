// Tenant Dashboard JavaScript
const API_URL = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';
let currentUser = null;
let tenantData = null;
let selectedBill = null;

// DOM Elements
const sidebar = document.querySelector('.sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const mainContent = document.querySelector('.main-content');
const navItems = document.querySelectorAll('.nav-item');
const sections = {
    dashboard: document.getElementById('dashboard'),
    properties: document.getElementById('properties'),
    bills: document.getElementById('bills'),
    bookings: document.getElementById('bookings'),
    profile: document.getElementById('profile'),
    settings: document.getElementById('settings')
};

// Profile elements
const userName = document.getElementById('userName');
const userRole = document.getElementById('userRole');
const welcomeName = document.getElementById('welcomeName');

// Stats elements
const propertyCountEl = document.getElementById('propertyCount');
const pendingBillsEl = document.getElementById('pendingBills');
const upcomingBookingsEl = document.getElementById('upcomingBookings');
const totalDueEl = document.getElementById('totalDue');

// List elements
const recentBillsList = document.getElementById('recentBillsList');
const upcomingBookingsList = document.getElementById('upcomingBookingsList');
const propertyDetails = document.getElementById('propertyDetails');
const billsList = document.getElementById('billsList');
const bookingsList = document.getElementById('bookingsList');
const profileActivityList = document.getElementById('profileActivityList');

// Modal elements
const bookingModal = document.getElementById('bookingModal');
const paymentModal = document.getElementById('paymentModal');

// Form elements
const bookingForm = document.getElementById('bookingForm');
const paymentForm = document.getElementById('paymentForm');

// Form fields
const bookingPropertySelect = document.getElementById('bookingProperty');
const checkInDateInput = document.getElementById('checkInDate');
const checkOutDateInput = document.getElementById('checkOutDate');
const numGuestsInput = document.getElementById('numGuests');
const specialRequestsInput = document.getElementById('specialRequests');
const summaryProperty = document.getElementById('summaryProperty');
const summaryDuration = document.getElementById('summaryDuration');
const summaryPrice = document.getElementById('summaryPrice');
const summaryTotal = document.getElementById('summaryTotal');

// Button elements
const logoutBtn = document.getElementById('logoutBtn');
const bookNowBtn = document.getElementById('bookNowBtn');
const editProfileBtn = document.getElementById('editProfileBtn');
const closeBookingModal = document.getElementById('closeBookingModal');
const cancelBookingBtn = document.getElementById('cancelBookingBtn');
const closePaymentModal = document.getElementById('closePaymentModal');
const cancelPaymentBtn = document.getElementById('cancelPaymentBtn');
const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');
const accountForm = document.getElementById('accountForm');
const passwordForm = document.getElementById('passwordForm');
const billsFilter = document.getElementById('billsFilter');

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkAuth();
});

// Set up event listeners
function setupEventListeners() {
    // Sidebar toggle
    sidebarToggle.addEventListener('click', toggleSidebar);
    
    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', handleNavigation);
    });
    
    // Booking management
    bookNowBtn.addEventListener('click', openBookingModal);
    closeBookingModal.addEventListener('click', closeBookingModalHandler);
    cancelBookingBtn.addEventListener('click', closeBookingModalHandler);
    bookingForm.addEventListener('submit', handleBookingSubmit);
    bookingPropertySelect.addEventListener('change', updateBookingSummary);
    checkInDateInput.addEventListener('change', updateBookingSummary);
    checkOutDateInput.addEventListener('change', updateBookingSummary);
    numGuestsInput.addEventListener('change', updateBookingSummary);
    
    // Payment management
    closePaymentModal.addEventListener('click', closePaymentModalHandler);
    cancelPaymentBtn.addEventListener('click', closePaymentModalHandler);
    confirmPaymentBtn.addEventListener('click', handlePaymentConfirm);
    
    // Other features
    logoutBtn.addEventListener('click', handleLogout);
    editProfileBtn.addEventListener('click', handleEditProfile);
    accountForm.addEventListener('submit', handleAccountUpdate);
    passwordForm.addEventListener('submit', handlePasswordChange);
    billsFilter.addEventListener('change', handleBillsFilter);
    
    // Close modals when clicking outside
    bookingModal.addEventListener('click', (e) => {
        if (e.target === bookingModal) closeBookingModalHandler();
    });
    paymentModal.addEventListener('click', (e) => {
        if (e.target === paymentModal) closePaymentModalHandler();
    });
}

// Authentication functions
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/index.html';
        return;
    }
    
    // Verify token and get user info
    fetch(`${API_URL}/api/auth/me`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Authentication failed');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            if (data.user.role === 'tenant') {
                currentUser = data.user;
                updateProfile();
                loadTenantData();
            } else if (data.user.role === 'manager') {
                // Redirect manager to their dashboard instead of logging out
                window.location.href = 'manager-dashboard.html';
            } else {
                // Unknown role, redirect to index
                window.location.href = 'index.html';
            }
        } else {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        }
    })
    .catch(error => {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });
}

function updateProfile() {
    userName.textContent = currentUser.name;
    userRole.textContent = 'Tenant';
    welcomeName.textContent = currentUser.name;
    document.getElementById('profileName').textContent = currentUser.name;
    document.getElementById('profileEmail').textContent = currentUser.email;
}

function handleLogout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}

// Sidebar functionality
function toggleSidebar() {
    sidebar.classList.toggle('active');
    mainContent.classList.toggle('expanded');
}

// Navigation functionality
function handleNavigation(e) {
    e.preventDefault();
    
    // Remove active class from all nav items
    navItems.forEach(item => item.classList.remove('active'));
    
    // Add active class to clicked item
    e.currentTarget.classList.add('active');
    
    // Hide all sections
    Object.values(sections).forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show selected section
    const sectionId = e.currentTarget.querySelector('a').getAttribute('href').substring(1);
    sections[sectionId].classList.remove('hidden');
    
    // Close mobile sidebar
    sidebar.classList.remove('active');
    mainContent.classList.remove('expanded');
    
    // Load section data if needed
    if (sectionId === 'properties') loadPropertyDetails();
    if (sectionId === 'bills') loadBills();
    if (sectionId === 'bookings') loadBookings();
    if (sectionId === 'profile') loadProfileActivity();
}

// Tenant data functions
function loadTenantData() {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/tenants/dashboard`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        tenantData = data;
        updateDashboard();
    })
    .catch(error => {
        console.error('Error loading tenant data:', error);
        showNotification('Error loading tenant data', 'error');
    });
}

function updateDashboard() {
    // Update stats
    propertyCountEl.textContent = tenantData.property ? '1' : '0';
    pendingBillsEl.textContent = tenantData.statistics.pendingBills;
    upcomingBookingsEl.textContent = tenantData.stays.length;
    totalDueEl.textContent = `KES ${tenantData.statistics.totalAmount ? Number(tenantData.statistics.totalAmount).toLocaleString() : '0.00'}`;
    
    // Update recent bills
    updateRecentBills();
    
    // Update upcoming bookings
    updateUpcomingBookings();
}

function updateRecentBills() {
    recentBillsList.innerHTML = '';
    
    const recentBills = tenantData.bills.slice(0, 3);
    
    if (recentBills.length === 0) {
        recentBillsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <h3>No recent bills</h3>
                <p>You have no pending bills</p>
            </div>
        `;
        return;
    }
    
    recentBills.forEach(bill => {
        const billItem = createBillItem(bill);
        recentBillsList.appendChild(billItem);
    });
}

function updateUpcomingBookings() {
    upcomingBookingsList.innerHTML = '';
    
    const upcomingStays = tenantData.stays.filter(stay => 
        new Date(stay.check_in_date) > new Date()
    ).slice(0, 3);
    
    if (upcomingStays.length === 0) {
        upcomingBookingsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-alt"></i>
                <h3>No upcoming bookings</h3>
                <p>You have no upcoming stays</p>
            </div>
        `;
        return;
    }
    
    upcomingStays.forEach(stay => {
        const bookingItem = createBookingItem(stay);
        upcomingBookingsList.appendChild(bookingItem);
    });
}

// Property management functions
function loadPropertyDetails() {
    if (!tenantData.property) {
        propertyDetails.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-home"></i>
                <h3>No property assigned</h3>
                <p>You haven't been assigned to a property yet</p>
            </div>
        `;
        return;
    }
    
    propertyDetails.innerHTML = `
        <div class="property-card">
            <div class="property-header">
                <div class="property-title">${tenantData.property.name}</div>
                <span class="property-type ${tenantData.property.type}">${tenantData.property.type}</span>
            </div>
            <div class="property-info">
                <div class="info-item">
                    <div class="info-label">Address</div>
                    <div class="info-value">${tenantData.property.address}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Price</div>
                    <div class="info-value">
                        ${tenantData.property.type === 'rental' 
                            ? `KES ${tenantData.property.monthly_rent?.toLocaleString()}/month` 
                            : `KES ${tenantData.property.daily_rate?.toLocaleString()}/night`}
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-label">Description</div>
                    <div class="info-value">${tenantData.property.description}</div>
                </div>
            </div>
            <div class="property-actions">
                <button class="btn btn-primary" id="contactManagerBtn">
                    <i class="fas fa-envelope"></i>
                    Contact Manager
                </button>
            </div>
        </div>
    `;
    
    // Add event listeners
    document.getElementById('contactManagerBtn').addEventListener('click', contactManager);
}

function contactManager() {
    showNotification('Opening manager contact form...', 'info');
    // In a real app, this would open a contact form or email client
}

// Bills management functions
function loadBills() {
    displayBills(tenantData.bills);
}

function displayBills(billsToDisplay) {
    billsList.innerHTML = '';
    
    if (billsToDisplay.length === 0) {
        billsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <h3>No bills found</h3>
                <p>You have no bills matching this filter</p>
            </div>
        `;
        return;
    }
    
    billsToDisplay.forEach(bill => {
        const billItem = createBillItem(bill);
        billsList.appendChild(billItem);
    });
}

function createBillItem(bill) {
    const item = document.createElement('div');
    item.className = 'bill-item';
    
    item.innerHTML = `
        <div class="bill-header">
            <div class="bill-title">${bill.description}</div>
            <span class="bill-status ${bill.status}">${bill.status}</span>
        </div>
        <div class="bill-details">
            <div class="bill-detail">
                <div class="detail-label">Amount</div>
                <div class="detail-value">KES ${bill.amount ? Number(bill.amount).toFixed(2) : '0.00'}</div>
            </div>
            <div class="bill-detail">
                <div class="detail-label">Due Date</div>
                <div class="detail-value">${formatDate(bill.due_date)}</div>
            </div>
            <div class="bill-detail">
                <div class="detail-label">Property</div>
                <div class="detail-value">${tenantData.property?.name || 'Not assigned'}</div>
            </div>
        </div>
        <div class="bill-actions">
            <button class="btn btn-primary pay-bill" data-id="${bill.id}">
                <i class="fas fa-credit-card"></i>
                Pay Now
            </button>
            <button class="btn btn-outline view-bill" data-id="${bill.id}">
                <i class="fas fa-eye"></i>
                View
            </button>
        </div>
    `;
    
    // Add event listeners
    const payBtn = item.querySelector('.pay-bill');
    const viewBtn = item.querySelector('.view-bill');
    
    payBtn.addEventListener('click', () => openPaymentModal(bill));
    viewBtn.addEventListener('click', () => viewBill(bill));
    
    return item;
}

function handleBillsFilter(e) {
    const filter = e.target.value;
    let filteredBills = tenantData.bills;
    
    if (filter === 'pending') {
        filteredBills = tenantData.bills.filter(bill => bill.status === 'pending');
    } else if (filter === 'paid') {
        filteredBills = tenantData.bills.filter(bill => bill.status === 'paid');
    }
    
    displayBills(filteredBills);
}

// Booking management functions
function loadBookings() {
    displayBookings(tenantData.stays);
}

function displayBookings(bookingsToDisplay) {
    bookingsList.innerHTML = '';
    
    if (bookingsToDisplay.length === 0) {
        bookingsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-alt"></i>
                <h3>No bookings</h3>
                <p>You haven't made any bookings yet</p>
            </div>
        `;
        return;
    }
    
    bookingsToDisplay.forEach(stay => {
        const bookingItem = createBookingItem(stay);
        bookingsList.appendChild(bookingItem);
    });
}

function createBookingItem(stay) {
    const item = document.createElement('div');
    item.className = 'booking-item';
    
    item.innerHTML = `
        <div class="booking-header">
            <div class="booking-title">${stay.property_name}</div>
            <span class="bill-status ${stay.status}">${stay.status}</span>
        </div>
        <div class="booking-details">
            <div class="booking-detail">
                <div class="detail-label">Check-in</div>
                <div class="detail-value">${formatDate(stay.check_in_date)}</div>
            </div>
            <div class="booking-detail">
                <div class="detail-label">Check-out</div>
                <div class="detail-value">${formatDate(stay.check_out_date)}</div>
            </div>
            <div class="booking-detail">
                <div class="detail-label">Total Amount</div>
                <div class="detail-value">KES ${stay.total_amount ? Number(stay.total_amount).toFixed(2) : '0.00'}</div>
            </div>
        </div>
        <div class="booking-actions">
            <button class="btn btn-outline view-booking" data-id="${stay.id}">
                <i class="fas fa-eye"></i>
                View
            </button>
            <button class="btn btn-outline cancel-booking" data-id="${stay.id}">
                <i class="fas fa-times"></i>
                Cancel
            </button>
        </div>
    `;
    
    // Add event listeners
    const viewBtn = item.querySelector('.view-booking');
    const cancelBtn = item.querySelector('.cancel-booking');
    
    viewBtn.addEventListener('click', () => viewBooking(stay));
    cancelBtn.addEventListener('click', () => cancelBooking(stay));
    
    return item;
}

function openBookingModal() {
    bookingForm.reset();
    updateBookingSummary();
    bookingModal.classList.add('active');
}

function closeBookingModalHandler() {
    bookingModal.classList.remove('active');
}

function updateBookingSummary() {
    const propertyId = bookingPropertySelect.value;
    const checkIn = new Date(checkInDateInput.value);
    const checkOut = new Date(checkOutDateInput.value);
    const numGuests = parseInt(numGuestsInput.value);
    
    // Mock property prices in KES
    const propertyPrices = {
        '1': 5000,  // Modern Apartment
        '2': 3500,  // Cozy Studio
        '3': 15000, // Luxury Villa
        '4': 10000, // Sunset Beach House
        '5': 8000,  // Downtown Loft
        '6': 6500   // Mountain Retreat
    };
    
    if (!propertyId || isNaN(checkIn) || isNaN(checkOut)) {
        summaryProperty.textContent = 'Not selected';
        summaryDuration.textContent = '0 nights';
        summaryPrice.textContent = 'KES 0';
        summaryTotal.textContent = 'KES 0';
        return;
    }
    
    // Calculate duration
    const duration = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const pricePerNight = propertyPrices[propertyId];
    const total = duration * pricePerNight;
    
    // Update summary
    summaryProperty.textContent = bookingPropertySelect.options[bookingPropertySelect.selectedIndex].text;
    summaryDuration.textContent = `${duration} nights`;
    summaryPrice.textContent = `KES ${pricePerNight}`;
    summaryTotal.textContent = `KES ${total}`;
}

function handleBookingSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(bookingForm);
    const bookingData = {
        property_id: parseInt(formData.get('bookingProperty')),
        check_in_date: formData.get('checkInDate'),
        check_out_date: formData.get('checkOutDate'),
        num_guests: parseInt(formData.get('numGuests')),
        special_requests: formData.get('specialRequests')
    };
    
    console.log('Creating booking:', bookingData);
    
    // In a real app, this would make an API call to create a booking
    // For demonstration purposes, we'll just add it to the local array
    const newBooking = {
        id: Date.now(),
        property_name: bookingPropertySelect.options[bookingPropertySelect.selectedIndex].text,
        ...bookingData,
        status: 'confirmed',
        total_amount: parseInt(summaryTotal.textContent.replace('KES ', '')),
        created_at: new Date().toISOString()
    };
    
    tenantData.stays.push(newBooking);
    displayBookings(tenantData.stays);
    updateDashboard();
    closeBookingModalHandler();
    showNotification('Booking created successfully!', 'success');
}

function viewBooking(stay) {
    console.log('View booking:', stay);
    // In a real app, this would open a booking details page
}

function cancelBooking(stay) {
    if (confirm(`Are you sure you want to cancel this booking?`)) {
        tenantData.stays = tenantData.stays.filter(s => s.id !== stay.id);
        displayBookings(tenantData.stays);
        updateDashboard();
        showNotification('Booking canceled successfully!', 'success');
    }
}

// Payment management functions
function openPaymentModal(bill) {
    selectedBill = bill;
    document.getElementById('paymentAmount').textContent = `KES ${bill.amount ? Number(bill.amount).toFixed(2) : '0.00'}`;
    document.getElementById('paymentDueDate').textContent = formatDate(bill.due_date);
    document.getElementById('paymentProperty').textContent = tenantData.property?.name || 'Not assigned';
    paymentModal.classList.add('active');
}

function closePaymentModalHandler() {
    paymentModal.classList.remove('active');
    selectedBill = null;
}

function handlePaymentConfirm() {
    if (!selectedBill) {
        showNotification('No bill selected', 'error');
        return;
    }
    
    // In a real app, this would make an API call to process the payment
    selectedBill.status = 'paid';
    selectedBill.paid_date = new Date().toISOString();
    
    // Update dashboard stats
    tenantData.statistics.pendingBills = tenantData.bills.filter(b => b.status === 'pending').length;
    tenantData.statistics.totalAmount = tenantData.bills.filter(b => b.status === 'pending').reduce((sum, b) => sum + b.amount, 0);
    
    displayBills(tenantData.bills);
    updateDashboard();
    closePaymentModalHandler();
    showNotification('Payment processed successfully!', 'success');
}

// Profile functions
function loadProfileActivity() {
    profileActivityList.innerHTML = '';
    
    const recentActivities = [];
    
    // Add bill activities
    tenantData.bills.slice(0, 5).forEach(bill => {
        recentActivities.push({
            type: 'bill',
            icon: 'fas fa-receipt',
            title: bill.status === 'paid' 
                ? `Paid bill: ${bill.description}` 
                : `New bill: ${bill.description}`,
            time: formatDate(bill.created_at),
            color: bill.status === 'paid' ? 'var(--secondary-color)' : 'var(--accent-color)'
        });
    });
    
    // Add booking activities
    tenantData.stays.slice(0, 5).forEach(stay => {
        recentActivities.push({
            type: 'booking',
            icon: 'fas fa-calendar-check',
            title: `Booking confirmed: ${stay.property_name}`,
            time: formatDate(stay.created_at),
            color: 'var(--primary-color)'
        });
    });
    
    // Sort activities by time
    recentActivities.sort((a, b) => new Date(b.time) - new Date(a.time));
    
    recentActivities.slice(0, 5).forEach(activity => {
        const activityItem = createActivityItem(activity);
        profileActivityList.appendChild(activityItem);
    });
}

function createActivityItem(activity) {
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `
        <div class="activity-icon" style="color: ${activity.color}">
            <i class="${activity.icon}"></i>
        </div>
        <div class="activity-content">
            <div class="activity-title">${activity.title}</div>
            <div class="activity-time">${formatTimeAgo(activity.time)}</div>
        </div>
    `;
    return item;
}

function handleEditProfile() {
    showNotification('Profile edit functionality coming soon!', 'info');
}

function handleAccountUpdate(e) {
    e.preventDefault();
    
    const formData = new FormData(accountForm);
    const accountData = {
        name: formData.get('settingsName'),
        email: formData.get('settingsEmail'),
        phone: formData.get('settingsPhone')
    };
    
    console.log('Updating account:', accountData);
    
    // In a real app, this would make an API call to update account info
    currentUser.name = accountData.name;
    currentUser.email = accountData.email;
    updateProfile();
    
    showNotification('Account updated successfully!', 'success');
}

function handlePasswordChange(e) {
    e.preventDefault();
    
    const formData = new FormData(passwordForm);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');
    
    if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match!', 'error');
        return;
    }
    
    console.log('Changing password');
    
    // In a real app, this would make an API call to change password
    
    passwordForm.reset();
    showNotification('Password changed successfully!', 'success');
}

// Helper functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    
    return formatDate(dateString);
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Show animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 5000);
    
    // Close button
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    });
}

// Add notification styles dynamically
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #f8f9fa;
        border-radius: 8px;
        padding: 1rem 1.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        max-width: 400px;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        z-index: 3000;
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification-success {
        background-color: #d1e7dd;
        border: 1px solid #badbcc;
        color: #0f5132;
    }
    
    .notification-error {
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #842029;
    }
    
    .notification-info {
        background-color: #d1ecf1;
        border: 1px solid #bee5eb;
        color: #0c5460;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .notification-content i {
        font-size: 1.25rem;
    }
    
    .notification-close {
        background: none;
        border: none;
        font-size: 1.25rem;
        color: inherit;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s;
    }
    
    .notification-close:hover {
        background-color: rgba(0, 0, 0, 0.1);
    }
    
    @media (max-width: 768px) {
        .notification {
            right: 10px;
            left: 10px;
            max-width: none;
        }
    }
`;

// Add notification styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);
