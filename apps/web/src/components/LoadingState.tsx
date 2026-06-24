interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading…' }: LoadingStateProps) {
  return <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">{message}</p>;
}
