// Manager Dashboard JavaScript
const API_URL = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';
let currentUser = null;
let properties = [];
let tenants = [];
let bills = [];
let stays = [];
let dashboardData = null;

// DOM Elements
const sidebar = document.querySelector('.sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const mainContent = document.querySelector('.main-content');
const navItems = document.querySelectorAll('.nav-item');
const sections = {
    dashboard: document.getElementById('dashboard'),
    properties: document.getElementById('properties'),
    tenants: document.getElementById('tenants'),
    bills: document.getElementById('bills'),
    stays: document.getElementById('stays'),
    reports: document.getElementById('reports'),
    settings: document.getElementById('settings')
};

// Profile elements
const userName = document.getElementById('userName');
const userRole = document.getElementById('userRole');
const welcomeName = document.getElementById('welcomeName');

// Stats elements
const totalPropertiesEl = document.getElementById('totalProperties');
const totalTenantsEl = document.getElementById('totalTenants');
const pendingBillsEl = document.getElementById('pendingBills');
const totalRevenueEl = document.getElementById('totalRevenue');

// List elements
const activityList = document.getElementById('activityList');
const propertiesList = document.getElementById('propertiesList');
const tenantsList = document.getElementById('tenantsList');
const billsList = document.getElementById('billsList');
const staysList = document.getElementById('staysList');

// Modal elements
const propertyModal = document.getElementById('propertyModal');
const tenantModal = document.getElementById('tenantModal');
const billModal = document.getElementById('billModal');

// Form elements
const propertyForm = document.getElementById('propertyForm');
const tenantForm = document.getElementById('tenantForm');
const billForm = document.getElementById('billForm');

// Form fields
const propertyTypeSelect = document.getElementById('propertyType');
const priceLabel = document.getElementById('priceLabel');
const propertyPrice = document.getElementById('propertyPrice');
const tenantPropertySelect = document.getElementById('tenantProperty');
const billTenantSelect = document.getElementById('billTenant');
const billPropertySelect = document.getElementById('billProperty');

// Button elements
const addPropertyBtn = document.getElementById('addPropertyBtn');
const cancelPropertyBtn = document.getElementById('cancelPropertyBtn');
const closePropertyModal = document.getElementById('closePropertyModal');
const addTenantBtn = document.getElementById('addTenantBtn');
const cancelTenantBtn = document.getElementById('cancelTenantBtn');
const closeTenantModal = document.getElementById('closeTenantModal');
const addBillBtn = document.getElementById('addBillBtn');
const cancelBillBtn = document.getElementById('cancelBillBtn');
const closeBillModal = document.getElementById('closeBillModal');
const logoutBtn = document.getElementById('logoutBtn');
const sendRemindersBtn = document.getElementById('sendRemindersBtn');
const generateReportBtn = document.getElementById('generateReportBtn');
const profileForm = document.getElementById('profileForm');
const passwordForm = document.getElementById('passwordForm');

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
    
    // Property management
    addPropertyBtn.addEventListener('click', openAddPropertyModal);
    cancelPropertyBtn.addEventListener('click', closePropertyModalHandler);
    closePropertyModal.addEventListener('click', closePropertyModalHandler);
    propertyForm.addEventListener('submit', handleAddProperty);
    propertyTypeSelect.addEventListener('change', updatePriceLabel);
    
    // Tenant management
    addTenantBtn.addEventListener('click', openAddTenantModal);
    cancelTenantBtn.addEventListener('click', closeTenantModalHandler);
    closeTenantModal.addEventListener('click', closeTenantModalHandler);
    tenantForm.addEventListener('submit', handleAddTenant);
    
    // Bill management
    addBillBtn.addEventListener('click', openAddBillModal);
    cancelBillBtn.addEventListener('click', closeBillModalHandler);
    closeBillModal.addEventListener('click', closeBillModalHandler);
    billForm.addEventListener('submit', handleAddBill);
    
    // Other features
    logoutBtn.addEventListener('click', handleLogout);
    sendRemindersBtn.addEventListener('click', sendBillReminders);
    generateReportBtn.addEventListener('click', generateReport);
    profileForm.addEventListener('submit', handleProfileUpdate);
    passwordForm.addEventListener('submit', handlePasswordChange);
    
    // Close modals when clicking outside
    propertyModal.addEventListener('click', (e) => {
        if (e.target === propertyModal) closePropertyModalHandler();
    });
    tenantModal.addEventListener('click', (e) => {
        if (e.target === tenantModal) closeTenantModalHandler();
    });
    billModal.addEventListener('click', (e) => {
        if (e.target === billModal) closeBillModalHandler();
    });
}

