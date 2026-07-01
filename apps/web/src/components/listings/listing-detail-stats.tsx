interface ListingDetailStatsProps {
  viewCount: number;
  favoriteCount: number;
  className?: string;
}

export function ListingDetailStats({
  viewCount,
  favoriteCount,
  className,
}: ListingDetailStatsProps) {
  return (
    <div className={`flex gap-4 text-xs text-muted-foreground ${className ?? ''}`}>
      <span>{viewCount.toLocaleString('en-IE')} views</span>
      <span>{favoriteCount.toLocaleString('en-IE')} saves</span>
    </div>
  );
}
