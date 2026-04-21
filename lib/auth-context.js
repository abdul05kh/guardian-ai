'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, db, googleProvider } from '@/lib/firebase';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timeoutId;
    let isCancelled = false;

    const finishLoading = () => {
      if (!isCancelled) {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (isCancelled) return;

      if (firebaseUser) {
        setUser(firebaseUser);
        // Try to load user profile from Firestore
        try {
          const profileDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (profileDoc.exists()) {
            setUserProfile(profileDoc.data());
          } else {
            const defaultProfile = {
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || 'User',
              role: 'admin',
              orgId: null,
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
            };
            try {
              await setDoc(doc(db, 'users', firebaseUser.uid), defaultProfile);
              setUserProfile(defaultProfile);
            } catch (writeErr) {
              console.warn('Could not create profile:', writeErr.message);
              setUserProfile({ email: firebaseUser.email, displayName: firebaseUser.displayName, role: 'admin' });
            }
          }
        } catch (err) {
          console.warn('Profile fetch error (using fallback):', err.message);
          setUserProfile({
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || 'User',
            role: 'admin',
          });
        } finally {
          finishLoading();
        }
      } else {
        setUser(null);
        setUserProfile(null);
        finishLoading();
      }
    });

    // Failsafe: force loading to false after 5 seconds
    timeoutId = setTimeout(() => {
      finishLoading();
    }, 5000);

    return () => {
      isCancelled = true;
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Check if profile exists, if not create one
      const profileRef = doc(db, 'users', result.user.uid);
      const profileDoc = await getDoc(profileRef);
      if (!profileDoc.exists()) {
        const profile = {
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          role: 'admin',
          orgId: null,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        };
        await setDoc(profileRef, profile);
        setUserProfile(profile);
      } else {
        await setDoc(profileRef, { lastLogin: serverTimestamp() }, { merge: true });
        setUserProfile(profileDoc.data());
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const loginWithEmail = useCallback(async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const signupWithEmail = useCallback(async (email, password, displayName) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName });
      const profile = {
        email,
        displayName,
        role: 'admin',
        orgId: null,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      };
      await setDoc(doc(db, 'users', result.user.uid), profile);
      setUserProfile(profile);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const updateUserProfile = useCallback(async (data) => {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid), data, { merge: true });
    setUserProfile(prev => ({ ...prev, ...data }));
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      loginWithGoogle,
      loginWithEmail,
      signupWithEmail,
      logout,
      updateUserProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
