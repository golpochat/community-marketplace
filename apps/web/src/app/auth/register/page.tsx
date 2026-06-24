import Link from 'next/link';

import { RegisterForm } from '@/components/auth/register-form';

export const metadata = { title: 'Create Account' };

export default function RegisterPage() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-gray-900">Create account</h1>
      <p className="mt-2 text-sm text-gray-600">Join your local community marketplace</p>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/auth/login" className="font-medium text-primary hover:text-primary/90">
          Sign in
        </Link>
      </p>
    </div>
  );
}
