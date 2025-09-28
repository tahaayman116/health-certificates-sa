// Certificate View JavaScript
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
                console.error('❌ Firestore direct lookup error:', firestoreError);
            }
            
            // Fallback: search all documents
            if (!certificateFound) {
                console.log('🔍 Searching all documents in collection...');
                try {
                    const allDocs = await db.collection('certificates').get();
                    console.log('📊 Total documents found:', allDocs.size);
                    
                    allDocs.forEach((doc) => {
                        const data = doc.data();
                        console.log('🔍 Checking document:', doc.id, 'with certificateId:', data.certificateId);
                        
                        if (data.certificateId === this.certificateId || doc.id === this.certificateId) {
                            this.certificateData = data;
                            certificateFound = true;
                            console.log('✅ Certificate found by searching! Document ID:', doc.id, 'Certificate ID:', data.certificateId);
                        }
                    });
                } catch (searchError) {
                    console.error('❌ Error searching certificates:', searchError);
                }
            }
                
            // Still not found? Try localStorage
            if (!certificateFound) {
                console.log('💾 Trying localStorage...');
                const localCerts = JSON.parse(localStorage.getItem('certificates') || '[]');
                console.log('💾 LocalStorage certificates:', localCerts.length);
                
                const foundCert = localCerts.find(cert => {
                    console.log('🔍 Checking local cert:', cert.certificateId || cert.id);
                    return cert.certificateId === this.certificateId || cert.id === this.certificateId;
                });
                
                if (foundCert) {
                    this.certificateData = foundCert;
                    certificateFound = true;
                    console.log('✅ Certificate loaded from localStorage:', foundCert);
                }
            }
            
            if (!certificateFound) {
                console.error('❌ Certificate not found anywhere! ID:', this.certificateId);
                this.showError();
                return;
            }

            console.log('🎉 Certificate loaded successfully:', this.certificateData);
            this.displayCertificate();
            this.generateQRCode();

        } catch (error) {
            console.error('💥 Fatal error loading certificate:', error);
            this.showError();
        }
    }

    displayCertificate() {
        const data = this.certificateData;
        
        // Update header certificate number
        const headerCertNumber = document.getElementById('headerCertNumber');
        if (headerCertNumber) {
            headerCertNumber.textContent = `رقم الشهادة: ${data.certificateNumber || '-'}`;
        }
        
        // Personal Information
        const displayName = document.getElementById('displayName');
        if (displayName) displayName.textContent = data.name || '-';
        
        const displayIdNumber = document.getElementById('displayIdNumber');
        if (displayIdNumber) displayIdNumber.textContent = data.idNumber || '-';
        
        const displayBirthDate = document.getElementById('displayBirthDate');
        if (displayBirthDate) displayBirthDate.textContent = data.birthDate || '-';
        
        const displayNationality = document.getElementById('displayNationality');
        if (displayNationality) displayNationality.textContent = data.nationality || '-';

        // Photo
        const displayPhoto = document.getElementById('displayPhoto');
        const photoPlaceholder = document.getElementById('photoPlaceholder');
        
        if (displayPhoto && photoPlaceholder) {
            if (data.imageData) {
                displayPhoto.src = data.imageData;
                displayPhoto.classList.remove('photo-hidden');
                photoPlaceholder.style.display = 'none';
                console.log('✅ Photo loaded from imageData');
            } else if (data.imageUrl) {
                displayPhoto.src = data.imageUrl;
                displayPhoto.classList.remove('photo-hidden');
                photoPlaceholder.style.display = 'none';
                console.log('✅ Photo loaded from imageUrl');
            } else {
                displayPhoto.classList.add('photo-hidden');
                photoPlaceholder.style.display = 'flex';
                console.log('❌ No photo data found');
            }
        }

        // Certificate Information
        const displayCertificateNumber = document.getElementById('displayCertificateNumber');
        if (displayCertificateNumber) displayCertificateNumber.textContent = data.certificateNumber || '-';
        
        const displayHealthStatus = document.getElementById('displayHealthStatus');
        if (displayHealthStatus) displayHealthStatus.textContent = data.healthStatus || '-';
        
        const displayIssueDateHijri = document.getElementById('displayIssueDateHijri');
        if (displayIssueDateHijri) displayIssueDateHijri.textContent = data.issueDateHijri || '-';
        
        const displayIssueDateGregorian = document.getElementById('displayIssueDateGregorian');
        if (displayIssueDateGregorian) displayIssueDateGregorian.textContent = this.formatDate(data.issueDateGregorian) || '-';
        
        const displayExpiryDateHijri = document.getElementById('displayExpiryDateHijri');
        if (displayExpiryDateHijri) displayExpiryDateHijri.textContent = data.expiryDateHijri || '-';
        
        const displayExpiryDateGregorian = document.getElementById('displayExpiryDateGregorian');
        if (displayExpiryDateGregorian) displayExpiryDateGregorian.textContent = this.formatDate(data.expiryDateGregorian) || '-';

        // Status
        const statusElement = document.getElementById('displayStatus');
        if (statusElement) {
            const status = data.status || this.calculateStatus(data.expiryDateGregorian);
            statusElement.textContent = this.getStatusText(status);
            statusElement.className = `status-badge status-${status}`;
        }

        // Educational Program
        const displayProgramType = document.getElementById('displayProgramType');
        if (displayProgramType) displayProgramType.textContent = data.programType || '-';
        
        const displayProgramExpiryDate = document.getElementById('displayProgramExpiryDate');
        if (displayProgramExpiryDate) displayProgramExpiryDate.textContent = this.formatDate(data.programExpiryDate) || '-';

        // Establishment Information
        const displayEstablishmentName = document.getElementById('displayEstablishmentName');
        if (displayEstablishmentName) displayEstablishmentName.textContent = data.establishmentName || '-';
        
        const displayEstablishmentNumber = document.getElementById('displayEstablishmentNumber');
        if (displayEstablishmentNumber) displayEstablishmentNumber.textContent = data.establishmentNumber || '-';

        // Created Date
        let createdDate;
        if (data.createdAt) {
            if (data.createdAt.seconds) {
                // Firestore timestamp
                createdDate = new Date(data.createdAt.seconds * 1000);
            } else if (typeof data.createdAt === 'string') {
                // ISO string
                createdDate = new Date(data.createdAt);
            } else {
                createdDate = new Date();
            }
        } else {
            createdDate = new Date();
        }
        
        try {
            const displayCreatedDate = document.getElementById('displayCreatedDate');
            if (displayCreatedDate) {
                displayCreatedDate.textContent = this.formatDate(createdDate.toISOString().split('T')[0]);
            }
        } catch (dateError) {
            console.error('Date formatting error:', dateError);
            const displayCreatedDate = document.getElementById('displayCreatedDate');
            if (displayCreatedDate) {
                displayCreatedDate.textContent = 'تاريخ غير صحيح';
            }
        }

        // Add action buttons to header after certificate is displayed
        this.addActionButtons();

        // Show certificate display
        this.hideLoading();
        document.getElementById('certificateDisplay').classList.remove('hidden');
    }

    calculateStatus(expiryDate) {
        if (!expiryDate) return 'unknown';
        
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

    getStatusText(status) {
        const statusMap = {
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

    async generateQRCode() {
        const qrContainer = document.getElementById('qrCode');
        if (!qrContainer) return;

        const certificateUrl = window.location.href;
        
        // Use QRCode library for real QR code generation
        console.log('✅ Generating real QR code with QRCode.js');
        
        try {
            // Wait for QRCode library to load
            let attempts = 0;
            const waitForQRCode = async () => {
                while (attempts < 30 && typeof QRCode === 'undefined') {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }
                return typeof QRCode !== 'undefined';
            };
            
            const qrLibLoaded = await waitForQRCode();
            
            if (qrLibLoaded) {
                console.log('✅ QRCode library loaded successfully');
                // Clear container
                qrContainer.innerHTML = '';
                
                // Create canvas for QR code
                const canvas = document.createElement('canvas');
                qrContainer.appendChild(canvas);
                
                // Generate QR code using QRCode.js
                QRCode.toCanvas(canvas, certificateUrl, {
                    width: 150,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                }, function (error) {
                    if (error) {
                        console.error('QR Code generation error:', error);
                        this.showQRFallback(qrContainer, certificateUrl);
                    } else {
                        console.log('✅ QR code generated successfully');
                        // Add styling to canvas
                        canvas.style.cssText = 'border: 1px solid #ddd; border-radius: 8px; display: block; margin: 0 auto;';
                    }
                }.bind(this));
            } else {
                console.warn('⚠️ QRCode library not loaded, showing fallback');
                this.showQRFallback(qrContainer, certificateUrl);
            }
        } catch (error) {
            console.error('❌ QR code generation failed:', error);
            this.showQRFallback(qrContainer, certificateUrl);
        }
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
        // Create a temporary message
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
        
        // Remove after 3 seconds
        setTimeout(() => {
            document.body.removeChild(messageDiv);
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
    new CertificateViewer();
});
