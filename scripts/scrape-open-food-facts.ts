import * as fs from 'fs';
import * as path from 'path';

interface OpenFoodFactsProduct {
  code: string;
  brands?: string;
  product_name?: string;
  quantity?: string;
  image_url?: string;
  image_front_url?: string;
  image_front_small_url?: string;
}

interface ProductSearchResult {
  barcode: string;
  brand: string;
  product_name: string;
  quantity: string;
  image_url: string;
}

// Baking-related categories to scrape
const CATEGORIES = [
  'flours',
  'sugars',
  'butters',
  'chocolates',
  'baking-chocolates',
  'cocoa-powders',
  'baking-powders',
  'yeasts',
  'vanilla-extracts',
  'vanilla',
  'eggs',
  'milks',
  'creams',
  'cream-cheeses',
  'margarines',
  'honeys',
  'maple-syrups',
  'golden-syrups',
  'treacles',
  'jams',
  'fruit-preserves',
  'nuts',
  'almonds',
  'walnuts',
  'hazelnuts',
  'pecans',
  'dried-fruits',
  'raisins',
  'sultanas',
  'currants',
  'chocolate-chips',
  'sprinkles',
  'food-colourings',
  'icing-sugars',
  'marzipans',
  'condensed-milks',
  'evaporated-milks',
  'coconut-milks',
  'desiccated-coconuts',
  'oats',
  'cornflours',
  'bicarbonate-of-sodas',
  'cream-of-tartars',
  'gelatins',
  'salts',
  'cinnamon',
  'nutmeg',
  'ginger-powder',
  'mixed-spices',
];

// Use UK Open Food Facts for British products
const BASE_URL = 'https://uk.openfoodfacts.org';

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchCategory(category: string, page: number = 1): Promise<OpenFoodFactsProduct[]> {
  const url = `${BASE_URL}/category/${category}/${page}.json`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ProofedApp/1.0 (baking recipe app)',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${category} page ${page}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error(`Error fetching ${category}:`, error);
    return [];
  }
}

function transformProduct(product: OpenFoodFactsProduct): ProductSearchResult | null {
  // Skip products without essential data
  if (!product.code || !product.product_name) {
    return null;
  }

  // Skip products with very short or generic names
  if (product.product_name.length < 3) {
    return null;
  }

  return {
    barcode: product.code,
    brand: product.brands?.split(',')[0]?.trim() || '',
    product_name: product.product_name.trim(),
    quantity: product.quantity?.trim() || '',
    image_url: product.image_front_small_url || product.image_front_url || product.image_url || '',
  };
}

async function scrapeAllProducts(): Promise<ProductSearchResult[]> {
  const allProducts = new Map<string, ProductSearchResult>();
  const pagesPerCategory = 5; // Fetch first 5 pages per category (20 products per page)

  for (const category of CATEGORIES) {
    console.log(`Scraping category: ${category}`);

    for (let page = 1; page <= pagesPerCategory; page++) {
      const products = await fetchCategory(category, page);

      if (products.length === 0) {
        break; // No more products in this category
      }

      for (const product of products) {
        const transformed = transformProduct(product);
        if (transformed && !allProducts.has(transformed.barcode)) {
          allProducts.set(transformed.barcode, transformed);
        }
      }

      console.log(`  Page ${page}: ${products.length} products (total: ${allProducts.size})`);

      // Be nice to the API - wait between requests
      await sleep(500);
    }
  }

  return Array.from(allProducts.values());
}

async function main() {
  console.log('Starting Open Food Facts scrape for baking products...\n');

  const products = await scrapeAllProducts();

  console.log(`\nTotal unique products: ${products.length}`);

  // Sort by brand then name for consistent ordering
  products.sort((a, b) => {
    const brandCompare = a.brand.localeCompare(b.brand);
    if (brandCompare !== 0) return brandCompare;
    return a.product_name.localeCompare(b.product_name);
  });

  // Write to products.json in backend package
  const outputPath = path.join(__dirname, '../packages/backend/products.json');
  fs.writeFileSync(outputPath, JSON.stringify(products, null, 2));

  console.log(`\nWritten to: ${outputPath}`);
  console.log('Remember to deploy the backend to include the new data!');
}

main().catch(console.error);
