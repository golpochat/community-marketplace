import Link from 'next/link';

import type { Category } from '@community-marketplace/types';

import { getCategoryIcon } from '@/lib/category-icons';

interface CategoryShortcutsProps {
  categories: Category[];
}

export function CategoryShortcuts({ categories }: CategoryShortcutsProps) {
  return (
    <section id="categories" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14 md:px-6">
      <div className="mb-8 max-w-2xl">
        <h2 className="text-section-title">Shop by category</h2>
        <p className="text-body mt-2">
          Browse listings by what you are looking for — from electronics to home &amp; garden.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {categories.map((cat) => {
          const Icon = getCategoryIcon(cat);
          return (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="group surface-section flex items-center gap-3 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-brand-md sm:flex-col sm:items-center sm:p-5 sm:text-center"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="text-sm font-semibold text-foreground">{cat.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
