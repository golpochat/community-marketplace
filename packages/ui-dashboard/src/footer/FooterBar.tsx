export interface FooterBarProps {
  copyright?: string;
}

export function FooterBar({ copyright }: FooterBarProps) {
  const year = new Date().getFullYear();
  const text = copyright ?? `© ${year} Community Marketplace. All rights reserved.`;

  return (
    <footer className="shrink-0 border-t border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-topbar-bg))] px-4 py-2">
      <p className="text-center text-xs text-[hsl(var(--dashboard-sidebar-muted))]">{text}</p>
    </footer>
  );
}