// Authentication functions
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
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
        if (data && data.success && data.user) {
            if (data.user.role === 'manager') {
                currentUser = data.user;
                updateProfile();
                loadDashboardData();
            } else if (data.user.role === 'tenant') {
                // Redirect tenant to their dashboard instead of logging out
                window.location.href = 'tenant-dashboard.html';
            } else {
                console.error('Unauthorized: Unknown role', data.user.role);
                window.location.href = 'index.html';
            }
        } else {
            console.error('Unauthorized: No user data', data);
            window.location.href = 'index.html';
        }
    })
    .catch(error => {
        console.error('Auth check failed:', error);
        window.location.href = 'index.html';
    });
}

function updateProfile() {
    userName.textContent = currentUser.name;
    userRole.textContent = 'Manager';
    welcomeName.textContent = currentUser.name;
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
    if (sectionId === 'properties') loadProperties();
    if (sectionId === 'tenants') loadTenants();
    if (sectionId === 'bills') loadBills();
    if (sectionId === 'stays') loadStays();
}

// Dashboard data functions
function loadDashboardData() {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/managers/dashboard`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        dashboardData = data;
        updateDashboard();
    })
    .catch(error => {
        console.error('Error loading dashboard data:', error);
        showNotification('Error loading dashboard data', 'error');
    });
}

function updateDashboard() {
    // Update stats
    totalPropertiesEl.textContent = dashboardData.statistics.totalProperties;
    totalTenantsEl.textContent = dashboardData.statistics.totalTenants;
    pendingBillsEl.textContent = dashboardData.statistics.pendingBills;
    totalRevenueEl.textContent = `KES ${dashboardData.statistics.totalRevenue.toLocaleString()}`;
    
    // Update recent activity
    updateRecentActivity();
    
    // Load initial data for other sections
    properties = dashboardData.properties;
    tenants = dashboardData.tenants;
    bills = dashboardData.bills;
    stays = dashboardData.stays;
}

function updateRecentActivity() {
    activityList.innerHTML = '';
    
    const recentActivities = [];
    
    // Add property activities
    dashboardData.properties.slice(0, 5).forEach(property => {
        recentActivities.push({
            type: 'property',
            icon: 'fas fa-home',
            title: `New property listed: ${property.name}`,
            time: formatDate(property.created_at),
            color: 'var(--primary-color)'
        });
    });
    
    // Add tenant activities
    dashboardData.tenants.slice(0, 5).forEach(tenant => {
        recentActivities.push({
            type: 'tenant',
            icon: 'fas fa-user',
            title: `New tenant registered: ${tenant.name}`,
            time: formatDate(tenant.created_at),
            color: 'var(--secondary-color)'
        });
    });
    
    // Add bill activities
    dashboardData.bills.slice(0, 5).forEach(bill => {
        recentActivities.push({
            type: 'bill',
            icon: 'fas fa-receipt',
            title: `New bill created: ${bill.description}`,
            time: formatDate(bill.created_at),
            color: 'var(--accent-color)'
        });
    });
    
    // Sort activities by time
    recentActivities.sort((a, b) => new Date(b.time) - new Date(a.time));
    
    recentActivities.slice(0, 5).forEach(activity => {
        const activityItem = createActivityItem(activity);
        activityList.appendChild(activityItem);
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
        <div class="activity-action">
            <button class="btn btn-outline btn-sm">
                <i class="fas fa-eye"></i>
                View
            </button>
        </div>
    `;
    return item;
}

