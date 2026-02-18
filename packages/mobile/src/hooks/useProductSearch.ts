import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

export interface ProductSearchResult {
  brand: string;
  productName: string;
  quantity: string;
  imageUrl?: string;
}

interface OpenFoodFactsProduct {
  brands?: string;
  product_name?: string;
  quantity?: string;
  image_front_small_url?: string;
}

interface OpenFoodFactsResponse {
  products: OpenFoodFactsProduct[];
}

async function searchProducts(query: string): Promise<ProductSearchResult[]> {
  const response = await fetch(
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=true&page_size=8`
  );

  if (!response.ok) {
    throw new Error('Failed to search products');
  }

  const data: OpenFoodFactsResponse = await response.json();

  return data.products
    .filter((p) => p.product_name || p.brands)
    .map((p) => ({
      brand: p.brands || '',
      productName: p.product_name || '',
      quantity: p.quantity || '',
      imageUrl: p.image_front_small_url,
    }));
}

export function useProductSearch(query: string) {
  // Debounce the query
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return useQuery({
    queryKey: ['product-search', debouncedQuery],
    queryFn: () => searchProducts(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 1,
  });
}

export function parseQuantity(quantity: string): { value: string; unit: string } {
  // Parse strings like "370 g", "500ml", "1 kg" into value and unit
  const match = quantity.match(/^([\d.,]+)\s*([a-zA-Z]+)?$/);
  if (match) {
    return {
      value: match[1].replace(',', '.'),
      unit: match[2]?.toLowerCase() || '',
    };
  }
  return { value: '', unit: '' };
}
