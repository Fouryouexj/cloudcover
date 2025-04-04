
class AdminPanel {
    constructor() {
        this.currentSection = 'dashboard';
        this.storageManager = storageManager;
        this.initializeEventListeners();
        this.loadDashboard();
        this.initializeSidebar(); 
        this.notifications = [];
        this.initializeNotifications();
    }

    initializeNotifications() {
        // Load existing notifications
        this.notifications = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
        this.updateNotificationBadge();
        this.setupNotificationListener();
    }

    setupNotificationListener() {
        window.addEventListener('storage', (e) => {
            if (e.key === 'insurance_submissions') {
                const oldSubmissions = JSON.parse(e.oldValue || '[]');
                const newSubmissions = JSON.parse(e.newValue || '[]');
                
                if (newSubmissions.length > oldSubmissions.length) {
                    const newSubmission = newSubmissions[newSubmissions.length - 1];
                    this.createNotification(newSubmission);
                }
            }
        });
    }

    createNotification(submission) {
        const notification = {
            id: Date.now(),
            type: submission.type,
            message: `New ${submission.type} insurance application from ${submission.customerName}`,
            timestamp: new Date().toISOString(),
            read: false,
            submissionId: submission.id
        };

        this.notifications.unshift(notification);
        localStorage.setItem('admin_notifications', JSON.stringify(this.notifications));
        this.updateNotificationBadge();
        this.showNotificationToast(notification);
    }

