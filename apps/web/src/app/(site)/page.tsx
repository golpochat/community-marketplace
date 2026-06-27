import { HeroSection } from '@/components/public/hero-section';
import { CategoryShortcuts } from '@/components/public/category-shortcuts';
import { FeaturedListings } from '@/components/public/featured-listings';
import { HowItWorks } from '@/components/public/how-it-works';
import { TrustSection } from '@/components/public/trust-section';
import { SocialProofBar } from '@/components/public/social-proof-bar';
import { FounderStorySection } from '@/components/public/founder-story-section';
import { LocalFeedSection } from '@/components/public/local-feed-section';
import { listingsService } from '@/services/listings.service';

export const metadata = { title: 'Home' };

export default async function HomePage() {
  const [categories, featuredListings, newestFallback] = await Promise.all([
    listingsService.getCategories(),
    listingsService.getFeatured({ placement: 'homepage', limit: 8 }),
    listingsService.search({ page: 1, limit: 8, sort: 'newest' }),
  ]);

  const featured =
    featuredListings.length > 0 ? featuredListings : newestFallback.data;

  return (
    <>
      <HeroSection />
      <SocialProofBar />
      <CategoryShortcuts categories={categories} />
      <LocalFeedSection />
      <FeaturedListings listings={featured} isPromoted={featuredListings.length > 0} />
      <FounderStorySection />
      <HowItWorks />
      <TrustSection />
    </>
  );
}
