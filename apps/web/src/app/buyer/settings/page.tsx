import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/buyer/profile?tab=preferences');
}