    updateNotificationBadge() {
        const unreadCount = this.notifications.filter(n => !n.read).length;
        const badge = document.querySelector('.notifications .badge');
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount ? 'block' : 'none';
        }
    }

    showNotificationToast(notification) {
        const toast = document.createElement('div');
        toast.className = 'notification-toast';
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-bell"></i>
                <div class="toast-message">
                    <p>${notification.message}</p>
                    <small>${new Date(notification.timestamp).toLocaleString()}</small>
                </div>
            </div>
            <button class="toast-close">×</button>
        `;

        document.body.appendChild(toast);

        // Auto remove toast after 5 seconds
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 5000);

        // Close button functionality
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });
    }


    initializeEventListeners() {
        // Navigation handling
        document.querySelectorAll('.nav-links a').forEach((link) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.getAttribute('href').replace('#', '');
                this.switchSection(section);
            });
        });

        // Real-time updates
        window.addEventListener('storage', (e) => {
            if (e.key === 'insurance_submissions') {
                this.updateDashboardStats();
                if (this.currentSection === 'motor') {
                    this.loadInsuranceSection('motor');
                }
            }
        });
    }

    switchSection(section) {
        this.currentSection = section;
        document.querySelectorAll('.nav-links li').forEach((li) => {
            li.classList.remove('active');
        });
        document.querySelector(`a[href="#${section}"]`).parentElement.classList.add('active');

        if (section === 'dashboard') {
            this.loadDashboard();
        } else {
            this.loadInsuranceSection(section);
        }
    }

    loadInsuranceSection(type) {
        const submissions = this.storageManager.getSubmissionsByType(type);
        const mainContent = document.querySelector('.main-content');


mainContent.innerHTML = `
    <section class="insurance-section">
        <h2>${type.charAt(0).toUpperCase() + type.slice(1)} Insurance Submissions</h2>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Customer Name</th>
                        <th>Phone Number</th>  <!-- Added Phone Number column -->
                        <th>Package Type</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${submissions.map(sub => `
                        <tr>
                            <td>${sub.id}</td>
                            <td>${sub.customerName}</td>
                            <td>
                                <a href="tel:${sub.contact?.phone}" class="phone-link">
                                    <i class="fas fa-phone"></i>
                                    ${sub.contact?.phone || 'N/A'}
                                </a>
                            </td>
                            <td>${sub.packageType}</td>
                            <td>${new Date(sub.timestamp).toLocaleDateString()}</td>
                            <td><span class="status ${sub.status}">${sub.status}</span></td>
                            <td>
                                <button onclick="admin.viewSubmission('${sub.id}')" class="action-btn view">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button onclick="admin.updateStatus('${sub.id}')" class="action-btn edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="admin.deleteSubmission('${sub.id}')" class="action-btn delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </section>
`;
  
  
        // Reinitialize search functionality
        const searchInput = document.querySelector('.search-bar input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }
    }

    initializeEventListeners() {
        // Navigation handling
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.getAttribute('href').replace('#', '');
                this.switchSection(section);
            });
        });

        // Search functionality
        const searchInput = document.querySelector('.search-bar input');
        searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Real-time updates
        window.addEventListener('storage', (e) => {
            if (e.key === 'insurance_submissions') {
                this.updateDashboardStats();
                if (this.currentSection !== 'dashboard') {
                    this.loadInsuranceSection(this.currentSection);
                }
            }
        });
    }

    switchSection(section) {
        this.currentSection = section;
        document.querySelectorAll('.nav-links li').forEach(li => {
            li.classList.remove('active');
        });
        document.querySelector(`a[href="#${section}"]`).parentElement.classList.add('active');
        if (section === 'dashboard') {
            this.loadDashboard(); 
        } else {
            this.loadInsuranceSection(section);
        }

        
    }
    async loadDashboard() {
        const mainContent = document.querySelector('.main-content');
    
        // Reset the main content area
        mainContent.innerHTML = `
            <header class="admin-header">
                <div class="search-bar">
                    <input type="search" placeholder="Search...">
                    <i class="fas fa-search"></i>
                </div>
                <div class="admin-profile">
                    <span class="notifications">
                        <i class="fas fa-bell"></i>
                        <span class="badge">3</span>
                    </span>
                    <img src="img/admin-avatar.jpg" alt="Admin" class="admin-avatar">
                    <span class="admin-name">John Doe</span>
                </div>
            </header>
    
            <section class="dashboard-stats">
                <div class="stat-card">
                    <div class="stat-icon motor">
                        <i class="fas fa-car"></i>
                    </div>
                    <div class="stat-info">
                        <h3>Motor Insurance</h3>
                        <p>${this.getStats().motor} New Quotes</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon travel">
                        <i class="fas fa-plane"></i>
                    </div>
                    <div class="stat-info">
                        <h3>Travel Insurance</h3>
                        <p>${this.getStats().travel} New Quotes</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon medical">
                        <i class="fas fa-heartbeat"></i>
                    </div>
                    <div class="stat-info">
                        <h3>Medical Insurance</h3>
                        <p>${this.getStats().medical} New Quotes</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon life">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <div class="stat-info">
                        <h3>Life Insurance</h3>
                        <p>${this.getStats().life} New Quotes</p>
                    </div>
                </div>
            </section>
    
            <section class="recent-quotes">
                <h2>Recent Insurance Quotes</h2>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Quote ID</th>
                                <th>Customer Name</th>
                                <th>Phone Number</th>
                                <th>Insurance Type</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="quotes-table-body">
                            <!-- Will be populated by JavaScript -->
                        </tbody>
                    </table>
                </div>
            </section>
    
            <section class="recent-payments">
                <h2>Recent Payments</h2>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Transaction ID</th>
                                <th>Customer</th>
                                <th>Phone Number</th>
                                <th>Amount</th>
                                <th>Insurance Type</th>
                                <th>Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="payments-table-body">
                            <!-- Will be populated by JavaScript -->
                        </tbody>
                    </table>
                </div>
            </section>
        `;
    
        
        this.updateDashboardStats();
        this.loadRecentQuotes();
        this.loadRecentPayments();
    }
    

    getStats() {
        const submissions = this.storageManager.getSubmissions();
        return {
            motor: submissions.filter(s => s.type === 'motor').length,
            travel: submissions.filter(s => s.type === 'travel').length,
            medical: submissions.filter(s => s.type === 'medical').length,
            life: submissions.filter(s => s.type === 'life').length
        };
    }

    updateDashboardStats(stats = this.getStats()) {
        document.querySelectorAll('.stat-card').forEach(card => {
            const type = card.querySelector('.stat-info h3').textContent.toLowerCase().split(' ')[0];
            card.querySelector('.stat-info p').textContent = `${stats[type] || 0} New Quotes`;
        });
    }

    loadRecentQuotes() {
        const submissions = this.storageManager.getSubmissions()
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);

        const tbody = document.getElementById('quotes-table-body');
        
