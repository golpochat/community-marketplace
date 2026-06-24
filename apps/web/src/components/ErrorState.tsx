interface ErrorStateProps {
  message: string;
}

export function ErrorState({ message }: ErrorStateProps) {
  return <p className="mb-4 text-sm text-red-600">{message}</p>;
}
