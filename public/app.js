// Global variables
const API_URL = window.location.protocol === 'file:' ? 'https://property-manager-jlza.onrender.com' : '';
let currentUser = null;
let properties = [];

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const getStartedBtn = document.getElementById('getStartedBtn');
const learnMoreBtn = document.getElementById('learnMoreBtn');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const authModal = document.getElementById('authModal');
const closeModal = document.getElementById('closeModal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const switchToRegister = document.getElementById('switchToRegister');
const switchToLogin = document.getElementById('switchToLogin');
const modalTitle = document.getElementById('modalTitle');
const propertiesGrid = document.getElementById('propertiesGrid');
const filterBtns = document.querySelectorAll('.filter-btn');
const contactForm = document.getElementById('contactForm');
const nav = document.querySelector('.nav');

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadProperties();
    setupEventListeners();
    checkAuth();
});

// Set up event listeners
function setupEventListeners() {
    // Navigation toggle
    mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    
    // Modal controls
    loginBtn.addEventListener('click', openLoginModal);
    registerBtn.addEventListener('click', openRegisterModal);
    getStartedBtn.addEventListener('click', openRegisterModal);
    closeModal.addEventListener('click', closeModalHandler);
    switchToRegister.addEventListener('click', switchToRegisterForm);
    switchToLogin.addEventListener('click', switchToLoginForm);
    
    // Form submissions
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    contactForm.addEventListener('submit', handleContact);
    
    // Property filtering
    filterBtns.forEach(btn => {
        btn.addEventListener('click', handlePropertyFilter);
    });
    
    // Close modal when clicking outside
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
            closeModalHandler();
        }
    });
}

// Mobile menu toggle
function toggleMobileMenu() {
    nav.classList.toggle('active');
}

