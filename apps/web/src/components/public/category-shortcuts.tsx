import Link from 'next/link';

import type { Category } from '@community-marketplace/types';

import { getCategoryIcon } from '@/lib/category-icons';

interface CategoryShortcutsProps {
  categories: Category[];
}

export function CategoryShortcuts({ categories }: CategoryShortcutsProps) {
  return (
    <section id="categories" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12">
      <h2 className="text-h2 text-gray-900">Shop by category</h2>
      <p className="mt-1 text-small text-gray-600">Browse listings by what you are looking for</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {categories.map((cat) => {
          const Icon = getCategoryIcon(cat);
          return (
            <Link
              key={cat.id}
              href={`/listings?categoryId=${cat.id}`}
              className="group flex flex-col items-center rounded-brand-md border border-gray-200 bg-white p-5 text-center shadow-brand-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-brand-md"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-brand-md bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="mt-3 text-small font-medium text-gray-900">{cat.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
