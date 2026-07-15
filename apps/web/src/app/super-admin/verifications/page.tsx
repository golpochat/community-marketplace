import { redirect } from 'next/navigation';

/** Legacy Account Verifications queue removed — seller KYC lives here. */
export default function SuperAdminVerificationsRedirectPage() {
  redirect('/super-admin/seller-verification/pending');
}
