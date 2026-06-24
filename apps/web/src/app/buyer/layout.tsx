import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout role="BUYER" theme="buyer">
      {children}
    </DashboardLayout>
  );
}
