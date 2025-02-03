'use client';

import { useState } from 'react';
import algoliasearch from 'algoliasearch';
import {
  InstantSearch,
  SearchBox,
  Hits,
  Configure,
} from 'react-instantsearch';
import type { Hit } from 'instantsearch.js';
import { Search } from 'lucide-react';

// Initialize the Algolia client
const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '',
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || ''
);

interface ProductHit {
  name: string;
  description: string;
  price?: number;
  objectID: string;
}

// Hit component to display individual search results
function ProductHit({ hit }: { hit: Hit<ProductHit> }) {
  return (
    <div className="p-4 border border-[var(--border-color)] rounded-lg bg-[var(--card-bg)] hover:border-[var(--accent)] transition-colors">
      <h2 className="text-lg font-semibold text-[var(--foreground)]">{hit.name}</h2>
      <p className="text-[var(--text-secondary)] mt-2">{hit.description}</p>
      {hit.price && (
        <p className="mt-2 text-[var(--accent)] font-medium">${hit.price.toFixed(2)}</p>
      )}
    </div>
  );
}

export default function StorePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <InstantSearch searchClient={searchClient} indexName="products">
        <Configure hitsPerPage={8} />
        
        <div className="mb-12">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 text-[var(--text-secondary)] z-10" />
            <SearchBox
              placeholder="Type to Search The Persuasion Academy Store..."
              classNames={{
                root: 'relative',
                form: 'relative',
                input: 'w-full bg-transparent text-2xl py-4 pl-10 pr-2 border-b border-[var(--border-color)] focus:border-[var(--accent)] text-[var(--foreground)] focus:outline-none transition-colors duration-200 placeholder:text-[var(--text-secondary)]',
                submitIcon: 'hidden',
                reset: 'hidden',
              }}
            />
          </div>
        </div>

        <Hits<ProductHit>
          hitComponent={ProductHit}
          classNames={{
            root: 'relative',
            list: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
            item: 'transition-all duration-200 ease-in-out hover:-translate-y-1',
          }}
        />
      </InstantSearch>
    </div>
  );
} 