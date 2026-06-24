import Link from 'next/link';

import type { Category } from '@community-marketplace/types';

interface CategoryShortcutsProps {
  categories: Category[];
}

export function CategoryShortcuts({ categories }: CategoryShortcutsProps) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h2 className="text-xl font-semibold text-gray-900">Shop by category</h2>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/listings?categoryId=${cat.id}`}
            className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-4 text-center transition-shadow hover:shadow-md"
          >
            <span className="text-2xl" aria-hidden>
              {cat.icon ?? '📦'}
            </span>
            <span className="mt-2 text-sm font-medium text-gray-900">{cat.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
