import { AdminLoginForm } from '@/components/auth/admin-login-form';

export const metadata = { title: 'Admin Sign In' };

export default function AdminLoginPage() {
  return (
    <div className="rounded-xl bg-white p-8 shadow-lg">
      <h1 className="text-2xl font-semibold text-foreground">Admin Sign In</h1>
      <p className="mt-2 text-sm text-gray-600">Access the Community Marketplace admin panel</p>
      <AdminLoginForm />
    </div>
  );
}