// Property management functions
function loadProperties() {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/managers/properties`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        properties = data;
        displayProperties();
        updateTenantPropertySelect();
    })
    .catch(error => {
        console.error('Error loading properties:', error);
        showNotification('Error loading properties', 'error');
    });
}

function displayProperties() {
    propertiesList.innerHTML = '';
    
    if (properties.length === 0) {
        propertiesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-building"></i>
                <h3>No properties yet</h3>
                <p>Add your first property to get started</p>
            </div>
        `;
        return;
    }
    
    properties.forEach(property => {
        const propertyItem = createPropertyItem(property);
        propertiesList.appendChild(propertyItem);
    });
}

function createPropertyItem(property) {
    const item = document.createElement('div');
    item.className = 'property-item';
    
    item.innerHTML = `
        <div class="property-header">
            <div class="property-title">${property.name}</div>
            <span class="property-type ${property.type}">${property.type}</span>
        </div>
        <div class="property-details">
            <div class="property-detail">
                <div class="detail-label">Address</div>
                <div class="detail-value">${property.address}</div>
            </div>
            <div class="property-detail">
                <div class="detail-label">${property.type === 'rental' ? 'Monthly Rent' : 'Daily Rate'}</div>
                <div class="detail-value">
                    KES ${property.type === 'rental' ? property.monthly_rent?.toLocaleString() : property.daily_rate?.toLocaleString()}
                </div>
            </div>
            <div class="property-detail">
                <div class="detail-label">Status</div>
                <div class="detail-value">${property.status}</div>
            </div>
            <div class="property-detail">
                <div class="detail-label">Added</div>
                <div class="detail-value">${formatDate(property.created_at)}</div>
            </div>
        </div>
        <div class="property-actions">
            <button class="btn btn-primary edit-property" data-id="${property.id}">
                <i class="fas fa-edit"></i>
                Edit
            </button>
            <button class="btn btn-outline view-property" data-id="${property.id}">
                <i class="fas fa-eye"></i>
                View
            </button>
            <button class="btn btn-outline delete-property" data-id="${property.id}">
                <i class="fas fa-trash"></i>
                Delete
            </button>
        </div>
    `;
    
    // Add event listeners
    const editBtn = item.querySelector('.edit-property');
    const viewBtn = item.querySelector('.view-property');
    const deleteBtn = item.querySelector('.delete-property');
    
    editBtn.addEventListener('click', () => editProperty(property));
    viewBtn.addEventListener('click', () => viewProperty(property));
    deleteBtn.addEventListener('click', () => deleteProperty(property));
    
    return item;
}

function openAddPropertyModal() {
    propertyForm.reset();
    document.getElementById('propertyId').value = '';
    document.getElementById('propertyModalTitle').textContent = 'Add Property';
    propertyModal.classList.add('active');
}

function openEditPropertyModal(property) {
    document.getElementById('propertyId').value = property.id;
    document.getElementById('propertyName').value = property.name;
    document.getElementById('propertyAddress').value = property.address;
    document.getElementById('propertyType').value = property.type;
    document.getElementById('propertyPrice').value = property.type === 'rental' ? property.monthly_rent : property.daily_rate;
    document.getElementById('propertyDescription').value = property.description || '';
    updatePriceLabel();
    document.getElementById('propertyModalTitle').textContent = 'Edit Property';
    propertyModal.classList.add('active');
}

function closePropertyModalHandler() {
    propertyModal.classList.remove('active');
}

function updatePriceLabel() {
    const propertyType = propertyTypeSelect.value;
    priceLabel.textContent = propertyType === 'rental' ? 'Monthly Rent' : 'Daily Rate';
    propertyPrice.placeholder = propertyType === 'rental' ? 'Enter monthly rent' : 'Enter daily rate';
}

