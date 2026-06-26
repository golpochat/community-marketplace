import Link from 'next/link';

import type { Category } from '@community-marketplace/types';

import { getCategoryIcon } from '@/lib/category-icons';

interface CategoryShortcutsProps {
  categories: Category[];
}

export function CategoryShortcuts({ categories }: CategoryShortcutsProps) {
  return (
    <section id="categories" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-10">
      <h2 className="text-xl font-semibold text-gray-900">Shop by category</h2>
      <p className="mt-1 text-sm text-gray-600">Browse listings by what you are looking for</p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {categories.map((cat) => {
          const Icon = getCategoryIcon(cat);
          return (
            <Link
              key={cat.id}
              href={`/listings?categoryId=${cat.id}`}
              className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-3 text-left shadow-brand-sm transition-all duration-200 hover:border-primary/30 hover:shadow-brand-md sm:flex-col sm:items-center sm:px-4 sm:py-4 sm:text-center"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground sm:h-11 sm:w-11">
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="text-sm font-medium text-gray-900">{cat.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
