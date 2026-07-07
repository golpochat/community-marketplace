export interface FooterBarProps {
  copyright?: string;
  brand?: string;
}

export function FooterBar({ copyright, brand }: FooterBarProps) {
  const year = new Date().getFullYear();
  const text = copyright ?? `© ${year} ${brand ?? 'Community Marketplace'}. All rights reserved.`;

  return (
    <footer className="shrink-0 border-t border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-topbar-bg))] px-3 py-2.5 sm:px-4">
      <p className="text-center text-[11px] leading-relaxed text-[hsl(var(--dashboard-sidebar-muted))] sm:text-xs">
        {text}
      </p>
    </footer>
  );
}
