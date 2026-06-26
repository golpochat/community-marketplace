import { AdminSellerVerificationGuard } from '@/components/admin/seller-verification/admin-seller-verification-guard';

export default function SellerVerificationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminSellerVerificationGuard>{children}</AdminSellerVerificationGuard>;
}
