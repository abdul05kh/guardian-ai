import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBgxqfnLxSDiY4sM3OARFvv82KKXdb_hSk",
  authDomain: "guardain-ai.firebaseapp.com",
  projectId: "guardain-ai",
  storageBucket: "guardain-ai.firebasestorage.app",
  messagingSenderId: "286928006852",
  appId: "1:286928006852:web:b72be8e46b8ef0b65d6391",
  measurementId: "G-HYVHNC3FB7"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
