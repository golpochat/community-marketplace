import { redirect } from 'next/navigation';

/** Legacy Account Verifications queue removed — seller KYC lives here. */
export default function AdminVerificationsRedirectPage() {
  redirect('/admin/seller-verification/pending');
}
