import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export const metadata = { title: 'Forgot password' };

export default function ForgotPasswordPage() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-semibold text-foreground">Forgot password</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We&apos;ll email you a secure link to choose a new password.
      </p>
      <ForgotPasswordForm />
    </div>
  );
}
