interface ReadReceiptsProps {
  readBy: string[];
  currentUserId: string;
}

export function ReadReceipts({ readBy, currentUserId }: ReadReceiptsProps) {
  const othersRead = readBy.filter((id) => id !== currentUserId).length > 0;
  if (!othersRead) return null;

  return <span className="text-xs opacity-70">· Read</span>;
}
