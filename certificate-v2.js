// Certificate View JavaScript - V2 - Final Fix 2025-01-28
// NO QRious or QRCode.js - Google Charts API ONLY
class CertificateViewer {
    constructor() {
        this.certificateId = this.getCertificateIdFromURL();
        this.certificateData = null;
        console.log('🚀 Certificate viewer initialized with ID:', this.certificateId);
        this.init();
    }

    init() {
        this.getCertificateIdFromURL();
        this.setupEventListeners();
        this.loadCertificate();
    }

    getCertificateIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        this.certificateId = urlParams.get('id');
        
        if (!this.certificateId) {
            this.showError();
            return;
        }
    }

    setupEventListeners() {
        // Event listeners will be added dynamically when buttons are created
        // No need to set them up here since buttons don't exist yet
    }

    async loadCertificate() {
        try {
            console.log('🔍 Loading certificate with ID:', this.certificateId);
            this.showLoading();

            // Try to get certificate data from Firestore first
            let certificateFound = false;
            
            try {
                console.log('📡 Trying direct Firestore lookup...');
                const doc = await db.collection('certificates').doc(this.certificateId).get();
                
                if (doc.exists) {
                    this.certificateData = doc.data();
                    certificateFound = true;
                    console.log('✅ Certificate loaded from Firestore (direct):', this.certificateData);
                } else {
                    console.log('❌ Document does not exist with direct lookup');
                }
            } catch (firestoreError) {
                console.warn('⚠️ Direct Firestore lookup failed:', firestoreError);
            }

            // Fallback: Try to get from localStorage
            if (!certificateFound) {
                console.log('🔄 Trying localStorage fallback...');
                const localCertificates = JSON.parse(localStorage.getItem('certificates') || '[]');
                const localCert = localCertificates.find(cert => cert.id === this.certificateId);
                
                if (localCert) {
                    this.certificateData = localCert;
                    certificateFound = true;
                    console.log('✅ Certificate loaded from localStorage:', this.certificateData);
                } else {
                    console.log('❌ Certificate not found in localStorage either');
                }
            }

            if (certificateFound) {
                this.displayCertificate();
                this.generateQRCode();
                this.addActionButtons();
            } else {
                console.error('❌ Certificate not found anywhere');
                this.showError();
            }

        } catch (error) {
            console.error('❌ Error loading certificate:', error);
            this.showError();
        }
    }

    displayCertificate() {
        console.log('📄 Displaying certificate data...');
        this.hideLoading();
        
        const certificateDisplay = document.getElementById('certificateDisplay');
        certificateDisplay.classList.remove('hidden');

        // Update header certificate number
        const headerCertNumber = document.getElementById('headerCertNumber');
        if (headerCertNumber) {
            headerCertNumber.textContent = `رقم الشهادة: ${this.certificateData.certificateNumber || this.certificateId}`;
        }

        // Update all certificate fields safely
        this.updateFieldSafely('certNumber', this.certificateData.certificateNumber || this.certificateId);
        this.updateFieldSafely('fullName', this.certificateData.name);
        this.updateFieldSafely('nationalId', this.certificateData.nationalId);
        this.updateFieldSafely('nationality', this.certificateData.nationality);
        this.updateFieldSafely('birthDate', this.formatDate(this.certificateData.birthDate));
        this.updateFieldSafely('gender', this.certificateData.gender);
        this.updateFieldSafely('passportNumber', this.certificateData.passportNumber);
        this.updateFieldSafely('phoneNumber', this.certificateData.phoneNumber);
        this.updateFieldSafely('email', this.certificateData.email);
        this.updateFieldSafely('address', this.certificateData.address);
        this.updateFieldSafely('profession', this.certificateData.profession);
        this.updateFieldSafely('workplace', this.certificateData.workplace);
        this.updateFieldSafely('certificateType', this.certificateData.certificateType);
        this.updateFieldSafely('healthStatus', this.certificateData.healthStatus);
        this.updateFieldSafely('medicalTests', this.certificateData.medicalTests);
        this.updateFieldSafely('vaccinations', this.certificateData.vaccinations);
        this.updateFieldSafely('issueDate', this.formatDate(this.certificateData.issueDate));
        this.updateFieldSafely('expiryDate', this.formatDate(this.certificateData.expiryDate));
        this.updateFieldSafely('issuingAuthority', this.certificateData.issuingAuthority);
        this.updateFieldSafely('doctorName', this.certificateData.doctorName);
        this.updateFieldSafely('notes', this.certificateData.notes);

        // Handle photo display
        this.displayPhoto();

        console.log('✅ Certificate displayed successfully');
    }

    updateFieldSafely(fieldId, value) {
        const element = document.getElementById(fieldId);
        if (element) {
            element.textContent = value || '-';
        }
    }

    displayPhoto() {
        const photoElement = document.getElementById('personalPhoto');
        const placeholderElement = document.getElementById('photoPlaceholder');
        
        if (this.certificateData.photo) {
            if (photoElement) {
                photoElement.src = this.certificateData.photo;
                photoElement.classList.remove('photo-hidden');
            }
            if (placeholderElement) {
                placeholderElement.classList.add('photo-hidden');
            }
        } else {
            if (photoElement) {
                photoElement.classList.add('photo-hidden');
            }
            if (placeholderElement) {
                placeholderElement.classList.remove('photo-hidden');
            }
        }
    }

    copyLink() {
        const currentUrl = window.location.href;
        navigator.clipboard.writeText(currentUrl).then(() => {
            console.log('✅ Certificate link copied to clipboard');
            this.showMessage('تم نسخ رابط الشهادة بنجاح');
        }).catch(err => {
            console.error('❌ Failed to copy link:', err);
            this.showMessage('فشل في نسخ الرابط');
        });
    }

    getStatusInArabic(status) {
        const statusMap = {
            'valid': 'صالحة',
            'active': 'نشطة',
            'expiring': 'تنتهي قريباً',
            'expired': 'منتهية الصلاحية',
            'unknown': 'غير محدد'
        };
        return statusMap[status] || 'غير محدد';
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    }

    generateQRCode() {
        console.log('🔄 QR Code V2 - Starting generation...');
        console.log('✅ NO QRious library - using Google Charts only');
        
        const qrContainer = document.getElementById('qrCode');
        if (!qrContainer) {
            console.warn('⚠️ QR container not found');
            return;
        }

        const certificateUrl = window.location.href;
        console.log('📱 Generating QR for URL:', certificateUrl);
        
        // Use Google Charts API directly - GUARANTEED to work
        this.generateQRWithGoogleAPI(qrContainer, certificateUrl);
    }

    generateQRWithGoogleAPI(container, url) {
        console.log('🌐 Using Google Charts API for QR generation...');
        
        // Show loading message
        container.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">جاري تحميل رمز QR...</div>';
        
        const qrImg = document.createElement('img');
        const encodedUrl = encodeURIComponent(url);
        qrImg.src = `https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=${encodedUrl}`;
        qrImg.style.cssText = 'border: 1px solid #ddd; border-radius: 8px; display: block; margin: 0 auto; max-width: 150px; height: auto;';
        qrImg.alt = 'رمز QR للشهادة الصحية';
        
        qrImg.onload = function() {
            container.innerHTML = '';
            container.appendChild(qrImg);
            console.log('✅ QR code loaded successfully via Google Charts');
        };
        
        qrImg.onerror = function() {
            console.warn('⚠️ Google Charts QR failed, showing fallback');
            this.showQRFallback(container, url);
        }.bind(this);
        
        // Timeout fallback after 10 seconds
        setTimeout(() => {
            if (container.innerHTML.includes('جاري تحميل')) {
                console.warn('⚠️ QR loading timeout, showing fallback');
                this.showQRFallback(container, url);
            }
        }.bind(this), 10000);
    }
    
    showQRFallback(container, url) {
        container.innerHTML = `
            <div class="qr-placeholder" style="width: 150px; height: 150px; border: 2px dashed #ddd; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-direction: column; margin: 0 auto; background: #f8f9fa;">
                <div style="font-size: 48px; color: #6c757d; margin-bottom: 10px;">📱</div>
                <div style="font-size: 14px; color: #6c757d; text-align: center; padding: 0 10px;">
                    رمز التحقق
                </div>
                <div style="font-size: 12px; color: #adb5bd; text-align: center; margin-top: 8px; padding: 0 10px;">
                    استخدم الرابط أدناه
                </div>
                <button onclick="navigator.clipboard.writeText('${url}'); this.textContent='✅ تم النسخ!'; setTimeout(() => this.textContent='📋 نسخ الرابط', 2000)" 
                        style="margin-top: 8px; padding: 8px 16px; font-size: 12px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; transition: all 0.2s;" 
                        onmouseover="this.style.background='#0056b3'" onmouseout="this.style.background='#007bff'">
                    📋 نسخ الرابط
                </button>
            </div>
        `;
        console.log('ℹ️ QR fallback displayed');
    }

    addActionButtons() {
        const headerActions = document.querySelector('.header-actions');
        if (headerActions && !headerActions.querySelector('.btn')) {
            headerActions.innerHTML = `
                <div style="display: flex; gap: 15px; flex-wrap: wrap; justify-content: center;">
                    <button onclick="certificateViewer.copyLink()" 
                            style="background: #007bff; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 8px; transition: all 0.3s ease;"
                            onmouseover="this.style.background='#0056b3'" onmouseout="this.style.background='#007bff'">
                        📋 نسخ الرابط
                    </button>
                </div>
            `;
        }
    }

    showMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #48bb78;
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            z-index: 9999;
            font-weight: 600;
        `;
        messageDiv.textContent = message;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            if (document.body.contains(messageDiv)) {
                document.body.removeChild(messageDiv);
            }
        }, 3000);
    }

    showLoading() {
        document.getElementById('loadingState').classList.remove('hidden');
        document.getElementById('errorState').classList.add('hidden');
        document.getElementById('certificateDisplay').classList.add('hidden');
    }

    hideLoading() {
        document.getElementById('loadingState').classList.add('hidden');
    }

    showError() {
        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('errorState').classList.remove('hidden');
        document.getElementById('certificateDisplay').classList.add('hidden');
    }
}

// Initialize certificate viewer when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.certificateViewer = new CertificateViewer();
});
