#!/usr/bin/env npx ts-node

/**
 * Build Search Database Script
 *
 * Creates a JSON file from the curated products for the Lambda search function.
 * This file is bundled with the Lambda deployment package.
 *
 * Usage:
 *   npx ts-node scripts/build-search-db.ts [--limit=N]
 *
 * Options:
 *   --limit=N  Only include the first N products (useful for testing)
 *
 * Prerequisites:
 *   - Run curate-products.ts first to generate curated-products.json
 */

import * as fs from 'fs';
import * as path from 'path';

interface CuratedProduct {
  barcode: string;
  brand: string;
  product_name: string;
  quantity: string;
  image_url: string;
  energy_kcal_100g?: number;
  sugars_100g?: number;
}

const DATA_DIR = path.join(__dirname, '../data');
const INPUT_FILE = path.join(DATA_DIR, 'curated-products.json');
const OUTPUT_FILE = path.join(__dirname, '../packages/backend/products.json');

function parseArgs(): { limit?: number } {
  const args: { limit?: number } = {};
  for (const arg of process.argv.slice(2)) {
    const limitMatch = arg.match(/^--limit=(\d+)$/);
    if (limitMatch) {
      args.limit = parseInt(limitMatch[1], 10);
    }
  }
  return args;
}

function main() {
  const args = parseArgs();
  console.log('=== Building Product Search Data ===\n');

  // Check if input file exists
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`
Input file not found: ${INPUT_FILE}

Please run the curation script first:
  npx ts-node scripts/curate-products.ts
`);
    process.exit(1);
  }

  // Load curated products
  console.log('Loading curated products...');
  const products: CuratedProduct[] = JSON.parse(
    fs.readFileSync(INPUT_FILE, 'utf-8')
  );
  console.log(`  Loaded ${products.length} products`);

  // Filter out products without essential data and clean up
  console.log('Cleaning and filtering products...');
  const cleanProducts = products
    .filter((p) => p.barcode && (p.product_name || p.brand))
    .map((p) => {
      const cleaned: CuratedProduct = {
        barcode: p.barcode.trim(),
        brand: (p.brand || '').trim(),
        product_name: (p.product_name || '').trim(),
        quantity: (p.quantity || '').trim(),
        image_url: (p.image_url || '').trim(),
      };
      // Pass through nutrition data if present
      if (p.energy_kcal_100g !== undefined) cleaned.energy_kcal_100g = p.energy_kcal_100g;
      if (p.sugars_100g !== undefined) cleaned.sugars_100g = p.sugars_100g;
      return cleaned;
    });

  console.log(`  Kept ${cleanProducts.length} products after filtering`);

  // Sort by brand and name for consistent output
  // When using --limit, prioritize products with S3 images first
  cleanProducts.sort((a, b) => {
    // S3 images come first (for testing with limit)
    const aHasS3 = a.image_url.includes('s3.eu-west-2.amazonaws.com');
    const bHasS3 = b.image_url.includes('s3.eu-west-2.amazonaws.com');
    if (aHasS3 && !bHasS3) return -1;
    if (!aHasS3 && bHasS3) return 1;

    const brandCompare = a.brand.localeCompare(b.brand);
    if (brandCompare !== 0) return brandCompare;
    return a.product_name.localeCompare(b.product_name);
  });

  // Apply limit if specified
  let outputProducts = cleanProducts;
  if (args.limit && args.limit > 0) {
    outputProducts = cleanProducts.slice(0, args.limit);
    console.log(`  Limited to ${outputProducts.length} products (--limit=${args.limit})`);
  }

  // Write output file
  console.log(`Writing to ${OUTPUT_FILE}...`);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputProducts));

  // Get file size
  const stats = fs.statSync(OUTPUT_FILE);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  // Sample some products for verification
  console.log('\nSample products:');
  if (args.limit) {
    // Show first few products when using limit
    for (const p of outputProducts.slice(0, Math.min(5, outputProducts.length))) {
      console.log(`  - ${p.brand} ${p.product_name}`);
    }
  } else {
    const sampleBrands = ['nutella', 'bonne maman', 'dr. oetker'];
    for (const brand of sampleBrands) {
      const matches = outputProducts.filter((p) =>
        p.brand.toLowerCase().includes(brand) ||
        p.product_name.toLowerCase().includes(brand)
      );
      if (matches.length > 0) {
        console.log(`  "${brand}": ${matches.length} products`);
        console.log(`    - ${matches[0].brand} ${matches[0].product_name}`);
      }
    }
  }

  console.log(`\n=== Build Complete ===`);
  console.log(`  Output: ${OUTPUT_FILE}`);
  console.log(`  Size: ${sizeMB} MB`);
  console.log(`  Products: ${outputProducts.length}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Deploy: npm run deploy`);
  console.log(`  2. Test: curl "https://YOUR_API/products/search?q=nutella"`);
}

main();
