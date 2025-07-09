// components/RegisterPageClient.js
'use client';

import RegisterInviteModal from './RegisterInviteModal';

export default function RegisterPageClient({ invite }) {
  return <RegisterInviteModal invite={invite} />;
}
