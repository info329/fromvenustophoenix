import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Admin Panel</h1>
        <p className="text-slate-600 mt-2">Manage questionnaires, questions, dimensions, weights, and rules</p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-64 flex-shrink-0">
          <nav className="space-y-1">
            <Link
              href="/admin"
              className="block px-4 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Overview
            </Link>
            <Link
              href="/admin/questionnaires"
              className="block px-4 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Questionnaires
            </Link>
            <Link
              href="/admin/questions"
              className="block px-4 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Questions
            </Link>
            <Link
              href="/admin/dimensions"
              className="block px-4 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Dimensions
            </Link>
            <Link
              href="/admin/weights"
              className="block px-4 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Weights
            </Link>
            <Link
              href="/admin/rules"
              className="block px-4 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Rules
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
