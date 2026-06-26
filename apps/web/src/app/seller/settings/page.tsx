import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/seller/profile?tab=settings');
}
