const API_URL = window.location.protocol === 'file:' ? 'https://property-manager-jlza.onrender.com' : '';
let currentUser = null;
let currentProperty = null;
let currentImageIndex = 0;

const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const authModal = document.getElementById('authModal');
const closeModal = document.getElementById('closeModal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const nav = document.querySelector('.nav');

// Booking Modal Elements
const bookingConfirmationModal = document.getElementById('bookingConfirmationModal');
const closeBookingModal = document.getElementById('closeBookingModal');
const bookingSummaryDetails = document.getElementById('bookingSummaryDetails');
const goToDashboardBtn = document.getElementById('goToDashboardBtn');
const closeSummaryBtn = document.getElementById('closeSummaryBtn');

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadPropertyDetails();
    checkAuth();
});

function setupEventListeners() {
    loginBtn.addEventListener('click', openLoginModal);
    registerBtn.addEventListener('click', openRegisterModal);
    closeModal.addEventListener('click', closeModalHandler);
    mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    
    // Booking modal controls
    closeBookingModal.addEventListener('click', () => bookingConfirmationModal.classList.remove('active'));
    closeSummaryBtn.addEventListener('click', () => bookingConfirmationModal.classList.remove('active'));
    goToDashboardBtn.addEventListener('click', () => {
        if (currentUser && currentUser.role === 'manager') {
            window.location.href = 'manager-dashboard.html';
        } else {
            window.location.href = 'tenant-dashboard.html';
        }
    });

    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
            closeModalHandler();
        }
    });

    document.getElementById('bookingForm').addEventListener('submit', handleBooking);
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            localStorage.setItem('token', data.token);
            // Redirect based on role
            if (data.user.role === 'manager') {
                window.location.href = 'manager-dashboard.html';
            } else {
                window.location.href = 'tenant-dashboard.html';
            }
        } else {
            alert(data.message || 'Login failed');
        }
    })
    .catch(error => console.error('Login error:', error));
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            localStorage.setItem('token', data.token);
            // Redirect based on role
            if (data.user.role === 'manager') {
                window.location.href = 'manager-dashboard.html';
            } else {
                window.location.href = 'tenant-dashboard.html';
            }
        } else {
            alert(data.message || 'Registration failed');
        }
    })
    .catch(error => console.error('Registration error:', error));
}

function toggleMobileMenu() {
    nav.classList.toggle('active');
}

function openLoginModal() {
    authModal.classList.add('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
}

function openRegisterModal() {
    authModal.classList.add('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
}

function closeModalHandler() {
    authModal.classList.remove('active');
}

function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
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
        .catch(error => console.error('Auth check failed:', error));
    }
}

