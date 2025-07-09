// hooks/useAutoLogout.js
'use client';

import { useEffect } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

const useAutoLogout = (timeout = 3600000) => {
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    let timer;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        signOut(auth).then(() => {
          console.log('✅ Auto-signed out due to inactivity');
          router.push('/auth'); // redirect to login page
        });
      }, timeout);
    };

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    resetTimer(); // initial timer start

    return () => {
      clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [timeout, router]);
};

export default useAutoLogout;
