'use client';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookies = Cookies;
  const router = useRouter();

  const token = cookies.get('authToken');
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-slate-100 max-h-screen min-h-screen text-slate-900`}
      >
        <Toaster position="top-center" />
        <nav className="sticky top-0 z-40 w-full bg-blue-600 shadow-md py-4 px-8 flex items-center justify-between">
          <a
            href="/chat"
            className="text-2xl font-extrabold text-white tracking-tight hover:text-sky-400 transition"
          >
            ChatApp
          </a>
          {token ? (
            <button
              onClick={() => {
                cookies.remove('authToken');
                router.push('/login');
                toast.success('Logout successful!');
              }}
              className="ml-auto w-18 text-center mt-2 bg-red-500 hover:bg-red-700 text-white px-2 py-2 rounded-lg  transition font-medium"
            >
              Logout
            </button>
          ) : (
            <></>
          )}
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
