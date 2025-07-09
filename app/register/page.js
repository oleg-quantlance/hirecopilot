// app/register/page.js
import { notFound } from 'next/navigation';
import { db } from '@/utils/firebaseClient';
import { doc, getDoc } from 'firebase/firestore';
import RegisterPageClient from '@/components/RegisterPageClient';

export default async function RegisterPage({ searchParams }) {
  const token = searchParams.token;
  if (!token) notFound();

  let invite = null;

  try {
    const snap = await getDoc(doc(db, 'userInvites', token));
    if (snap.exists()) {
      const data = snap.data();
      const expiresAt = data.expiresAt?.toDate();

      if (expiresAt && expiresAt.getTime() > Date.now()) {
        invite = {
          id: snap.id,
          email: data.email,
          role: data.role,
          companyId: data.companyId,
          fullName: data.fullName || '',
          status: data.status || '',
          token: token,
          expiresAt: expiresAt.toISOString(),
          expiresAtFormatted: expiresAt.toLocaleString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          inviteSentAt: data.inviteSentAt?.toDate().toISOString() || null,
        };
      }
    }
  } catch (err) {
    console.error('Error loading invite:', err);
  }

  if (!invite) notFound();

  return <RegisterPageClient invite={invite} />;
}