function handleAddProperty(e) {
    e.preventDefault();
    
    const propertyId = document.getElementById('propertyId').value;
    const formData = new FormData(propertyForm);
    const propertyData = {
        name: formData.get('propertyName'),
        address: formData.get('propertyAddress'),
        type: formData.get('propertyType'),
        monthly_rent: formData.get('propertyType') === 'rental' ? parseFloat(formData.get('propertyPrice')) : null,
        daily_rate: formData.get('propertyType') === 'airbnb' ? parseFloat(formData.get('propertyPrice')) : null,
        description: formData.get('propertyDescription'),
        status: 'active'
    };
    
    const token = localStorage.getItem('token');
    const isEdit = propertyId && propertyId !== '';
    const url = isEdit ? `${API_URL}/api/managers/properties/${propertyId}` : `${API_URL}/api/managers/properties`;
    const method = isEdit ? 'PUT' : 'POST';
    
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(propertyData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.id) {
            if (isEdit) {
                // Update existing property in the array
                const index = properties.findIndex(p => p.id === parseInt(propertyId));
                if (index !== -1) {
                    properties[index] = { ...properties[index], ...data };
                }
                showNotification('Property updated successfully!', 'success');
            } else {
                // Add new property
                properties.push(data);
                showNotification('Property added successfully!', 'success');
            }
            displayProperties();
            updateTenantPropertySelect();
            loadDashboardData();
            closePropertyModalHandler();
        } else {
            showNotification(data.message || 'Error saving property', 'error');
        }
    })
    .catch(error => {
        console.error('Error saving property:', error);
        showNotification('Error saving property', 'error');
    });
}

function editProperty(property) {
    openEditPropertyModal(property);
}

function viewProperty(property) {
    console.log('View property:', property);
    // In a real app, this would open a property details page
}

function deleteProperty(property) {
    if (confirm(`Are you sure you want to delete ${property.name}?`)) {
        const token = localStorage.getItem('token');
        fetch(`/api/managers/properties/${property.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            properties = properties.filter(p => p.id !== property.id);
            displayProperties();
            updateTenantPropertySelect();
            loadDashboardData();
            showNotification('Property deleted successfully!', 'success');
        })
        .catch(error => {
            console.error('Error deleting property:', error);
            showNotification('Error deleting property', 'error');
        });
    }
}

// Tenant management functions
function loadTenants() {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/managers/tenants`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        tenants = data;
        displayTenants();
        updateBillTenantSelect();
    })
    .catch(error => {
        console.error('Error loading tenants:', error);
        showNotification('Error loading tenants', 'error');
    });
}

