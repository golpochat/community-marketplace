import { ContentPageShell } from '@/components/public/content-page-shell';

export const metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <ContentPageShell title="Privacy policy">
      <p>
        We collect account information (email, phone when verified, profile details) to operate the
        marketplace and protect the community. Messages and listings are stored securely and used
        only for platform features, moderation, and safety.
      </p>
      <p className="mt-4">
        We do not sell your personal data. Location is used to show nearby listings — you control
        what appears on your profile.
      </p>
      <p className="mt-4">
        Notification preferences can be updated in your account settings. Push alerts are limited to
        a few per day by default.
      </p>
      <p className="mt-4 text-sm text-gray-500">
        Full privacy documentation will be expanded as features launch.
      </p>
    </ContentPageShell>
  );
}
