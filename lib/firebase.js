import { initializeApp, getApps } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};
console.log('Firebase config loaded:', firebaseConfig);

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  ignoreUndefinedProperties: true,
});

const appCheckKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
if (typeof window !== 'undefined') {
  if (appCheckKey) {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(appCheckKey),
      isTokenAutoRefreshEnabled: true,
    });
    console.log('Firebase App Check enabled.');
  } else {
    console.warn('Firebase App Check disabled: NEXT_PUBLIC_RECAPTCHA_SITE_KEY not set.');
  }

  enableIndexedDbPersistence(db, { synchronizeTabs: true }).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence failed: multiple tabs open.');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence not supported by this browser.');
    } else {
      console.warn('Firestore persistence initialization error:', err);
    }
  });
}

export const googleProvider = new GoogleAuthProvider();

export default app;
