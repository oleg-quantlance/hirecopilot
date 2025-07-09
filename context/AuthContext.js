'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/utils/firebaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUserData = async (uid) => {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      setUserData(userSnap.data());
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserData(null);
    setProfile(null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[AuthContext] onAuthStateChanged fired:', firebaseUser);
      if (firebaseUser) {
        setUser(firebaseUser);
        setProfile({
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified,
        });

        const userRef = doc(db, 'users', firebaseUser.uid);
        console.log('[AuthContext] Fetching Firestore user:', firebaseUser.uid);
        const userSnap = await getDoc(userRef);

if (userSnap.exists()) {
  console.log('[AuthContext] User doc exists, updating lastLogin...');
  await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });

  // ✅ Re-fetch to ensure we get updated data (e.g., isInvited)
  const freshSnap = await getDoc(userRef);
  const data = freshSnap.data();
  setUserData(data);

  console.log('[Users Data]', data);

  // ✅ Skip verify-email redirect if user is invited
  if (!firebaseUser.emailVerified && !data.isInvited) {
     console.log('Going to Verify email!!!!');
    window.location.href = '/verify-email';
  }
}
        else {
          console.log('[AuthContext] No user doc found, creating minimal doc...');
          const newUserData = {
            fullName: firebaseUser.displayName || 'No Name',
            email: firebaseUser.email,
            lastLogin: serverTimestamp(),
          };
          await setDoc(userRef, newUserData, { merge: true });
          setUserData(newUserData);
        }
      } else {
        setUser(null);
        setUserData(null);
        setProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, profile, refreshUserData, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
