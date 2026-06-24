import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout role="SUPER_ADMIN" theme="superAdmin">
      {children}
    </DashboardLayout>
  );
}
