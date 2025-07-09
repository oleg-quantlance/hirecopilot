// app/layout.js
import '../globals.css';
import { AuthProvider } from '@/context/AuthContext';
import AutoLogoutClient from '@/components/AutoLogoutClient';

export const metadata = {
  title: 'HireCopilot AI',
  description: 'Your AI-powered hiring assistant for SMBs.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans text-gray-800 bg-gradient-to-br from-gray-50 to-blue-50">
        <AuthProvider>
          <AutoLogoutClient timeout={60 * 60 * 1000} />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
