'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email || null);
    });
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const isAuthPage = pathname === '/login' || pathname === '/signup';
  
  if (isAuthPage) {
    return null;
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center">
              <span className="text-xl font-bold text-blue-600">A&R Focus Forecast</span>
            </Link>
            <nav className="ml-10 flex space-x-4">
              <Link
                href="/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === '/dashboard'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/services"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname?.startsWith('/services')
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Services
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {userEmail && (
              <span className="text-sm text-slate-600">{userEmail}</span>
            )}
            <button
              onClick={handleSignOut}
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