function displayTenants() {
    tenantsList.innerHTML = '';
    
    if (tenants.length === 0) {
        tenantsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No tenants yet</h3>
                <p>Add your first tenant to get started</p>
            </div>
        `;
        return;
    }
    
    tenants.forEach(tenant => {
        const tenantItem = createTenantItem(tenant);
        tenantsList.appendChild(tenantItem);
    });
}

function createTenantItem(tenant) {
    const item = document.createElement('div');
    item.className = 'tenant-item';
    
    item.innerHTML = `
        <div class="tenant-header">
            <div class="tenant-title">${tenant.name}</div>
            <span class="bill-status ${tenant.status}">${tenant.status}</span>
        </div>
        <div class="tenant-details">
            <div class="tenant-detail">
                <div class="detail-label">Email</div>
                <div class="detail-value">${tenant.email}</div>
            </div>
            <div class="tenant-detail">
                <div class="detail-label">Property</div>
                <div class="detail-value">${tenant.property_name}</div>
            </div>
            <div class="tenant-detail">
                <div class="detail-label">Move-in Date</div>
                <div class="detail-value">${formatDate(tenant.move_in_date)}</div>
            </div>
            <div class="tenant-detail">
                <div class="detail-label">Move-out Date</div>
                <div class="detail-value">${formatDate(tenant.move_out_date)}</div>
            </div>
        </div>
        <div class="tenant-actions">
            <button class="btn btn-primary edit-tenant" data-id="${tenant.id}">
                <i class="fas fa-edit"></i>
                Edit
            </button>
            <button class="btn btn-outline view-tenant" data-id="${tenant.id}">
                <i class="fas fa-eye"></i>
                View
            </button>
            <button class="btn btn-outline delete-tenant" data-id="${tenant.id}">
                <i class="fas fa-trash"></i>
                Delete
            </button>
        </div>
    `;
    
    // Add event listeners
    const editBtn = item.querySelector('.edit-tenant');
    const viewBtn = item.querySelector('.view-tenant');
    const deleteBtn = item.querySelector('.delete-tenant');
    
    editBtn.addEventListener('click', () => editTenant(tenant));
    viewBtn.addEventListener('click', () => viewTenant(tenant));
    deleteBtn.addEventListener('click', () => deleteTenant(tenant));
    
    return item;
}

function openAddTenantModal() {
    tenantForm.reset();
    updateTenantPropertySelect();
    document.getElementById('tenantModalTitle').textContent = 'Add Tenant';
    tenantModal.classList.add('active');
}

function closeTenantModalHandler() {
    tenantModal.classList.remove('active');
}

function updateTenantPropertySelect() {
    tenantPropertySelect.innerHTML = '<option value="">Select property</option>';
    
    properties.forEach(property => {
        const option = document.createElement('option');
        option.value = property.id;
        option.textContent = property.name;
        tenantPropertySelect.appendChild(option);
    });
}

function handleAddTenant(e) {
    e.preventDefault();
    
    const formData = new FormData(tenantForm);
    const tenantData = {
        name: formData.get('tenantName'),
        email: formData.get('tenantEmail'),
        property_id: parseInt(formData.get('tenantProperty')),
        move_in_date: formData.get('moveInDate')
    };
    
    console.log('Adding tenant:', tenantData);
    
    // In a real app, this would make an API call to create a tenant
    // For demonstration purposes, we'll just add it to the local array
    const newTenant = {
        id: Date.now(),
        ...tenantData,
        status: 'active',
        created_at: new Date().toISOString(),
        property_name: properties.find(p => p.id === tenantData.property_id)?.name
    };
    
    tenants.push(newTenant);
    displayTenants();
    updateBillTenantSelect();
    loadDashboardData();
    closeTenantModalHandler();
    showNotification('Tenant added successfully!', 'success');
}

function editTenant(tenant) {
    console.log('Edit tenant:', tenant);
    // In a real app, this would open an edit modal
}

function viewTenant(tenant) {
    console.log('View tenant:', tenant);
    // In a real app, this would open a tenant details page
}

function deleteTenant(tenant) {
    if (confirm(`Are you sure you want to delete ${tenant.name}?`)) {
        tenants = tenants.filter(t => t.id !== tenant.id);
        displayTenants();
        updateBillTenantSelect();
        loadDashboardData();
        showNotification('Tenant deleted successfully!', 'success');
    }
}

// Bill management functions
function loadBills() {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/managers/bills`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        bills = data;
        displayBills();
    })
    .catch(error => {
        console.error('Error loading bills:', error);
        showNotification('Error loading bills', 'error');
    });
}

