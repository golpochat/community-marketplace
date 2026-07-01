interface StoreDescriptionProps {
  description: string;
  memberSince: string;
  analytics: {
    totalViews: number;
    totalSales: number;
    averageRating: number;
    reviewCount: number;
  };
}

export function StoreDescription({ description, memberSince, analytics }: StoreDescriptionProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold text-foreground">About this store</h2>
      <p className="mt-3 text-foreground">{description}</p>
      <p className="mt-4 text-sm text-muted-foreground">Member since {memberSince}</p>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{analytics.totalViews}</p>
          <p className="text-xs text-muted-foreground">Views</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{analytics.totalSales}</p>
          <p className="text-xs text-muted-foreground">Sales</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{analytics.averageRating}</p>
          <p className="text-xs text-muted-foreground">Rating</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{analytics.reviewCount}</p>
          <p className="text-xs text-muted-foreground">Reviews</p>
        </div>
      </div>
    </div>
  );
}
