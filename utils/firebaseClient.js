import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// --- FIREBASE CONFIGURATION FROM ENV ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// --- INITIALIZE FIREBASE ---
const app = initializeApp(firebaseConfig);

// --- AUTH, DB, STORAGE ---
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- FUNCTIONS (with region for Gen2) ---
const functions = getFunctions(app, 'us-central1');

// --- OPTIONAL: Local emulator support ---
// if (process.env.NODE_ENV === 'development') {
//   connectFunctionsEmulator(functions, 'localhost', 5001);
// }

// --- APP CHECK ---
if (typeof window !== 'undefined') {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LfN1FopAAAAAFUMfyIUpgTNB5ONZfy7cb5mrJ1x'
    ),
    isTokenAutoRefreshEnabled: true,
  });
}

export { auth, db, storage, functions };
