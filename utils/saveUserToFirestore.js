// utils/saveUserToFirestore.js
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseClient';

export async function saveUserToFirestore(user) {
  if (!user || !user.uid) return;

  const userRef = doc(db, 'users', user.uid);
  const existing = await getDoc(userRef);

  if (!existing.exists()) {
    console.log('🆕 Creating new user document');
    await setDoc(userRef, {
      uid: user.uid,
      fullName: user.displayName || '',
      email: user.email,
      companyId: '__pending__',
      role: 'Administrator',
      lastLogin: serverTimestamp(),
    });
  } else {
    console.log('✅ Updating existing user lastLogin only');
    await setDoc(userRef, {
      lastLogin: serverTimestamp(),
    }, { merge: true });
  }
}
