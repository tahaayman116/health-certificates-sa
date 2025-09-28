// Admin Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.currentUser = null;
        this.certificates = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthState();
        this.loadCertificates();
    }

    setupEventListeners() {
        // Form toggle buttons
        document.getElementById('addCertificateBtn').addEventListener('click', () => {
            this.showAddForm();
        });

        document.getElementById('viewAllBtn').addEventListener('click', () => {
            this.showCertificatesList();
        });

        // Form close buttons
        document.getElementById('closeFormBtn').addEventListener('click', () => {
            this.hideAddForm();
        });

        document.getElementById('cancelFormBtn').addEventListener('click', () => {
            this.hideAddForm();
        });

        document.getElementById('closeListBtn').addEventListener('click', () => {
            this.hideCertificatesList();
        });

        // Form submission
        document.getElementById('certificateForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCertificate();
        });

        // Image upload preview
        document.getElementById('photo').addEventListener('change', (e) => {
            this.previewImage(e);
        });

        // Copy link button
        document.getElementById('copyLinkBtn').addEventListener('click', () => {
            this.copyLink();
        });

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchCertificates(e.target.value);
        });

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });
    }

    checkAuthState() {
        // Simple check - show login if no current user
        if (!this.currentUser) {
            this.showLogin();
        } else {
            this.loadCertificates();
        }
    }

    showLogin() {
        // Remove any existing login forms first
        const existingLogin = document.querySelector('.login-overlay');
        if (existingLogin) {
            existingLogin.remove();
        }
        
        // Create login form with unique class
        const loginForm = document.createElement('div');
        loginForm.className = 'login-overlay';
        loginForm.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;">
                <div style="background: white; padding: 40px; border-radius: 8px; width: 400px; max-width: 90%;">
                    <h2 style="text-align: center; margin-bottom: 30px; color: #2c3e50;">تسجيل دخول المدير</h2>
                    <form class="admin-login-form">
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600;">اسم المستخدم:</label>
                            <input type="text" class="admin-username" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px;" required>
                        </div>
                        <div style="margin-bottom: 30px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600;">كلمة المرور:</label>
                            <input type="password" class="admin-password" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px;" required>
                        </div>
                        <button type="submit" style="width: 100%; padding: 12px; background: #3498db; color: white; border: none; border-radius: 4px; font-weight: 600; cursor: pointer;">دخول</button>
                        <div class="login-error" style="color: #e74c3c; margin-top: 15px; text-align: center; display: none;"></div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(loginForm);
        
        loginForm.querySelector('.admin-login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const username = loginForm.querySelector('.admin-username').value;
            const password = loginForm.querySelector('.admin-password').value;
            
            if (username === 'admin' && password === 'taha2025') {
                // Simulate successful login
                this.currentUser = { uid: 'admin', email: 'admin@system.local' };
                document.getElementById('adminName').textContent = 'مرحباً، المدير';
                document.body.removeChild(loginForm);
                this.loadCertificates();
            } else {
                const errorDiv = loginForm.querySelector('.login-error');
                errorDiv.style.display = 'block';
                errorDiv.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة';
            }
        });
    }

    logout() {
        this.currentUser = null;
        location.reload();
    }

    showAddForm() {
        document.getElementById('addCertificateForm').classList.remove('hidden');
        document.getElementById('certificatesList').classList.add('hidden');
        this.resetForm();
    }

    hideAddForm() {
        document.getElementById('addCertificateForm').classList.add('hidden');
        this.hideMessages();
    }

    showCertificatesList() {
        document.getElementById('certificatesList').classList.remove('hidden');
        document.getElementById('addCertificateForm').classList.add('hidden');
        this.renderCertificatesTable();
    }

    hideCertificatesList() {
        document.getElementById('certificatesList').classList.add('hidden');
    }

    previewImage(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.getElementById('imagePreview');
                const placeholder = document.querySelector('.upload-placeholder');
                
                preview.src = e.target.result;
                preview.classList.remove('hidden');
                placeholder.style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    }

    async saveCertificate() {
        try {
            this.showLoading();
            
            // Get form data
            const formData = this.getFormData();
            
            // Validate required fields
            if (!this.validateForm(formData)) {
                this.hideLoading();
                return;
            }

            // Process image if provided (store as base64)
            let imageData = '';
            const photoFile = document.getElementById('photo').files[0];
            if (photoFile) {
                imageData = await this.uploadImage(photoFile);
            }

            // Generate unique ID for certificate
            const certificateId = this.generateCertificateId();
            
            // Prepare certificate data
            const certificateData = {
                ...formData,
                imageData,
                certificateId,
                createdAt: new Date().toISOString(),
                createdBy: this.currentUser.uid,
                status: this.getCertificateStatus(formData.expiryDateGregorian)
            };
            
            console.log('💾 Saving certificate data to Firebase:', certificateData);
            console.log('👔 Profession:', formData.profession);
            console.log('🏛️ Amanah:', formData.amanah);
            console.log('🏢 Municipality:', formData.municipality);
            console.log('👤 Gender:', formData.gender);
            console.log('📄 License Number:', formData.licenseNumber);

            // Save to Firestore (using simple object storage for free tier)
            try {
                await db.collection('certificates').doc(certificateId).set(certificateData);
                console.log('Certificate saved successfully:', certificateId);
            } catch (error) {
                console.error('Error saving to Firestore:', error);
                // Fallback: save to localStorage
                const existingCerts = JSON.parse(localStorage.getItem('certificates') || '[]');
                existingCerts.push({ id: certificateId, ...certificateData });
                localStorage.setItem('certificates', JSON.stringify(existingCerts));
                console.log('Certificate saved to localStorage as fallback');
            }

            // Generate shareable link
            const shareableLink = `${window.location.origin}/certificate.html?id=${certificateId}`;

            this.hideLoading();
            this.showSuccess('تم حفظ الشهادة بنجاح!', shareableLink);
            this.resetForm();
            this.loadStats();
            this.loadCertificates();

        } catch (error) {
            this.hideLoading();
            this.showError('حدث خطأ أثناء حفظ الشهادة: ' + error.message);
            console.error('Error saving certificate:', error);
        }
    }

    getFormData() {
        return {
            name: document.getElementById('name').value.trim(),
            idNumber: document.getElementById('idNumber').value.trim(),
            gender: document.getElementById('gender').value,
            nationality: document.getElementById('nationality').value.trim(),
            profession: document.getElementById('profession').value.trim(),
            amanah: document.getElementById('amanah').value.trim(),
            municipality: document.getElementById('municipality').value.trim(),
            certificateNumber: document.getElementById('certificateNumber').value.trim(),
            licenseNumber: document.getElementById('licenseNumber').value.trim(),
            issueDateHijri: document.getElementById('issueDateHijri').value.trim(),
            issueDateGregorian: document.getElementById('issueDateGregorian').value,
            expiryDateHijri: document.getElementById('expiryDateHijri').value.trim(),
            expiryDateGregorian: document.getElementById('expiryDateGregorian').value,
            programType: document.getElementById('programType').value,
            programExpiryDate: document.getElementById('programExpiryDate').value,
            establishmentName: document.getElementById('establishmentName').value.trim(),
            establishmentNumber: document.getElementById('establishmentNumber').value.trim()
        };
    }

    validateForm(data) {
        const requiredFields = [
            'name', 'idNumber', 'gender', 'nationality', 'profession', 
            'amanah', 'municipality', 'certificateNumber', 'licenseNumber',
            'issueDateHijri', 'issueDateGregorian', 'expiryDateHijri', 
            'expiryDateGregorian', 'programType', 'programExpiryDate',
            'establishmentName', 'establishmentNumber'
        ];

        for (const field of requiredFields) {
            if (!data[field]) {
                this.showError(`يرجى ملء جميع الحقول المطلوبة`);
                return false;
            }
        }

        // Validate photo
        const photoFile = document.getElementById('photo').files[0];
        if (!photoFile) {
            this.showError('يرجى رفع الصورة الشخصية');
            return false;
        }

        return true;
    }

    async uploadImage(file) {
        // Convert image to base64 for storage in Firestore (free tier solution)
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                // Compress image if too large
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Set max dimensions
                    const maxWidth = 400;
                    const maxHeight = 400;
                    
                    let { width, height } = img;
                    
                    // Calculate new dimensions
                    if (width > height) {
                        if (width > maxWidth) {
                            height = (height * maxWidth) / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = (width * maxHeight) / height;
                            height = maxHeight;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Draw and compress
                    ctx.drawImage(img, 0, 0, width, height);
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    
                    resolve(compressedDataUrl);
                };
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    generateCertificateId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `CERT_${timestamp}_${random}`;
    }

    getCertificateStatus(expiryDate) {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry < 0) {
            return 'expired';
        } else if (daysUntilExpiry <= 30) {
            return 'expiring';
        } else {
            return 'active';
        }
    }

    async loadCertificates() {
        try {
            // Try to load certificates from Firestore
            const snapshot = await db.collection('certificates').get();
            
            this.certificates = [];
            snapshot.forEach((doc) => {
                this.certificates.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log('Loaded certificates from Firestore:', this.certificates.length);
            
        } catch (error) {
            console.error('Error loading from Firestore:', error);
            // Fallback: load from localStorage
            const localCerts = JSON.parse(localStorage.getItem('certificates') || '[]');
            this.certificates = localCerts;
            console.log('Loaded certificates from localStorage:', this.certificates.length);
        }
        
        // Sort by creation date (newest first)
        this.certificates.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA;
        });
    }

    loadStats() {
        try {
            // Calculate stats from loaded certificates
            let total = this.certificates.length;
            let active = 0;
            let expiring = 0;

            this.certificates.forEach((cert) => {
                if (cert.status === 'active') {
                    active++;
                } else if (cert.status === 'expiring') {
                    expiring++;
                }
            });

            document.getElementById('totalCertificates').textContent = total;
            document.getElementById('activeCertificates').textContent = active;
            document.getElementById('expiringSoon').textContent = expiring;

        } catch (error) {
            console.error('Error loading stats:', error);
            // Set default values
            document.getElementById('totalCertificates').textContent = '0';
            document.getElementById('activeCertificates').textContent = '0';
            document.getElementById('expiringSoon').textContent = '0';
        }
    }

    renderCertificatesTable() {
        const container = document.getElementById('certificatesTable');
        
        if (this.certificates.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 40px; color: #718096;">لا توجد شهادات محفوظة</p>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'certificates-table';
        
        table.innerHTML = `
            <thead>
                <tr>
                    <th>الاسم</th>
                    <th>رقم الهوية</th>
                    <th>رقم الشهادة</th>
                    <th>تاريخ الانتهاء</th>
                    <th>الحالة</th>
                    <th>الإجراءات</th>
                </tr>
            </thead>
            <tbody>
                ${this.certificates.map(cert => `
                    <tr>
                        <td>${cert.name}</td>
                        <td>${cert.idNumber}</td>
                        <td>${cert.certificateNumber}</td>
                        <td>${cert.expiryDateGregorian}</td>
                        <td>
                            <span class="status-badge status-${cert.status}">
                                ${this.getStatusText(cert.status)}
                            </span>
                        </td>
                        <td>
                            <div class="action-buttons">
                                <button onclick="admin.viewCertificate('${cert.certificateId || cert.id}')" class="btn-view" title="عرض الشهادة">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button onclick="admin.copyCertificateLink('${cert.certificateId || cert.id}')" class="btn-copy" title="نسخ رابط الشهادة">
                                    <i class="fas fa-link"></i>
                                </button>
                                <button onclick="admin.deleteCertificate('${cert.id}')" class="btn-delete" title="حذف الشهادة">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        
        container.innerHTML = '';
        container.appendChild(table);
    }

    getStatusText(status) {
        const statusMap = {
            'active': 'نشطة',
            'expiring': 'تنتهي قريباً',
            'expired': 'منتهية الصلاحية'
        };
        return statusMap[status] || 'غير محدد';
    }

    viewCertificate(certificateId) {
        // Find the certificate to get the correct ID
        const cert = this.certificates.find(c => c.certificateId === certificateId || c.id === certificateId);
        const actualId = cert ? (cert.certificateId || cert.id) : certificateId;
        const link = `${window.location.origin}/certificate.html?id=${actualId}`;
        console.log('Opening certificate with ID:', actualId);
        window.open(link, '_blank');
    }

    getCertificateStatus(expiryDate) {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry < 0) {
            return 'expired';
        } else if (daysUntilExpiry <= 30) {
            return 'expiring';
        } else {
            return 'active';
        }
    }

    async loadCertificates() {
        try {
            // Try to load certificates from Firestore
            const snapshot = await db.collection('certificates').get();
            
            this.certificates = [];
            snapshot.forEach((doc) => {
                this.certificates.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log('Loaded certificates from Firestore:', this.certificates.length);
            
        } catch (error) {
            console.error('Error loading from Firestore:', error);
            // Fallback: load from localStorage
            const localCerts = JSON.parse(localStorage.getItem('certificates') || '[]');
            this.certificates = localCerts;
            console.log('Loaded certificates from localStorage:', this.certificates.length);
        }
        
        // Sort by creation date (newest first)
        this.certificates.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA;
        });
        
        // Render certificates table and update stats
        this.renderCertificatesTable();
        await this.loadStats();
    }

    async loadStats() {
        try {
            // Calculate stats from loaded certificates
            let total = this.certificates.length;
            let active = 0;
            let expiring = 0;

            this.certificates.forEach((cert) => {
                const status = this.getCertificateStatus(cert.expiryDateGregorian);
                if (status === 'active') {
                    active++;
                } else if (status === 'expiring') {
                    expiring++;
                }
            });

            const stats = { total, active, expiring, lastUpdated: new Date().toISOString() };
            
            // Store stats in Firebase
            try {
                await db.collection('system').doc('statistics').set(stats);
                console.log('Stats saved to Firebase:', stats);
            } catch (error) {
                console.error('Error saving stats to Firebase:', error);
                // Fallback to localStorage
                localStorage.setItem('certificateStats', JSON.stringify(stats));
            }

            document.getElementById('totalCertificates').textContent = total;
            document.getElementById('activeCertificates').textContent = active;
            document.getElementById('expiringSoon').textContent = expiring;
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    searchCertificates(query) {
        const filteredCertificates = this.certificates.filter(cert =>
            cert.name.toLowerCase().includes(query.toLowerCase()) ||
            cert.idNumber.includes(query) ||
            cert.certificateNumber.includes(query)
        );
        
        // Temporarily store original certificates
        const originalCertificates = this.certificates;
        this.certificates = filteredCertificates;
        this.renderCertificatesTable();
        this.certificates = originalCertificates;
    }

    resetForm() {
        document.getElementById('certificateForm').reset();
        document.getElementById('imagePreview').classList.add('hidden');
        document.querySelector('.upload-placeholder').style.display = 'flex';
        this.hideMessages();
    }

    showSuccess(message, link = null) {
        const successDiv = document.getElementById('successMessage');
        const successText = document.getElementById('successText');
        const linkContainer = successDiv.querySelector('.link-container');
        const linkInput = document.getElementById('certificateLink');
        
        successText.textContent = message;
        
        if (link) {
            linkInput.value = link;
            linkContainer.style.display = 'block';
        } else {
            linkContainer.style.display = 'none';
        }
        
        successDiv.classList.remove('hidden');
        
        // Auto hide after 10 seconds
        setTimeout(() => {
            successDiv.classList.add('hidden');
        }, 10000);
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        
        errorText.textContent = message;
        errorDiv.classList.remove('hidden');
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            errorDiv.classList.add('hidden');
        }, 5000);
    }

    hideMessages() {
        document.getElementById('successMessage').classList.add('hidden');
        document.getElementById('errorMessage').classList.add('hidden');
    }

    showLoading() {
        document.getElementById('loadingOverlay').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.add('hidden');
    }

    copyLink() {
        const linkInput = document.getElementById('certificateLink');
        linkInput.select();
        linkInput.setSelectionRange(0, 99999); // For mobile devices
        
        try {
            document.execCommand('copy');
            
            // Change button text temporarily
            const copyBtn = document.getElementById('copyLinkBtn');
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i> تم النسخ';
            copyBtn.style.background = '#48bb78';
            
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.style.background = '#48bb78';
            }, 2000);
            
        } catch (err) {
            console.error('Failed to copy link:', err);
            this.showError('فشل في نسخ الرابط');
        }
    }

    copyCertificateLink(certificateId) {
        const baseUrl = window.location.origin;
        const certificateUrl = `${baseUrl}/certificate.html?id=${certificateId}`;
        
        // Try modern clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(certificateUrl).then(() => {
                this.showSuccess('تم نسخ رابط الشهادة بنجاح');
            }).catch(err => {
                console.error('Failed to copy link:', err);
                this.fallbackCopyLink(certificateUrl);
            });
        } else {
            this.fallbackCopyLink(certificateUrl);
        }
    }

    fallbackCopyLink(url) {
        // Create temporary input element
        const tempInput = document.createElement('input');
        tempInput.value = url;
        document.body.appendChild(tempInput);
        tempInput.select();
        tempInput.setSelectionRange(0, 99999);
        
        try {
            document.execCommand('copy');
            this.showSuccess('تم نسخ رابط الشهادة بنجاح');
        } catch (err) {
            console.error('Failed to copy link:', err);
            this.showError('فشل في نسخ الرابط');
        }
        
        document.body.removeChild(tempInput);
    }

    async deleteCertificate(certificateId) {
        if (!confirm('هل أنت متأكد من حذف هذه الشهادة؟ لا يمكن التراجع عن هذا الإجراء.')) {
            return;
        }

        this.showLoading();
        
        try {
            // Delete from Firestore
            await db.collection('certificates').doc(certificateId).delete();
            console.log('✅ Certificate deleted from Firestore');
            
            // Remove from local array
            this.certificates = this.certificates.filter(cert => 
                cert.id !== certificateId && cert.certificateId !== certificateId
            );
            
            // Update localStorage
            localStorage.setItem('certificates', JSON.stringify(this.certificates));
            
            // Re-render table and update stats
            this.renderCertificatesTable();
            this.updateStatistics();
            
            this.showSuccess('تم حذف الشهادة بنجاح');
            
        } catch (error) {
            console.error('❌ Error deleting certificate:', error);
            this.showError('فشل في حذف الشهادة');
        } finally {
            this.hideLoading();
        }
    }

    viewCertificate(certificateId) {
        const baseUrl = window.location.origin;
        const certificateUrl = `${baseUrl}/certificate.html?id=${certificateId}`;
        window.open(certificateUrl, '_blank');
    }
}

// Initialize admin dashboard when page loads
let adminDashboard;
document.addEventListener('DOMContentLoaded', () => {
    adminDashboard = new AdminDashboard();
});
