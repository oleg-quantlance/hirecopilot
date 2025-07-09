'use client';

import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { InputField } from './InputField';
import { Button } from './Button';
import { db, functions } from '@/utils/firebaseClient';
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '@/context/AuthContext';
import { getAuth } from 'firebase/auth';
import { FaShieldAlt } from 'react-icons/fa';

// Call this once in your component setup (e.g., useEffect or top level)
const adminFunctions = getFunctions();
const adminDeleteUser = httpsCallable(adminFunctions, 'adminDeleteUser');

export default function UserManagementModal() {
  const { userData: currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ fullName: '', email: '', role: 'User' });

  const isSelf = (userId) => currentUser?.uid === userId;

  useEffect(() => {
    if (!open) return;
    const fetchUsers = async () => {
      const q = query(collection(db, 'users'), where('companyId', '==', currentUser.companyId));
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => a.fullName.localeCompare(b.fullName));
      setUsers(data);
    };
    fetchUsers();
  }, [open, currentUser?.companyId]);

const handleDelete = async (id) => {
  if (isSelf(id)) return;

  try {
    await adminDeleteUser({ targetUid: id });
    setUsers(users.filter((u) => u.id !== id));
  } catch (error) {
    console.error('❌ Failed to delete user:', error);
    alert('Failed to delete user.');
  }
};

  const handleRoleChange = async (id, newRole) => {
    await updateDoc(doc(db, 'users', id), { role: newRole });
    setUsers(users.map((u) => (u.id === id ? { ...u, role: newRole } : u)));
  };

  const handleInvite = async () => {
    const auth = getAuth();
    const currentUserAuth = auth.currentUser;

    if (!currentUserAuth) {
      alert('You must be logged in to send invites.');
      return;
    }

    await currentUserAuth.getIdToken(true); // Ensures token is fresh

    const sendInvite = httpsCallable(functions, 'sendUserInvite');
    try {
      await sendInvite({
        ...form,
        companyId: currentUser.companyId,
        baseUrl: window.location.origin,
      });
      setForm({ fullName: '', email: '', role: 'User' });
      setOpen(false);
    } catch (err) {
      console.error('Failed to send invite:', err);
      alert('Failed to send invite: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button title="User Management">
          <FaShieldAlt className="w-6 h-6 text-gray-600 hover:text-blue-600" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 w-[90vw] max-w-2xl p-6 bg-white rounded-xl shadow-xl -translate-x-1/2 -translate-y-1/2">
          <Dialog.Title className="text-xl font-semibold mb-4">User Management</Dialog.Title>

          <div className="space-y-2 mb-6">
            {users.map((user) => (
              <div key={user.id} className="flex justify-between items-center border-b py-2">
                <div>
                  <div className="font-medium">{user.fullName}</div>
                  <div className="text-sm text-gray-600">{user.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={isSelf(user.id)}
                  >
                    <option>User</option>
                    <option>Administrator</option>
                  </select>
                  {!isSelf(user.id) && (
                    <button onClick={() => handleDelete(user.id)} className="text-red-600 text-sm">
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Invite New User</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
              <InputField
                placeholder="Full Name"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
              <InputField
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <select
                className="border rounded px-2 py-1"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="User">User</option>
                <option value="Administrator">Administrator</option>
              </select>
            </div>
            <Button onClick={handleInvite}>Send Invite</Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
