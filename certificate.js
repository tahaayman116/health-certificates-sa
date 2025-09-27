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
        document.getElementById('printBtn').addEventListener('click', () => {
            this.printCertificate();
        });

        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadPDF();
        });
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
        
        // Personal Information
        document.getElementById('displayName').textContent = data.name || '-';
        document.getElementById('displayIdNumber').textContent = data.idNumber || '-';
        document.getElementById('displayGender').textContent = data.gender || '-';
        document.getElementById('displayNationality').textContent = data.nationality || '-';
        document.getElementById('displayProfession').textContent = data.profession || '-';
        document.getElementById('displayAmanah').textContent = data.amanah || '-';
        document.getElementById('displayMunicipality').textContent = data.municipality || '-';

        // Photo
        if (data.imageData) {
            document.getElementById('displayPhoto').src = data.imageData;
        } else if (data.imageUrl) {
            document.getElementById('displayPhoto').src = data.imageUrl;
        } else {
            document.getElementById('displayPhoto').style.display = 'none';
        }

        // Certificate Information
        document.getElementById('displayCertificateNumber').textContent = data.certificateNumber || '-';
        document.getElementById('displayCertNumber').textContent = data.certificateNumber || '-';
        document.getElementById('displayLicenseNumber').textContent = data.licenseNumber || '-';
        document.getElementById('displayIssueDateHijri').textContent = data.issueDateHijri || '-';
        document.getElementById('displayIssueDateGregorian').textContent = this.formatDate(data.issueDateGregorian) || '-';
        document.getElementById('displayExpiryDateHijri').textContent = data.expiryDateHijri || '-';
        document.getElementById('displayExpiryDateGregorian').textContent = this.formatDate(data.expiryDateGregorian) || '-';

        // Status
        const statusElement = document.getElementById('displayStatus');
        const status = data.status || this.calculateStatus(data.expiryDateGregorian);
        statusElement.textContent = this.getStatusText(status);
        statusElement.className = `status-badge status-${status}`;

        // Educational Program
        document.getElementById('displayProgramType').textContent = data.programType || '-';
        document.getElementById('displayProgramExpiryDate').textContent = this.formatDate(data.programExpiryDate) || '-';

        // Establishment Information
        document.getElementById('displayEstablishmentName').textContent = data.establishmentName || '-';
        document.getElementById('displayEstablishmentNumber').textContent = data.establishmentNumber || '-';

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
            document.getElementById('displayCreatedDate').textContent = this.formatDate(createdDate.toISOString().split('T')[0]);
        } catch (dateError) {
            console.error('Date formatting error:', dateError);
            document.getElementById('displayCreatedDate').textContent = 'تاريخ غير صحيح';
        }

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

    generateQRCode() {
        const qrContainer = document.getElementById('qrCode');
        if (!qrContainer) return;

        const certificateUrl = window.location.href;
        
        // Create a simple QR-style visual representation
        console.log('📱 Creating QR display');
        
        qrContainer.innerHTML = `
            <div style="text-align: center; padding: 15px; border: 2px solid #007bff; border-radius: 8px; background: linear-gradient(135deg, #f8f9ff 0%, #e3f2fd 100%);">
                <div style="display: inline-block; padding: 10px; background: white; border-radius: 8px; margin-bottom: 10px; box-shadow: 0 2px 8px rgba(0,123,255,0.1);">
                    <div style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 2px; width: 120px; height: 120px;">
                        ${this.generateQRPattern()}
                    </div>
                </div>
                <p style="color: #007bff; margin: 8px 0; font-size: 14px; font-weight: 600;">رمز التحقق</p>
                <div style="font-family: monospace; font-size: 10px; color: #666; word-break: break-all; margin: 8px 0; padding: 8px; background: rgba(255,255,255,0.8); border-radius: 4px; border: 1px solid #e0e0e0;">
                    ${certificateUrl.replace('http://localhost:3002/', '').substring(0, 40)}...
                </div>
                <button onclick="navigator.clipboard.writeText('${certificateUrl}'); this.textContent='✅ تم النسخ!'; setTimeout(() => this.textContent='📋 نسخ الرابط', 2000)" 
                        style="margin-top: 8px; padding: 8px 16px; font-size: 12px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; transition: all 0.2s;" 
                        onmouseover="this.style.background='#0056b3'" onmouseout="this.style.background='#007bff'">
                    📋 نسخ الرابط
                </button>
                <div style="margin-top: 8px; font-size: 10px; color: #666;">
                    استخدم هذا الرابط للتحقق من الشهادة
                </div>
            </div>
        `;
    }
    
    generateQRPattern() {
        // Generate a simple QR-like pattern
        const pattern = [
            1,1,1,1,1,1,1,0,
            1,0,0,0,0,0,1,1,
            1,0,1,1,1,0,1,0,
            1,0,1,1,1,0,1,1,
            1,0,1,1,1,0,1,0,
            1,0,0,0,0,0,1,1,
            1,1,1,1,1,1,1,0,
            0,1,0,1,0,1,0,1
        ];
        
        return pattern.map(cell => 
            `<div style="background: ${cell ? '#000' : '#fff'}; border-radius: 1px;"></div>`
        ).join('');
    }

    printCertificate() {
        // Hide action buttons for printing
        const headerActions = document.querySelector('.header-actions');
        headerActions.style.display = 'none';
        
        // Print
        window.print();
        
        // Show action buttons again
        setTimeout(() => {
            headerActions.style.display = 'flex';
        }, 1000);
    }

    downloadPDF() {
        // For now, use print functionality
        // In a production environment, you might want to use a library like jsPDF
        this.printCertificate();
        
        // Show a message about PDF download
        this.showMessage('يمكنك حفظ الصفحة كـ PDF من خيارات الطباعة في المتصفح');
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
