'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/utils/firebaseClient';
import ProfileCard from '@/components/ProfileCard';
import CompanyEditor from '@/components/CompanyEditor';
import UserManagementModal from '@/components/UserManagementModal';
import { FaBuilding, FaUserCircle } from 'react-icons/fa';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Dialog from '@radix-ui/react-dialog';

export default function DashboardPage() {
  const { user, userData, logout, profile, refreshUserData, loading } = useAuth();
  const router = useRouter();
  const [companyData, setCompanyData] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCompanyOpen, setIsCompanyOpen] = useState(false);

  useEffect(() => {
    console.log('[Dashboard] Auth loading:', loading, '| User:', user);

    if (!loading && !user) {
      console.log('[Dashboard] Redirecting to /auth...');
      router.push('/auth');
    }
  }, [loading, user, router]);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        console.log('[Dashboard] Fetching company for:', userData.companyId);
        const docRef = doc(db, 'companies', userData.companyId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          console.log('[Dashboard] Company data loaded:', snap.data());
          setCompanyData({ id: snap.id, ...snap.data() });
        } else {
          console.warn('[Dashboard] Company not found.');
        }
      } catch (err) {
        console.error('[Dashboard] Firestore company read error:', err);
      }
    };

    if (!loading && userData?.role === 'Administrator') {
      fetchCompany();
    }
  }, [loading, userData]);

  if (loading) {
    console.log('[Dashboard] Waiting for auth...');
    return null;
  }

  if (!user || !userData) {
    console.warn('[Dashboard] Missing user or userData.');
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex items-center gap-4">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="hover:opacity-80 focus:outline-none">
                <FaUserCircle className="text-2xl text-gray-600" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content className="bg-white shadow-lg rounded-md p-2 text-sm text-gray-800 z-50" sideOffset={5}>
              <DropdownMenu.Item
                className="px-3 py-1 hover:bg-gray-100 cursor-pointer rounded"
                onClick={() => setIsProfileOpen(true)}
              >
                Edit Profile
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="px-3 py-1 hover:bg-gray-100 cursor-pointer rounded"
                onClick={logout}
              >
                Logout
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>

          {userData.role === 'Administrator' && (
            <>
              <button
                className="hover:opacity-80 focus:outline-none"
                onClick={() => setIsCompanyOpen(true)}
              >
                <FaBuilding className="text-xl text-gray-600" />
              </button>
              <UserManagementModal />
            </>
          )}
        </div>
      </div>

      <Dialog.Root open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-30" />
          <Dialog.Content className="fixed top-1/2 left-1/2 max-w-lg w-full -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 z-50">
            <ProfileCard
              user={user}
              userData={userData}
              refreshUserData={refreshUserData}
              onClose={() => setIsProfileOpen(false)}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={isCompanyOpen} onOpenChange={setIsCompanyOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-30" />
          <Dialog.Content className="fixed top-1/2 left-1/2 max-w-2xl w-full -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 z-50">
            <CompanyEditor company={companyData} onClose={() => setIsCompanyOpen(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
