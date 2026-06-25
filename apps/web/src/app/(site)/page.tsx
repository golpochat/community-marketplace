import { HeroSection } from '@/components/public/hero-section';
import { CategoryShortcuts } from '@/components/public/category-shortcuts';
import { FeaturedListings } from '@/components/public/featured-listings';
import { HowItWorks } from '@/components/public/how-it-works';
import { TrustSection } from '@/components/public/trust-section';
import { listingsService } from '@/services/listings.service';

export const metadata = { title: 'Home' };

export default async function HomePage() {
  const [categories, featured] = await Promise.all([
    listingsService.getCategories(),
    listingsService.search({ page: 1, limit: 6, sort: 'newest' }),
  ]);

  return (
    <>
      <HeroSection />
      <CategoryShortcuts categories={categories} />
      <FeaturedListings listings={featured.data} />
      <HowItWorks />
      <TrustSection />
    </>
  );
}