// Modal functions
function openLoginModal() {
    authModal.classList.add('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    modalTitle.textContent = 'Login';
}

function openRegisterModal() {
    authModal.classList.add('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    modalTitle.textContent = 'Register';
}

function closeModalHandler() {
    authModal.classList.remove('active');
}

function switchToRegisterForm() {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    modalTitle.textContent = 'Register';
}

function switchToLoginForm() {
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    modalTitle.textContent = 'Login';
}

// Authentication functions
function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        // Verify token and get user info
        fetch(`${API_URL}/api/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                currentUser = data.user;
                updateUIForAuthenticatedUser();
            }
        })
        .catch(error => {
            console.error('Auth check failed:', error);
            localStorage.removeItem('token');
        });
    }
}

function updateUIForAuthenticatedUser() {
    loginBtn.textContent = 'Dashboard';
    loginBtn.classList.add('btn-primary');
    loginBtn.classList.remove('btn-outline');
    loginBtn.removeEventListener('click', openLoginModal);
    loginBtn.addEventListener('click', () => {
        if (currentUser.role === 'manager') {
            window.location.href = 'manager-dashboard.html';
        } else {
            window.location.href = 'tenant-dashboard.html';
        }
    });
    
    registerBtn.textContent = 'Logout';
    registerBtn.classList.remove('btn-primary');
    registerBtn.classList.add('btn-outline');
    registerBtn.removeEventListener('click', openRegisterModal);
    registerBtn.addEventListener('click', handleLogout);
}

function handleLogout() {
    localStorage.removeItem('token');
    currentUser = null;
    location.reload();
}

function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(loginForm);
    const data = {
        email: formData.get('email'),
        password: formData.get('password')
    };
    
    fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.token) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            closeModalHandler();
            updateUIForAuthenticatedUser();
            showNotification('Login successful!', 'success');
            
            // Redirect to dashboard based on role immediately
            setTimeout(() => {
                if (currentUser.role === 'manager') {
                    window.location.href = 'manager-dashboard.html';
                } else {
                    window.location.href = 'tenant-dashboard.html';
                }
            }, 500);
        } else {
            showNotification(data.message || 'Login failed', 'error');
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        showNotification('Login failed. Please try again.', 'error');
    });
}

function handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(registerForm);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: formData.get('role') || 'tenant'
    };
    
    fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.token) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            closeModalHandler();
            updateUIForAuthenticatedUser();
            showNotification('Registration successful!', 'success');
            
            setTimeout(() => {
                // Redirect to dashboard based on role
                if (currentUser.role === 'manager') {
                    window.location.href = 'manager-dashboard.html';
                } else {
                    window.location.href = 'tenant-dashboard.html';
                }
            }, 1000);
        } else {
            showNotification(data.message || 'Registration failed', 'error');
        }
    })
    .catch(error => {
        console.error('Registration error:', error);
        showNotification('Registration failed. Please try again.', 'error');
    });
}

// Property management functions
function loadProperties() {
    console.log('API_URL:', API_URL);
    console.log('Fetching properties from:', `${API_URL}/api/properties`);
    fetch(`${API_URL}/api/properties`)
        .then(response => {
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            return response.json();
        })
        .then(data => {
            console.log('Received properties data:', data);
            properties = data;
            displayProperties();
        })
        .catch(error => {
            console.error('Error loading properties:', error);
            showNotification('Error loading properties. Please try again.', 'error');
        });
}

function displayProperties(filter = 'all') {
    propertiesGrid.innerHTML = '';
    
    const filteredProperties = filter === 'all' 
        ? properties 
        : properties.filter(property => property.type === filter);
    
    if (filteredProperties.length === 0) {
        propertiesGrid.innerHTML = `
            <div class="no-properties">
                <i class="fas fa-building"></i>
                <h3>No properties found</h3>
                <p>Check back later for available properties</p>
            </div>
        `;
        return;
    }
    
    filteredProperties.forEach(property => {
        const propertyCard = createPropertyCard(property);
        propertiesGrid.appendChild(propertyCard);
    });
}

function createPropertyCard(property) {
    const card = document.createElement('div');
    card.className = 'property-card';
    
    const imageUrl = property.images && property.images[0] ? property.images[0] : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80';
    
    card.innerHTML = `
        <div class="property-image">
            <img src="${imageUrl}" alt="${property.name}" loading="lazy">
        </div>
        <div class="property-content">
            <span class="property-type">${property.type.toUpperCase()}</span>
            <h3>${property.name}</h3>
            <p class="property-address">
                <i class="fas fa-map-marker-alt"></i>
                ${property.address}
            </p>
            <div class="property-price">
                ${property.type === 'rental' 
                    ? `KES ${property.monthly_rent?.toLocaleString()}/month` 
                    : `KES ${property.daily_rate?.toLocaleString()}/night`}
            </div>
            <div class="property-features">
                <span class="property-feature">
                    <i class="fas fa-bed"></i> ${property.bedrooms || 2}
                </span>
                <span class="property-feature">
                    <i class="fas fa-bath"></i> ${property.bathrooms || 1}
                </span>
                <span class="property-feature">
                    <i class="fas fa-ruler-combined"></i> ${property.sqft || '1,200'} sqft
                </span>
            </div>
            <div class="property-actions">
                <button class="btn btn-primary view-property" data-id="${property.id}">
                    View Details
                </button>
                <button class="btn btn-outline book-property" data-id="${property.id}">
                    Book Now
                </button>
            </div>
        </div>
    `;
    
    // Add event listeners
    const viewBtn = card.querySelector('.view-property');
    const bookBtn = card.querySelector('.book-property');
    
    viewBtn.addEventListener('click', () => viewProperty(property.id));
    bookBtn.addEventListener('click', () => bookProperty(property));
    
    return card;
}

function handlePropertyFilter(e) {
    filterBtns.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    const filter = e.target.dataset.filter;
    displayProperties(filter);
}

function viewProperty(propertyId) {
    window.location.href = `property-details.html?id=${propertyId}`;
}

function bookProperty(property) {
    if (!currentUser) {
        showNotification('Please login to book a property', 'info');
        openLoginModal();
        return;
    }
    
    window.location.href = `property-details.html?id=${property.id}`;
}

// Contact form
function handleContact(e) {
    e.preventDefault();
    
    const formData = new FormData(contactForm);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        subject: formData.get('subject'),
        message: formData.get('message')
    };
    
    fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Message sent successfully!', 'success');
            contactForm.reset();
        } else {
            showNotification(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Contact form error:', error);
        showNotification('Error sending message. Please try again.', 'error');
    });
}

// Notifications
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

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            // Close mobile menu if open
            nav.classList.remove('active');
        }
    });
});

// Page scroll effects
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Loading animation
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});
