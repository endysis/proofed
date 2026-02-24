import * as fs from 'fs';
import * as path from 'path';

export interface ProductSearchResult {
  barcode: string;
  brand: string;
  product_name: string;
  quantity: string;
  image_url: string;
}

interface ProductIndex {
  products: ProductSearchResult[];
  // Index for faster searching - maps lowercase terms to product indices
  termIndex: Map<string, Set<number>>;
}

// Cached product index (reused across Lambda invocations)
let productIndex: ProductIndex | null = null;

function buildTermIndex(products: ProductSearchResult[]): Map<string, Set<number>> {
  const index = new Map<string, Set<number>>();

  products.forEach((product, idx) => {
    // Index all words from brand and product name
    const text = `${product.brand} ${product.product_name}`.toLowerCase();
    const words = text.split(/\s+/).filter((w) => w.length >= 2);

    words.forEach((word) => {
      // Index full word and all prefixes (for prefix matching)
      for (let i = 2; i <= word.length; i++) {
        const prefix = word.slice(0, i);
        if (!index.has(prefix)) {
          index.set(prefix, new Set());
        }
        index.get(prefix)!.add(idx);
      }
    });
  });

  return index;
}

function loadProductIndex(): ProductIndex {
  if (productIndex) {
    return productIndex;
  }

  // In Lambda, the products.json file is bundled with the deployment package
  const productsPath = path.join(__dirname, '../products.json');

  try {
    const data = fs.readFileSync(productsPath, 'utf-8');
    const products: ProductSearchResult[] = JSON.parse(data);

    productIndex = {
      products,
      termIndex: buildTermIndex(products),
    };

    console.log(`Loaded ${products.length} products into search index`);
    return productIndex;
  } catch (error) {
    console.error('Failed to load products:', error);
    // Return empty index if file doesn't exist yet
    return {
      products: [],
      termIndex: new Map(),
    };
  }
}

/**
 * Search products using in-memory full-text search
 */
export async function searchProducts(
  query: string,
  limit: number = 10
): Promise<ProductSearchResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const index = loadProductIndex();
  if (index.products.length === 0) {
    return [];
  }

  // Split query into search terms
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 2);

  if (terms.length === 0) {
    return [];
  }

  // Find products matching all terms (intersection)
  let matchingIndices: Set<number> | null = null;

  for (let termIdx = 0; termIdx < terms.length; termIdx++) {
    const term = terms[termIdx];
    const termMatches = index.termIndex.get(term);

    if (!termMatches || termMatches.size === 0) {
      // No matches for this term, try prefix matching
      const prefixMatches = new Set<number>();
      const indexEntries = Array.from(index.termIndex.entries());
      for (let i = 0; i < indexEntries.length; i++) {
        const [prefix, indices] = indexEntries[i];
        if (prefix.startsWith(term)) {
          indices.forEach((idx) => prefixMatches.add(idx));
        }
      }

      if (prefixMatches.size === 0) {
        return []; // No matches for this term
      }

      if (matchingIndices === null) {
        matchingIndices = prefixMatches;
      } else {
        // Intersection
        const currentMatches = Array.from(matchingIndices);
        matchingIndices = new Set<number>();
        for (let i = 0; i < currentMatches.length; i++) {
          if (prefixMatches.has(currentMatches[i])) {
            matchingIndices.add(currentMatches[i]);
          }
        }
      }
    } else {
      if (matchingIndices === null) {
        matchingIndices = new Set(Array.from(termMatches));
      } else {
        // Intersection
        const currentMatches = Array.from(matchingIndices);
        matchingIndices = new Set<number>();
        for (let i = 0; i < currentMatches.length; i++) {
          if (termMatches.has(currentMatches[i])) {
            matchingIndices.add(currentMatches[i]);
          }
        }
      }
    }
  }

  if (!matchingIndices || matchingIndices.size === 0) {
    return [];
  }

  // Score and sort results by relevance
  const scoredResults: Array<{ product: ProductSearchResult; score: number }> = [];
  const matchArray = Array.from(matchingIndices);

  for (let i = 0; i < matchArray.length; i++) {
    const idx = matchArray[i];
    const product = index.products[idx];
    let score = 0;

    const text = `${product.brand} ${product.product_name}`.toLowerCase();

    // Boost exact matches
    for (let t = 0; t < terms.length; t++) {
      const term = terms[t];
      if (text.includes(term)) {
        score += 10;
        // Extra boost for match at start of word
        if (text.includes(` ${term}`) || text.startsWith(term)) {
          score += 5;
        }
      }
    }

    // Boost products with images
    if (product.image_url) {
      score += 2;
    }

    // Boost branded products
    if (product.brand) {
      score += 1;
    }

    scoredResults.push({ product, score });
  }

  // Sort by score descending
  scoredResults.sort((a, b) => b.score - a.score);

  return scoredResults.slice(0, limit).map((r) => r.product);
}

/**
 * Look up a product by exact barcode
 */
export async function getProductByBarcode(
  barcode: string
): Promise<ProductSearchResult | null> {
  if (!barcode || barcode.trim().length === 0) {
    return null;
  }

  const index = loadProductIndex();
  const trimmedBarcode = barcode.trim();

  const product = index.products.find((p) => p.barcode === trimmedBarcode);
  return product || null;
}
