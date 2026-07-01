interface StoreUnavailableProps {
  message?: string;
}

export function StoreUnavailable({
  message = 'This seller is currently unavailable.',
}: StoreUnavailableProps) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <div className="rounded-full bg-muted p-4">
        <span className="text-2xl" aria-hidden>
          ⏸
        </span>
      </div>
      <h1 className="mt-6 text-xl font-semibold text-foreground">Store unavailable</h1>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
