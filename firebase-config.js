// Firebase Configuration
// Replace these values with your actual Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBvOvpy-TXh6VOuT0_DQH-MFXKZ-i2HUFc",
    authDomain: "healthcertificates-sa.firebaseapp.com",
    projectId: "healthcertificates-sa",
    storageBucket: "healthcertificates-sa.appspot.com",
    messagingSenderId: "334334334334",
    appId: "1:334334334334:web:1234567890abcdef123456"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized successfully');
} catch (error) {
    console.error('❌ Firebase initialization error:', error);
}

// Initialize Firebase services (only what we need for free tier)
const db = firebase.firestore();
const auth = firebase.auth ? firebase.auth() : null;
// Note: Storage removed - using base64 images in Firestore instead

// Firebase setup complete - using free tier only
console.log(`
✅ Firebase Configuration Active

Project: healthcertificates-sa
Services: Firestore Database + Authentication
Images: Stored as base64 in Firestore (no Storage needed)

Firestore Rules (copy to Firebase Console > Firestore > Rules):
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
`);

// Export for use in other files
window.firebaseConfig = {
    db,
    auth,
    firebase
};
