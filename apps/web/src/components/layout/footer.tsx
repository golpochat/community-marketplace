import { APP_NAME, PLATFORM_COUNTRY_NAME } from '@community-marketplace/config';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} {APP_NAME} · {PLATFORM_COUNTRY_NAME}. All rights reserved.
      </div>
    </footer>
  );
}
