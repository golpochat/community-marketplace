export const EMAIL_IDENTITY_MESSAGES = {
  publicDuplicate:
    'An account with this email already exists. Sign in, or use a different email to create a new account.',
  publicOperatorBlocked:
    "This email can't be used for new sign-up. If you already have access, sign in. Otherwise use a different email or contact support.",
  invitationExistingMarketplace:
    'This email is already linked to a marketplace account. Admin access requires a separate email address.',
  invitationExistingOperator:
    'This email already has a panel operator account.',
  invitationAcceptBlocked:
    'This email is already linked to a marketplace account. This invitation can no longer be used.',
  profileEmailInUse:
    'This email is already linked to another account. Choose a different email.',
} as const;