tbody.innerHTML = submissions.map(sub => `
    <tr>
        <td>${sub.id}</td>
        <td>${sub.customerName}</td>
        <td>
            <a href="tel:${sub.contact?.phone}" class="phone-link">
                <i class="fas fa-phone"></i>
                ${sub.contact?.phone || 'N/A'}
            </a>
        </td>
        <td>${sub.type.charAt(0).toUpperCase() + sub.type.slice(1)} Insurance</td>
        <td>${new Date(sub.timestamp).toLocaleDateString()}</td>
        <td><span class="status ${sub.status}">${sub.status}</span></td>
        <td>
            <button onclick="admin.viewSubmission('${sub.id}')" class="action-btn view">
                <i class="fas fa-eye"></i>
            </button>
            <button onclick="admin.editSubmission('${sub.id}')" class="action-btn edit">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="admin.deleteSubmission('${sub.id}')" class="action-btn delete">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    </tr>
`).join('');
       
    }

    loadInsuranceSection(type) {
        const submissions = this.storageManager.getSubmissionsByType(type);
        const mainContent = document.querySelector('.main-content');
        
        mainContent.innerHTML = `
            <section class="insurance-section">
                <h2>${type.charAt(0).toUpperCase() + type.slice(1)} Insurance Submissions</h2>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Customer Name</th>
                                <th>Package Type</th>
                                <th>Phone Number</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${submissions.map(sub => `
                                <tr>
                                    <td>${sub.id}</td>
                                    <td>${sub.customerName}</td>
                                    <td>${sub.packageType}</td>
                                    <td>${sub.contact?.phone || 'N/A'}</td>
                                    <td>${new Date(sub.timestamp).toLocaleDateString()}</td>
                                    <td><span class="status ${sub.status}">${sub.status}</span></td>
                                    <td>
                                        <button onclick="admin.viewSubmission('${sub.id}')" class="action-btn view">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button onclick="admin.editSubmission('${sub.id}')" class="action-btn edit">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button onclick="admin.deleteSubmission('${sub.id}')" class="action-btn delete">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </section>
        `;
    }

    viewSubmission(id) {
        const submission = this.storageManager.getSubmissions().find(s => s.id === id);
        if (!submission) return;

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Submission Details</h3>
                <div class="submission-details">
                    <p><strong>ID:</strong> ${submission.id}</p>
                    <p><strong>Customer:</strong> ${submission.customerName}</p>
                    <p><strong>Type:</strong> ${submission.type}</p>
                    <p><strong>Package:</strong> ${submission.packageType}</p>
                    <p><strong>Date:</strong> ${new Date(submission.timestamp).toLocaleString()}</p>
                    <p><strong>Status:</strong> ${submission.status}</p>
                    
                    ${submission.type === 'motor' ? `
                        <h4>Vehicle Details</h4>
                        <p><strong>Make:</strong> ${submission.vehicle.make}</p>
                        <p><strong>Model:</strong> ${submission.vehicle.model}</p>
                        <p><strong>Year:</strong> ${submission.vehicle.year}</p>
                        <p><strong>Value:</strong> KES ${submission.vehicle.value}</p>
                        <p><strong>Registration:</strong> ${submission.vehicle.registration}</p>
                    ` : ''}
                    
                    <h4>Contact Information</h4>
                    <p><strong>Phone:</strong> ${submission.contact.phone}</p>
                    <p><strong>Email:</strong> ${submission.contact.email}</p>
                </div>
                <div class="modal-actions">
                    <button onclick="this.closest('.modal').remove()">Close</button>
                    <button onclick="admin.updateStatus('${submission.id}')" class="status-btn">
                        Update Status
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    async updateStatus(id) {
        const submission = this.storageManager.getSubmissions().find(s => s.id === id);
        if (!submission) return;

        const newStatus = prompt('Enter new status (pending/approved/rejected):', submission.status);
        if (!newStatus || !['pending', 'approved', 'rejected'].includes(newStatus)) return;

        const submissions = this.storageManager.getSubmissions();
        const updatedSubmissions = submissions.map(s => 
            s.id === id ? {...s, status: newStatus} : s
        );
        
        localStorage.setItem('insurance_submissions', JSON.stringify(updatedSubmissions));
        this.switchSection(this.currentSection);
        document.querySelector('.modal')?.remove();
    }

    deleteSubmission(id) {
        if (!confirm('Are you sure you want to delete this submission?')) return;

        const submissions = this.storageManager.getSubmissions()
            .filter(s => s.id !== id);
        
        localStorage.setItem('insurance_submissions', JSON.stringify(submissions));
        this.switchSection(this.currentSection);
    }

    handleSearch(query) {
        const submissions = this.storageManager.getSubmissions();
        const filtered = submissions.filter(sub => 
            sub.customerName.toLowerCase().includes(query.toLowerCase()) ||
            sub.id.toLowerCase().includes(query.toLowerCase())
        );

        if (this.currentSection === 'dashboard') {
            this.loadRecentQuotes(filtered);
        } else {
            this.loadInsuranceSection(this.currentSection, filtered);
        }
    }

    getStats() {
        const submissions = this.storageManager.getSubmissions();
        return {
            motor: submissions.filter(s => s.type === 'motor').length,
            travel: submissions.filter(s => s.type === 'travel').length,
            medical: submissions.filter(s => s.type === 'medical').length,
            life: submissions.filter(s => s.type === 'life').length,
            student: submissions.filter(s => s.type === 'student').length // Add this line
        };
    }
}

// Initialize admin panel
const admin = new AdminPanel();