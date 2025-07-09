'use client';

import React from 'react';
import useAutoLogout from '@/hooks/useAutoLogout';

export default function AutoLogoutClient({ timeout = 3600000 }) {
  useAutoLogout(timeout);
  return null; // no UI rendered
}
