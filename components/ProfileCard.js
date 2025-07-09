'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { Input } from './InputField';
import { Button } from './Button';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/utils/firebaseClient';

export default function ProfileCard({ user, userData, refreshUserData, onClose }) {
  const [fullName, setFullName] = useState(userData.fullName || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { fullName });
      await refreshUserData(user.uid);
      onClose(); // close dialog
    } catch (err) {
      console.error('❌ Error updating profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Content
          className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white max-w-lg w-full rounded-lg shadow-lg p-6"
          onInteractOutside={(e) => e.preventDefault()} // modal behavior
        >
          <Dialog.Title className="text-xl font-semibold mb-4">Edit Profile</Dialog.Title>

          <div className="space-y-4">
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <Input
              label="Email"
              value={user.email}
              readOnly
            />
            <Input
              label="Last Login"
              value={userData?.lastLogin?.toDate?.().toLocaleString?.() || '—'}
              readOnly
            />
          </div>

          <div className="flex justify-end mt-6 gap-3">
            <Button label="Cancel" onClick={onClose} variant="secondary" />
            <Button label="Save" onClick={handleSave} isLoading={saving} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
