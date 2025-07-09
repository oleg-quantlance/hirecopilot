'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth';
import { auth, db } from '../../utils/firebaseClient';
import { Input } from '@/components/InputField';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Alert } from '@/components/Alert';
import { FcGoogle } from 'react-icons/fc';
import { FaMicrosoft } from 'react-icons/fa';
import { motion } from 'framer-motion';
import * as Tooltip from '@radix-ui/react-tooltip';
import { saveUserToFirestore } from '../../utils/saveUserToFirestore';
import { doc, getDoc } from 'firebase/firestore';

export default function AuthPage() {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => /[^@\s]+@[^@\s]+\.[^@\s]+/.test(email);
  const validatePassword = (pwd) => /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/.test(pwd);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const getFriendlyError = (code) => {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return 'Incorrect email or password.';
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'auth/email-already-in-use':
        return 'This email is already in use. Please log in.';
      default:
        return 'Something went wrong. Please try again.';
    }
  };

  const InfoIcon = ({ text }) => (
    <Tooltip.Provider delayDuration={0}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <span className="text-blue-500 cursor-help">ℹ️</span>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="bg-black text-white text-xs px-2 py-1 rounded shadow-md z-50" sideOffset={5}>
            {text}
            <Tooltip.Arrow className="fill-black" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );

const handleRedirectPostLogin = async (user) => {
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  const userData = userDoc.data();

  if (!user.emailVerified && !userData?.isInvited) {
    return router.push('/verify-email');
  }

  if (userData?.role === 'Administrator' && userData.companyId === '__pending__') {
    return router.push('/company');
  }

  return router.push('/dashboard');
};

  const handleSubmit = async () => {
    setError('');
    if (!validateEmail(form.email)) return setError('Please enter a valid email address');
    if (isSignup) {
      if (!validatePassword(form.password)) {
        return setError('Password must be at least 8 characters long, include an uppercase letter, a number, and a special character.');
      }
      if (form.password !== form.confirmPassword) {
        return setError('Passwords do not match.');
      }
    }

    try {
      setLoading(true);

      if (isSignup) {
        const methods = await fetchSignInMethodsForEmail(auth, form.email);
        if (methods.length > 0) {
          throw { code: 'auth/email-already-in-use' };
        }

        const res = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await updateProfile(res.user, { displayName: form.fullName });
        console.log('✅ User signed up:', res.user);
        await saveUserToFirestore(res.user);
        await sendEmailVerification(res.user);
        console.log('✅ Going to verify email:', res.user);
        return router.push('/verify-email');
      }

      // --- Sign In Flow ---
      const res = await signInWithEmailAndPassword(auth, form.email, form.password);
      console.log('✅ User logged in:', res.user);
      await saveUserToFirestore(res.user); // ONLY AFTER successful login
      await handleRedirectPostLogin(res.user);

    } catch (err) {
      console.error('❌ Auth error:', err);
      if (isSignup && err.code === 'auth/email-already-in-use') {
        return setError('This email is already in use. Please log in.');
      }
      setError(getFriendlyError(err.code || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (providerName) => {
    setError('');
    try {
      setLoading(true);
      let provider;
      if (providerName === 'google') provider = new GoogleAuthProvider();
      else if (providerName === 'microsoft') provider = new OAuthProvider('microsoft.com');

      const res = await signInWithPopup(auth, provider);
      console.log(`✅ OAuth (${providerName}) user:`, res.user);
      await saveUserToFirestore(res.user);
      await handleRedirectPostLogin(res.user);
    } catch (err) {
      console.error('❌ OAuth error:', err);
      setError(getFriendlyError(err.code || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50 to-indigo-100 px-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card title={isSignup ? 'Create your account' : 'Welcome back'}>
          <div className="space-y-4">
            {isSignup && <Input label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} />}
            <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} />
            <Input
              label={<span>Password {isSignup && <InfoIcon text="8+ chars, 1 uppercase, 1 digit, 1 special" />}</span>}
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
            />
            {isSignup && (
              <Input
                label="Confirm Password"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={handleChange}
              />
            )}
            <div className="text-right text-sm">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                />
                Show Password
              </label>
            </div>
            {error && <Alert variant="error" message={error} />}
            <Button
              label={isSignup ? 'Sign Up' : 'Login'}
              isLoading={loading}
              onClick={handleSubmit}
              className="w-full"
            />
            <div className="text-center text-sm text-gray-600">or continue with</div>
            <div className="flex justify-center gap-4">
              <button onClick={() => handleOAuth('google')}><FcGoogle size={24} /></button>
              <button onClick={() => handleOAuth('microsoft')}><FaMicrosoft size={24} /></button>
            </div>
            <div className="text-center text-sm">
              {isSignup ? 'Already have an account?' : "Don't have an account?"}
              <button
                className="ml-1 text-blue-600 hover:underline"
                onClick={() => {
                  setError('');
                  setForm({ fullName: '', email: '', password: '', confirmPassword: '' });
                  setIsSignup(!isSignup);
                }}
              >
                {isSignup ? 'Log In' : 'Sign Up'}
              </button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
