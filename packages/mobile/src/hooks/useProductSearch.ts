import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../api/config';

export interface ProductSearchResult {
  brand: string;
  productName: string;
  quantity: string;
  imageUrl?: string;
}

interface ApiProduct {
  barcode: string;
  brand: string;
  product_name: string;
  quantity: string;
  image_url: string;
}

interface ProductSearchResponse {
  products: ApiProduct[];
}

const REQUEST_TIMEOUT_MS = 5000;

async function searchProducts(
  query: string,
  signal?: AbortSignal
): Promise<ProductSearchResult[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  // Use provided signal or our timeout controller
  const effectiveSignal = signal || controller.signal;

  // If external signal aborts, also abort our controller
  if (signal) {
    signal.addEventListener('abort', () => controller.abort());
  }

  try {
    const response = await fetch(
      `${API_BASE}/products/search?q=${encodeURIComponent(query)}&limit=10`,
      { signal: effectiveSignal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('Failed to search products');
    }

    const data: ProductSearchResponse = await response.json();

    return data.products
      .filter((p) => p.product_name || p.brand)
      .map((p) => ({
        brand: p.brand || '',
        productName: p.product_name || '',
        quantity: p.quantity || '',
        imageUrl: p.image_url || undefined,
      }));
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      return []; // Return empty on timeout/cancel
    }
    throw error;
  }
}

export function useProductSearch(query: string) {
  // Debounce the query
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300); // Reduced debounce since our API is faster

    return () => clearTimeout(timer);
  }, [query]);

  // Cancel stale requests when query changes
  useEffect(() => {
    // Abort any in-flight request when the debounced query changes
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedQuery]);

  return useQuery({
    queryKey: ['product-search', debouncedQuery],
    queryFn: () => searchProducts(debouncedQuery, abortControllerRef.current?.signal),
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
