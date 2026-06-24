import { PublicLayout } from '@/components/layout/public-layout';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}