function updateUIForAuthenticatedUser() {
    loginBtn.textContent = 'Dashboard';
    loginBtn.removeEventListener('click', openLoginModal);
    loginBtn.addEventListener('click', () => {
        if (currentUser.role === 'manager') {
            window.location.href = 'manager-dashboard.html';
        } else {
            window.location.href = 'tenant-dashboard.html';
        }
    });

    registerBtn.textContent = 'Logout';
    registerBtn.removeEventListener('click', openRegisterModal);
    registerBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        location.reload();
    });
}

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function loadPropertyDetails() {
    const propertyId = getQueryParam('id');
    
    if (!propertyId) {
        document.body.innerHTML = '<h2>Property not found</h2>';
        return;
    }

    fetch(`${API_URL}/api/properties/${propertyId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Property not found');
            }
            return response.json();
        })
        .then(property => {
            currentProperty = property;
            displayPropertyDetails(property);
        })
        .catch(error => {
            console.error('Error loading property:', error);
            document.querySelector('.property-details-container').innerHTML = 
                '<h2>Error loading property details. Please try again later.</h2>';
        });
}

function displayPropertyDetails(property) {
    document.getElementById('propertyName').textContent = property.name;
    document.getElementById('propertyAddress').textContent = property.address;
    document.getElementById('propertyDescription').textContent = property.description;
    document.getElementById('bedroomCount').textContent = property.bedrooms;
    document.getElementById('bathroomCount').textContent = property.bathrooms;
    document.getElementById('propertyArea').textContent = property.sqft + ' sqft';
    
    const typeBadge = document.getElementById('propertyTypeBadge');
    if (property.type) {
        typeBadge.textContent = property.type.charAt(0).toUpperCase() + property.type.slice(1);
        typeBadge.className = `property-type-badge ${property.type}`;
    } else {
        typeBadge.textContent = 'Unknown';
        typeBadge.className = 'property-type-badge';
    }

    const priceElement = document.getElementById('propertyPrice');
    if (property.type === 'rental') {
        priceElement.textContent = `KES ${property.monthly_rent?.toLocaleString() || 0}/month`;
    } else {
        priceElement.textContent = `KES ${property.daily_rate?.toLocaleString() || 0}/night`;
    }

    setupImageGallery(property.images);
    setupAmenities(property.amenities);
    setupMobileNav();
}

function setupImageGallery(images) {
    if (!images || images.length === 0) {
        images = ['https://via.placeholder.com/800x600?text=Property+Image'];
    }

    const mainImage = document.getElementById('mainImage');
    mainImage.src = images[0];

    const imageDots = document.getElementById('imageDots');
    imageDots.innerHTML = '';
    
    images.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = `image-dot ${index === 0 ? 'active' : ''}`;
        dot.onclick = () => selectImage(index, images);
        imageDots.appendChild(dot);
    });

    const thumbnails = document.getElementById('imageThumbnails');
    thumbnails.innerHTML = '';
    
    images.forEach((image, index) => {
        const thumb = document.createElement('div');
        thumb.className = `thumbnail ${index === 0 ? 'active' : ''}`;
        thumb.innerHTML = `<img src="${image}" alt="Property image ${index + 1}">`;
        thumb.onclick = () => selectImage(index, images);
        thumbnails.appendChild(thumb);
    });
}

function selectImage(index, images) {
    currentImageIndex = index;
    document.getElementById('mainImage').src = images[index];
    
    document.querySelectorAll('.image-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
    
    document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });
}

function setupAmenities(amenities) {
    const amenitiesGrid = document.getElementById('amenitiesGrid');
    amenitiesGrid.innerHTML = '';

    if (!amenities || amenities.length === 0) {
        amenitiesGrid.innerHTML = '<p>No amenities listed</p>';
        return;
    }

    const amenityIcons = {
        'WiFi': 'fa-wifi',
        'Swimming Pool': 'fa-water',
        'Air Conditioning': 'fa-wind',
        'Parking': 'fa-car',
        'Kitchen': 'fa-utensils',
        'Balcony': 'fa-window-maximize',
        'Security System': 'fa-lock',
        'Kitchenette': 'fa-utensils',
        'Workspace': 'fa-desk',
        'TV': 'fa-tv',
        'Shower': 'fa-shower',
        'Linens Provided': 'fa-bed',
        'Full Kitchen': 'fa-utensils',
        'Gym': 'fa-dumbbell',
        'Entertainment Room': 'fa-gamepad',
        'Garden': 'fa-leaf',
        'Garage': 'fa-car',
        'Beach Access': 'fa-umbrella-beach',
        'Outdoor Deck': 'fa-tree',
        'Hot Tub': 'fa-hot-tub-person',
        'BBQ Grill': 'fa-fire',
        'City Views': 'fa-building',
        'Home Office': 'fa-laptop',
        'High-end Kitchen': 'fa-utensils',
        'Concierge': 'fa-bell',
        'Hiking Trails': 'fa-person-hiking',
        'Fireplace': 'fa-fire',
        'Scenic Views': 'fa-mountain-sun',
        'Outdoor Seating': 'fa-chair'
    };

    amenities.forEach(amenity => {
        const iconClass = amenityIcons[amenity] || 'fa-check';
        const item = document.createElement('div');
        item.className = 'amenity-item';
        item.innerHTML = `
            <i class="fas ${iconClass}"></i>
            <span>${amenity}</span>
        `;
        amenitiesGrid.appendChild(item);
    });
}

function handleBooking(e) {
    e.preventDefault();

    if (!currentUser) {
        alert('Please login to book this property');
        openLoginModal();
        return;
    }

    const checkin = document.querySelector('input[name="checkin"]').value;
    const checkout = document.querySelector('input[name="checkout"]').value;
    const guests = document.querySelector('input[name="guests"]').value;
    const message = document.querySelector('textarea[name="message"]').value;

    if (!checkin || !checkout) {
        alert('Please select both check-in and check-out dates');
        return;
    }

    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);

    if (checkinDate >= checkoutDate) {
        alert('Check-out date must be after check-in date');
        return;
    }

    const nights = Math.floor((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
    let totalPrice = 0;

    if (currentProperty.type === 'rental') {
        totalPrice = currentProperty.monthly_rent * (nights / 30);
    } else {
        totalPrice = currentProperty.daily_rate * nights;
    }

    // Show booking summary in modal before saving? 
    // Actually the user said "remove the modal dialog of the booking details and make it a great popup and should be clean"
    // and "then the details should be saved on the data base and should be shown to the dashboard"
    
    saveBooking({
        propertyId: currentProperty.id,
        checkin,
        checkout,
        guests,
        message,
        totalPrice,
        nights
    });
}

function saveBooking(bookingData) {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/stays`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayBookingSummary(bookingData);
        } else {
            alert(data.message || 'Error saving booking');
        }
    })
    .catch(error => console.error('Error saving booking:', error));
}

function displayBookingSummary(data) {
    const checkin = new Date(data.checkin).toLocaleDateString();
    const checkout = new Date(data.checkout).toLocaleDateString();
    
    bookingSummaryDetails.innerHTML = `
        <div class="summary-row">
            <span class="summary-label">Property:</span>
            <span class="summary-value">${currentProperty.name}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Check-in:</span>
            <span class="summary-value">${checkin}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Check-out:</span>
            <span class="summary-value">${checkout}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Nights:</span>
            <span class="summary-value">${data.nights}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Guests:</span>
            <span class="summary-value">${data.guests}</span>
        </div>
        <div class="summary-row summary-total">
            <span class="summary-label">Total Price:</span>
            <span class="summary-value">KES ${data.totalPrice.toLocaleString()}</span>
        </div>
    `;
    
    bookingConfirmationModal.classList.add('active');
}

function setupMobileNav() {
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('active');
        });
    });
}
