import { Logo } from '@/components/brand/logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-12">
      <Logo variant="auth" size="auth" className="mb-8" />
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
