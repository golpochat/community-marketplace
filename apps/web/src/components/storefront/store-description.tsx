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
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-900">About this store</h2>
      <p className="mt-3 text-gray-700">{description}</p>
      <p className="mt-4 text-sm text-gray-500">Member since {memberSince}</p>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{analytics.totalViews}</p>
          <p className="text-xs text-gray-500">Views</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{analytics.totalSales}</p>
          <p className="text-xs text-gray-500">Sales</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{analytics.averageRating}</p>
          <p className="text-xs text-gray-500">Rating</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{analytics.reviewCount}</p>
          <p className="text-xs text-gray-500">Reviews</p>
        </div>
      </div>
    </div>
  );
}
