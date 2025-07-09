'use client';

import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/utils/firebaseClient';
import { setDoc, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { InputField } from './InputField';
import { Button } from './Button';
import * as Dialog from '@radix-ui/react-dialog';
import { Check, X } from 'lucide-react';

export default function RegisterInviteModal({ invite }) {
  const [form, setForm] = useState({
    email: invite.email,
    fullName: '',
    password: '',
    confirmPassword: '',
  });
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCompanyName = async () => {
      try {
        const companyRef = doc(db, 'companies', invite.companyId);
        const companySnap = await getDoc(companyRef);
        if (companySnap.exists()) {
          setCompanyName(companySnap.data().name || invite.companyId);
        } else {
          setCompanyName(invite.companyId);
        }
      } catch (err) {
        console.error('Error loading company name:', err);
        setCompanyName(invite.companyId);
      }
    };

    fetchCompanyName();
  }, [invite.companyId]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const passwordChecks = {
    minLength: form.password.length >= 8,
    hasUpper: /[A-Z]/.test(form.password),
    hasLower: /[a-z]/.test(form.password),
    hasNumber: /[0-9]/.test(form.password),
    hasSpecial: /[^A-Za-z0-9]/.test(form.password),
  };

  const isStrongPassword = Object.values(passwordChecks).every(Boolean);

  const handleRegister = async () => {
    setLoading(true);
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!isStrongPassword) {
      setError('Password must meet all the strength requirements.');
      setLoading(false);
      return;
    }

    try {
      const { user } = await createUserWithEmailAndPassword(auth, form.email, form.password);

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        fullName: form.fullName,
        email: form.email,
        companyId: invite.companyId,
        role: invite.role,
        isInvited: true,
      });

      await deleteDoc(doc(db, 'userInvites', invite.id));

      console.log('[Register] Invite-based account created. Redirecting to /auth...');

      onAuthStateChanged(auth, (user) => {
        if (user) {
          window.location.href = '/auth';
        }
      });
    } catch (err) {
      console.error('[Register] Registration failed:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const Requirement = ({ label, passed }) => (
    <div className="flex items-center gap-2 text-sm">
      {passed ? <Check className="text-green-600 w-4 h-4" /> : <X className="text-red-600 w-4 h-4" />}
      <span className={passed ? 'text-green-700' : 'text-red-700'}>{label}</span>
    </div>
  );

  return (
    <Dialog.Root open>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 w-full max-w-md bg-white rounded-xl p-6 transform -translate-x-1/2 -translate-y-1/2 shadow-lg">
          <Dialog.Title className="text-xl font-bold mb-4">Accept Your Invite</Dialog.Title>

          <p className="text-sm mb-2 text-gray-600">
            You're joining <b>{companyName}</b> as a <b>{invite.role}</b>.
          </p>

          {invite.expiresAtFormatted && (
            <p className="text-sm text-gray-500 mb-4">
              This invite expires on <b>{invite.expiresAtFormatted}</b>.
            </p>
          )}

          <InputField
            label="Full Name"
            value={form.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
          />
          <InputField
            label="Email"
            value={form.email}
            disabled
          />
          <InputField
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => handleChange('password', e.target.value)}
          />
          <InputField
            label="Confirm Password"
            type="password"
            value={form.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
          />

          <div className="space-y-1 my-3">
            <Requirement label="At least 8 characters" passed={passwordChecks.minLength} />
            <Requirement label="One uppercase letter" passed={passwordChecks.hasUpper} />
            <Requirement label="One lowercase letter" passed={passwordChecks.hasLower} />
            <Requirement label="One number" passed={passwordChecks.hasNumber} />
            <Requirement label="One special character" passed={passwordChecks.hasSpecial} />
          </div>

          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

          <div className="flex justify-end mt-6">
            <Button onClick={handleRegister} loading={loading}>
              Register
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