function displayBills() {
    billsList.innerHTML = '';
    
    if (bills.length === 0) {
        billsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <h3>No bills yet</h3>
                <p>Add your first bill to get started</p>
            </div>
        `;
        return;
    }
    
    bills.forEach(bill => {
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
                <div class="detail-label">Tenant</div>
                <div class="detail-value">${bill.tenant_name}</div>
            </div>
            <div class="bill-detail">
                <div class="detail-label">Property</div>
                <div class="detail-value">${bill.property_name}</div>
            </div>
            <div class="bill-detail">
                <div class="detail-label">Amount</div>
                <div class="detail-value">KES ${bill.amount ? Number(bill.amount).toFixed(2) : '0.00'}</div>
            </div>
            <div class="bill-detail">
                <div class="detail-label">Due Date</div>
                <div class="detail-value">${formatDate(bill.due_date)}</div>
            </div>
        </div>
        <div class="bill-actions">
            <button class="btn btn-primary edit-bill" data-id="${bill.id}">
                <i class="fas fa-edit"></i>
                Edit
            </button>
            <button class="btn btn-outline view-bill" data-id="${bill.id}">
                <i class="fas fa-eye"></i>
                View
            </button>
            <button class="btn btn-outline delete-bill" data-id="${bill.id}">
                <i class="fas fa-trash"></i>
                Delete
            </button>
        </div>
    `;
    
    // Add event listeners
    const editBtn = item.querySelector('.edit-bill');
    const viewBtn = item.querySelector('.view-bill');
    const deleteBtn = item.querySelector('.delete-bill');
    
    editBtn.addEventListener('click', () => editBill(bill));
    viewBtn.addEventListener('click', () => viewBill(bill));
    deleteBtn.addEventListener('click', () => deleteBill(bill));
    
    return item;
}

function openAddBillModal() {
    billForm.reset();
    updateBillTenantSelect();
    updateBillPropertySelect();
    document.getElementById('billModalTitle').textContent = 'Add Bill';
    billModal.classList.add('active');
}

function closeBillModalHandler() {
    billModal.classList.remove('active');
}

function updateBillTenantSelect() {
    billTenantSelect.innerHTML = '<option value="">Select tenant</option>';
    
    tenants.forEach(tenant => {
        const option = document.createElement('option');
        option.value = tenant.id;
        option.textContent = tenant.name;
        billTenantSelect.appendChild(option);
    });
}

function updateBillPropertySelect() {
    billPropertySelect.innerHTML = '<option value="">Select property</option>';
    
    properties.forEach(property => {
        const option = document.createElement('option');
        option.value = property.id;
        option.textContent = property.name;
        billPropertySelect.appendChild(option);
    });
}

function handleAddBill(e) {
    e.preventDefault();
    
    const formData = new FormData(billForm);
    const billData = {
        tenant_id: parseInt(formData.get('billTenant')),
        property_id: parseInt(formData.get('billProperty')),
        amount: parseFloat(formData.get('billAmount')),
        due_date: formData.get('billDueDate'),
        type: formData.get('billType'),
        description: formData.get('billDescription')
    };
    
    console.log('Adding bill:', billData);
    
    // In a real app, this would make an API call to create a bill
    // For demonstration purposes, we'll just add it to the local array
    const newBill = {
        id: Date.now(),
        ...billData,
        status: 'pending',
        created_at: new Date().toISOString(),
        tenant_name: tenants.find(t => t.id === billData.tenant_id)?.name,
        property_name: properties.find(p => p.id === billData.property_id)?.name
    };
    
    bills.push(newBill);
    displayBills();
    loadDashboardData();
    closeBillModalHandler();
    showNotification('Bill added successfully!', 'success');
}

function editBill(bill) {
    console.log('Edit bill:', bill);
    // In a real app, this would open an edit modal
}

function viewBill(bill) {
    console.log('View bill:', bill);
    // In a real app, this would open a bill details page
}

function deleteBill(bill) {
    if (confirm(`Are you sure you want to delete this bill?`)) {
        bills = bills.filter(b => b.id !== bill.id);
        displayBills();
        loadDashboardData();
        showNotification('Bill deleted successfully!', 'success');
    }
}

// Stays management functions
function loadStays() {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/managers/stays`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        stays = data;
        displayStays();
    })
    .catch(error => {
        console.error('Error loading stays:', error);
        showNotification('Error loading stays', 'error');
    });
}

function displayStays() {
    staysList.innerHTML = '';
    
    if (stays.length === 0) {
        staysList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-alt"></i>
                <h3>No bookings yet</h3>
                <p>Your properties haven't been booked yet</p>
            </div>
        `;
        return;
    }
    
    stays.forEach(stay => {
        const stayItem = createStayItem(stay);
        staysList.appendChild(stayItem);
    });
}

