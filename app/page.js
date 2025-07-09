// app/page.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../utils/firebaseClient';
import { Button } from '@/components/Button';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        router.push('/dashboard');
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) return <div className="min-h-screen bg-white" />;

  return (
    <main className="min-h-screen flex flex-col justify-center items-center px-4 bg-gradient-to-br from-white to-blue-50 text-center">
      <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Welcome to HireCopilot AI</h1>
      <p className="text-lg md:text-xl text-gray-600 mb-6 max-w-xl">
        Your AI-powered hiring assistant. Create job posts, shortlist applicants, and schedule interviews — all in one place.
      </p>
      <Button label="Log In" onClick={() => router.push('/auth')} variant="primary" className="px-6 py-3 text-lg" />
    </main>
  );
}
