/** Legacy Account Verifications queue removed — use Seller Verification in the main web admin. */
export default function VerificationsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Verifications moved</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The legacy Account Verifications queue has been removed. Review seller identity under{' '}
        <strong>Seller Verification → Pending Requests</strong> in the main admin app
        (<code>/admin/seller-verification/pending</code>).
      </p>
    </div>
  );
}
