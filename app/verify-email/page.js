// app/verify-email/page.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../../utils/firebaseClient';
import { sendEmailVerification, onAuthStateChanged } from 'firebase/auth';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Alert } from '@/components/Alert';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u && u.emailVerified) {
        router.push('/dashboard');
      } else {
        setUser(u);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleResend = async () => {
    if (!user) return;
    try {
      setSending(true);
      await sendEmailVerification(user);
      setMessage('Verification email resent successfully.');
    } catch (err) {
      setError('Failed to resend verification email.');
    } finally {
      setSending(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/auth');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <Card title="Verify Your Email">
          <p className="text-sm text-gray-600 mb-4">
            We’ve sent a verification link to <span className="font-medium">{user?.email}</span>.<br />
            Please check your inbox and click the link to verify your email.
          </p>

          {message && <Alert variant="success" message={message} />}
          {error && <Alert variant="error" message={error} />}

          <div className="flex flex-col gap-3 mt-4">
            <Button
              onClick={handleResend}
              isLoading={sending}
              label="Resend Verification Email"
              className="w-full"
            />
            <Button
              onClick={handleLogout}
              label="Back to Login"
              variant="secondary"
              className="w-full"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
