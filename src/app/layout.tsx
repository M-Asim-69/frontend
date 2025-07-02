'use client';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookies = Cookies;
  const router = useRouter();

  const [user, setUser] = useState<{ username?: string; profileImage?: string }>({});
  const [menuOpen, setMenuOpen] = useState(false);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const u = localStorage.getItem('user');
      if (u) setUser(JSON.parse(u));
    }
  }, []);

  // Prevent background scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => document.body.classList.remove('overflow-hidden');
  }, [menuOpen]);

  const handleLogout = () => {
    cookies.remove('authToken');
    router.push('/login');
    setMenuOpen(false);
    toast.success('Logout successful!');
  };

  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-slate-100 max-h-screen min-h-screen text-slate-900`}
      >
        <Toaster position="top-center" />
        <nav className="sticky top-0 z-40 w-full bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 shadow-lg py-3 px-4 md:px-8 flex items-center justify-between rounded-b-2xl border-b border-blue-400">
          <a
            href="/chat"
            className="text-2xl font-extrabold text-white tracking-tight hover:text-sky-300 transition drop-shadow-lg"
          >
            <span className="inline-block align-middle mr-2">
              <svg className="w-7 h-7 inline-block" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </span>
            ChatApp
          </a>
          {/* Hamburger Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMenuOpen(true)}
              className="z-50 relative focus:outline-none"
              aria-label="Toggle Menu"
            >
              <div className="flex flex-col w-8 h-6 justify-between transition-transform duration-500">
                <span
                  className={`h-0.5 w-full bg-white rounded-full transform transition-all duration-500 ${
                    menuOpen ? "rotate-45 translate-y-1.5 bg-blue-400" : ""
                  }`}
                />
                <span
                  className={`h-0.5 w-full bg-white rounded-full transition-all duration-500 ${
                    menuOpen ? "opacity-0" : ""
                  }`}
                />
                <span
                  className={`h-0.5 w-full bg-white rounded-full transform transition-all duration-500 ${
                    menuOpen ? "-rotate-45 -translate-y-1.5 bg-blue-400" : ""
                  }`}
                />
              </div>
            </button>
          </div>
        </nav>

        {/* ToDesktop Style Fullscreen Menu */}
        <div
          className={`fixed inset-0 z-[9999] flex flex-col transition-all duration-300 ${
            menuOpen
              ? "bg-white opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Header with Logo and Close Button */}
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-3">
              {/* Logo matching your ChatApp branding */}
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <span className="text-lg font-semibold text-gray-900">ChatApp</span>
            </div>
            
            <button
              onClick={() => setMenuOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              aria-label="Close Menu"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 px-6">
            <nav className="space-y-1">
              <Link
                href="/chat"
                className="flex items-center px-4 py-4 text-gray-800 hover:bg-gray-50 rounded-lg transition-colors duration-200 font-medium text-base"
                onClick={() => setMenuOpen(false)}
              >
                Profile
              </Link>
              <Link
                href="/settings"
                className="flex items-center px-4 py-4 text-gray-800 hover:bg-gray-50 rounded-lg transition-colors duration-200 font-medium text-base"
                onClick={() => setMenuOpen(false)}
              >
                Settings
              </Link>
              
              <Link
                href="/help"
                className="flex items-center px-4 py-4 text-gray-800 hover:bg-gray-50 rounded-lg transition-colors duration-200 font-medium text-base"
                onClick={() => setMenuOpen(false)}
              >
                Help
              </Link>
              
              <Link
                href="/about"
                className="flex items-center px-4 py-4 text-gray-800 hover:bg-gray-50 rounded-lg transition-colors duration-200 font-medium text-base"
                onClick={() => setMenuOpen(false)}
              >
                About
              </Link>
              <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center px-4 py-3 bg-gray-50 rounded-lg mb-4">
                {user.profileImage ? (
                  <Image src={user.profileImage || "/default-avatar.png"} alt={user.username || "User"} className="w-10 h-10 rounded-full mr-3" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold mr-3">
                    {user.username?.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{user.username || "User"}</div>
                  <div className="text-xs text-gray-500">Logged in</div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={() => {
                  document.cookie =
                    "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                  handleLogout();
                }}
                className="w-full flex items-center px-4 py-4 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 font-medium text-base"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div> 
            </nav>

            {/* User Section */}

          </div>
        </div>

        <main>{children}</main>
      </body>
    </html>
  );
}  