function createStayItem(stay) {
    const item = document.createElement('div');
    item.className = 'stay-item';
    
    item.innerHTML = `
        <div class="stay-header">
            <div class="stay-title">${stay.property_name}</div>
            <span class="bill-status ${stay.status}">${stay.status}</span>
        </div>
        <div class="stay-details">
            <div class="stay-detail">
                <div class="detail-label">Tenant</div>
                <div class="detail-value">${stay.tenant_name}</div>
            </div>
            <div class="stay-detail">
                <div class="detail-label">Check-in</div>
                <div class="detail-value">${formatDate(stay.check_in_date)}</div>
            </div>
            <div class="stay-detail">
                <div class="detail-label">Check-out</div>
                <div class="detail-value">${formatDate(stay.check_out_date)}</div>
            </div>
            <div class="stay-detail">
                <div class="detail-label">Total Amount</div>
                <div class="detail-value">KES ${stay.total_amount ? Number(stay.total_amount).toFixed(2) : '0.00'}</div>
            </div>
        </div>
        <div class="stay-actions">
            <button class="btn btn-primary edit-stay" data-id="${stay.id}">
                <i class="fas fa-edit"></i>
                Edit
            </button>
            <button class="btn btn-outline view-stay" data-id="${stay.id}">
                <i class="fas fa-eye"></i>
                View
            </button>
            <button class="btn btn-outline delete-stay" data-id="${stay.id}">
                <i class="fas fa-trash"></i>
                Cancel
            </button>
        </div>
    `;
    
    // Add event listeners
    const editBtn = item.querySelector('.edit-stay');
    const viewBtn = item.querySelector('.view-stay');
    const deleteBtn = item.querySelector('.delete-stay');
    
    editBtn.addEventListener('click', () => editStay(stay));
    viewBtn.addEventListener('click', () => viewStay(stay));
    deleteBtn.addEventListener('click', () => deleteStay(stay));
    
    return item;
}

function editStay(stay) {
    console.log('Edit stay:', stay);
    // In a real app, this would open an edit modal
}

function viewStay(stay) {
    console.log('View stay:', stay);
    // In a real app, this would open a stay details page
}

function deleteStay(stay) {
    if (confirm(`Are you sure you want to cancel this booking?`)) {
        stays = stays.filter(s => s.id !== stay.id);
        displayStays();
        loadDashboardData();
        showNotification('Booking canceled successfully!', 'success');
    }
}

// Notification functions
function sendBillReminders() {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/bills/reminders`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ daysBeforeDue: 3 })
    })
    .then(response => response.json())
    .then(data => {
        showNotification(data.message, 'success');
    })
    .catch(error => {
        console.error('Error sending reminders:', error);
        showNotification('Error sending reminders', 'error');
    });
}

// Report functions
function generateReport() {
    showNotification('Generating report...', 'info');
    
    // In a real app, this would generate and download a report
    setTimeout(() => {
        showNotification('Report generated successfully!', 'success');
    }, 1500);
}

// Settings functions
function handleProfileUpdate(e) {
    e.preventDefault();
    
    const formData = new FormData(profileForm);
    const profileData = {
        name: formData.get('settingsName'),
        email: formData.get('settingsEmail'),
        phone: formData.get('settingsPhone')
    };
    
    console.log('Updating profile:', profileData);
    
    // In a real app, this would make an API call to update profile
    currentUser.name = profileData.name;
    updateProfile();
    
    showNotification('Profile updated successfully!', 'success');
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
