#!/usr/bin/env npx ts-node

/**
 * Curate Products Script
 *
 * Downloads Open Food Facts data, filters for baking-related products,
 * downloads product images, and uploads them to S3.
 *
 * Usage:
 *   npx ts-node scripts/curate-products.ts --dry-run              # Preview all products
 *   npx ts-node scripts/curate-products.ts --dry-run --uk-only    # Preview UK products only
 *   npx ts-node scripts/curate-products.ts --uk-only              # Full run, UK only
 *   npx ts-node scripts/curate-products.ts                        # Full run, all countries
 *
 * Prerequisites:
 *   - AWS credentials configured (for full run)
 *   - Download Open Food Facts CSV export first:
 *     wget https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz
 *     gunzip en.openfoodfacts.org.products.csv.gz
 */

// Parse command line arguments
const DRY_RUN = process.argv.includes('--dry-run');
const UK_ONLY = process.argv.includes('--uk-only');
const LIMIT_ARG = process.argv.find(arg => arg.startsWith('--limit='));
const IMAGE_LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1], 10) : 0;

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

// Baking-related category keywords to filter products
const BAKING_CATEGORY_KEYWORDS = [
  // Spreads and jams
  'jam',
  'jams',
  'preserve',
  'preserves',
  'spread',
  'spreads',
  'marmalade',
  'marmalades',
  'confiture',
  'confitures',
  'fruit-spread',
  'compote',

  // Chocolate and cocoa
  'chocolate',
  'chocolates',
  'cocoa',
  'cacao',
  'chocolate-chip',
  'chocolate-chips',
  'baking-chocolate',
  'dark-chocolate',
  'milk-chocolate',
  'white-chocolate',

  // Baking essentials
  'baking',
  'baking-ingredient',
  'baking-ingredients',
  'baking-powder',
  'baking-soda',
  'bicarbonate',
  'yeast',
  'yeasts',
  'levure',

  // Flours and starches
  'flour',
  'flours',
  'wheat-flour',
  'all-purpose-flour',
  'bread-flour',
  'cake-flour',
  'pastry-flour',
  'cornstarch',
  'corn-starch',
  'starch',
  'farine',

  // Sugars and sweeteners
  'sugar',
  'sugars',
  'brown-sugar',
  'powdered-sugar',
  'icing-sugar',
  'confectioners-sugar',
  'caster-sugar',
  'granulated-sugar',
  'cane-sugar',
  'sweetener',
  'sweeteners',

  // Dairy for baking
  'butter',
  'butters',
  'unsalted-butter',
  'salted-butter',
  'cream',
  'creams',
  'heavy-cream',
  'whipping-cream',
  'cream-cheese',
  'mascarpone',
  'sour-cream',

  // Nuts and dried fruits
  'nut',
  'nuts',
  'almond',
  'almonds',
  'hazelnut',
  'hazelnuts',
  'walnut',
  'walnuts',
  'pecan',
  'pecans',
  'pistachio',
  'pistachios',
  'cashew',
  'cashews',
  'dried-fruit',
  'dried-fruits',
  'raisin',
  'raisins',
  'currant',
  'currants',
  'cranberry',
  'cranberries',
  'date',
  'dates',

  // Extracts and flavorings
  'vanilla',
  'vanilla-extract',
  'extract',
  'extracts',
  'flavoring',
  'flavorings',
  'essence',
  'essences',
  'almond-extract',
  'lemon-extract',

  // Syrups and liquid sweeteners
  'honey',
  'honeys',
  'maple-syrup',
  'maple',
  'molasses',
  'treacle',
  'golden-syrup',
  'corn-syrup',
  'agave',

  // Condensed and evaporated milk
  'condensed-milk',
  'evaporated-milk',
  'sweetened-condensed-milk',

  // Decorations and frostings
  'sprinkle',
  'sprinkles',
  'frosting',
  'frostings',
  'icing',
  'icings',
  'food-coloring',
  'food-color',
  'fondant',
  'marzipan',
  'glaze',

  // Pie fillings and toppings
  'pie-filling',
  'filling',
  'fillings',
  'topping',
  'toppings',
  'caramel',
  'dulce-de-leche',
  'praline',

  // Leavening agents
  'cream-of-tartar',
  'tartar',

  // Nut butters (for baking)
  'peanut-butter',
  'almond-butter',
  'nut-butter',
  'tahini',

  // Coconut products
  'coconut',
  'coconut-milk',
  'coconut-cream',
  'coconut-oil',
  'desiccated-coconut',
  'shredded-coconut',

  // Oats and grains for baking
  'oat',
  'oats',
  'rolled-oats',
  'oatmeal',

  // Gelatin and thickeners
  'gelatin',
  'gelatine',
  'pectin',
  'agar',

  // Seeds
  'poppy-seed',
  'poppy-seeds',
  'sesame',
  'sesame-seeds',
  'sunflower-seeds',
  'chia',
  'flax',
  'flaxseed',

  // Biscuits and cookies
  'biscuit',
  'biscuits',
  'cookie',
  'cookies',
  'shortbread',
  'digestive',
  'digestives',
  'bourbon',
  'custard-cream',
  'rich-tea',
  'hobnob',
  'hobnobs',
  'oreo',
  'oreos',
  'wafer',
  'wafers',
  'cracker',
  'crackers',
  'graham-cracker',
  'graham-crackers',
  'jammie-dodger',
  'jammie-dodgers',
  'jammy-dodger',
  'jammy-dodgers',
];

// Brand keywords that indicate baking products
const BAKING_BRAND_KEYWORDS = [
  'bonne maman',
  'nutella',
  'ferrero',
  'lindt',
  'ghirardelli',
  'valrhona',
  'callebaut',
  'hershey',
  'nestle',
  'philadelphia',
  'lurpak',
  'kerrygold',
  'anchor',
  'president',
  'wilton',
  'dr. oetker',
  'dr oetker',
  'betty crocker',
  'pillsbury',
  'duncan hines',
  'bob\'s red mill',
  'king arthur',
  'nielsen-massey',
  'mccormick',
  'lyle\'s',
  'rowse',
  'tate & lyle',
  'oreo',
  'mcvitie',
  'mcvities',
  'fox\'s',
  'burton\'s',
  'burtons',
  'maryland',
  'lotus',
  'biscoff',
  'cadbury',
  'milka',
  'jammie dodger',
];

interface Product {
  barcode: string;
  brand: string;
  productName: string;
  quantity: string;
  categories: string;
  imageUrl: string;
}

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
const OUTPUT_FILE = path.join(DATA_DIR, 'curated-products.json');
const CSV_FILE = path.join(__dirname, 'en.openfoodfacts.org.products.csv');

// S3 configuration
const S3_BUCKET = process.env.PRODUCT_IMAGES_BUCKET || 'proofed-product-images-135753342791-eu-west-2';
const S3_REGION = process.env.AWS_REGION || 'eu-west-2';

const s3Client = new S3Client({ region: S3_REGION });

function matchesBakingCategory(categories: string): boolean {
  if (!categories) return false;
  const lowerCategories = categories.toLowerCase();
  return BAKING_CATEGORY_KEYWORDS.some((keyword) =>
    lowerCategories.includes(keyword)
  );
}

function matchesBakingBrand(brand: string): boolean {
  if (!brand) return false;
  const lowerBrand = brand.toLowerCase();
  return BAKING_BRAND_KEYWORDS.some((keyword) => lowerBrand.includes(keyword));
}

function matchesCountryFilter(countries: string): boolean {
  if (!UK_ONLY) return true;
  if (!countries) return false;
  const lowerCountries = countries.toLowerCase();
  return lowerCountries.includes('united kingdom') || lowerCountries.includes('uk');
}

async function downloadImage(
  url: string,
  barcode: string
): Promise<string | null> {
  try {
    const s3Key = `images/${barcode}.jpg`;

    // Check if image already exists in S3
    try {
      await s3Client.send(
        new HeadObjectCommand({
          Bucket: S3_BUCKET,
          Key: s3Key,
        })
      );
      // Image already exists
      return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${s3Key}`;
    } catch {
      // Image doesn't exist, need to download
    }

    // Download image from Open Food Facts
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`  Failed to download image for ${barcode}: ${response.status}`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: s3Key,
        Body: buffer,
        ContentType: 'image/jpeg',
      })
    );

    return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${s3Key}`;
  } catch (error) {
    console.log(`  Error processing image for ${barcode}:`, error);
    return null;
  }
}

interface DryRunStats {
  totalLines: number;
  matchCount: number;
  withImages: number;
  withoutImages: number;
  samples: CuratedProduct[];
  brandCounts: Map<string, number>;
}

async function processCSVDryRun(): Promise<DryRunStats> {
  if (!fs.existsSync(CSV_FILE)) {
    console.error(`CSV file not found: ${CSV_FILE}`);
    process.exit(1);
  }

  console.log('Reading Open Food Facts CSV (dry-run mode)...');
  if (UK_ONLY) {
    console.log('  Filtering for UK products only');
  }

  const stats: DryRunStats = {
    totalLines: 0,
    matchCount: 0,
    withImages: 0,
    withoutImages: 0,
    samples: [],
    brandCounts: new Map(),
  };

  const fileStream = fs.createReadStream(CSV_FILE);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let headerMap: Record<string, number> = {};

  for await (const line of rl) {
    stats.totalLines++;

    if (stats.totalLines === 1) {
      const headers = line.split('\t');
      headers.forEach((h, i) => {
        headerMap[h] = i;
      });
      continue;
    }

    if (stats.totalLines % 500000 === 0) {
      console.log(`  Processed ${stats.totalLines.toLocaleString()} lines, found ${stats.matchCount.toLocaleString()} matches...`);
    }

    const fields = line.split('\t');

    const barcode = fields[headerMap['code']] || '';
    const productName = fields[headerMap['product_name']] || '';
    const brand = fields[headerMap['brands']] || '';
    const quantity = fields[headerMap['quantity']] || '';
    const categories = fields[headerMap['categories_en']] || fields[headerMap['categories']] || '';
    const countries = fields[headerMap['countries_en']] || fields[headerMap['countries']] || '';
    const imageUrl = fields[headerMap['image_front_small_url']] || fields[headerMap['image_small_url']] || '';
    const energyKcal = fields[headerMap['energy-kcal_100g']] || '';
    const sugars = fields[headerMap['sugars_100g']] || '';

    if (!barcode || !productName) continue;

    // Check country filter first
    if (!matchesCountryFilter(countries)) continue;

    const isBakingProduct =
      matchesBakingCategory(categories) || matchesBakingBrand(brand);

    if (isBakingProduct) {
      stats.matchCount++;

      if (imageUrl) {
        stats.withImages++;
      } else {
        stats.withoutImages++;
      }

      // Track brand counts
      if (brand) {
        const lowerBrand = brand.toLowerCase().split(',')[0].trim();
        stats.brandCounts.set(lowerBrand, (stats.brandCounts.get(lowerBrand) || 0) + 1);
      }

      // Keep first 20 samples only
      if (stats.samples.length < 20) {
        const product: CuratedProduct = {
          barcode,
          brand,
          product_name: productName,
          quantity,
          image_url: imageUrl,
        };
        // Add nutrition data if available
        const kcal = parseFloat(energyKcal);
        const sugar = parseFloat(sugars);
        if (!isNaN(kcal) && kcal > 0) product.energy_kcal_100g = Math.round(kcal);
        if (!isNaN(sugar) && sugar >= 0) product.sugars_100g = Math.round(sugar * 10) / 10;
        stats.samples.push(product);
      }
    }
  }

  return stats;
}

async function processCSV(): Promise<CuratedProduct[]> {
  // Check if CSV file exists
  if (!fs.existsSync(CSV_FILE)) {
    console.error(`
CSV file not found: ${CSV_FILE}

Please download the Open Food Facts dataset first:
  cd scripts
  wget https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz
  gunzip en.openfoodfacts.org.products.csv.gz
`);
    process.exit(1);
  }

  console.log('Reading Open Food Facts CSV...');
  if (UK_ONLY) {
    console.log('  Filtering for UK products only');
  }

  const products: CuratedProduct[] = [];
  let lineCount = 0;
  let matchCount = 0;

  const fileStream = fs.createReadStream(CSV_FILE);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let headers: string[] = [];
  let headerMap: Record<string, number> = {};

  for await (const line of rl) {
    lineCount++;

    if (lineCount === 1) {
      // Parse headers
      headers = line.split('\t');
      headers.forEach((h, i) => {
        headerMap[h] = i;
      });
      continue;
    }

    // Progress indicator
    if (lineCount % 100000 === 0) {
      console.log(`  Processed ${lineCount} lines, found ${matchCount} matches...`);
    }

    const fields = line.split('\t');

    const barcode = fields[headerMap['code']] || '';
    const productName = fields[headerMap['product_name']] || '';
    const brand = fields[headerMap['brands']] || '';
    const quantity = fields[headerMap['quantity']] || '';
    const categories = fields[headerMap['categories_en']] || fields[headerMap['categories']] || '';
    const countries = fields[headerMap['countries_en']] || fields[headerMap['countries']] || '';
    const imageUrl = fields[headerMap['image_front_small_url']] || fields[headerMap['image_small_url']] || '';
    const energyKcal = fields[headerMap['energy-kcal_100g']] || '';
    const sugars = fields[headerMap['sugars_100g']] || '';

    // Skip if no name or barcode
    if (!barcode || !productName) continue;

    // Check country filter
    if (!matchesCountryFilter(countries)) continue;

    // Check if product matches baking categories or brands
    const isBakingProduct =
      matchesBakingCategory(categories) || matchesBakingBrand(brand);

    if (isBakingProduct) {
      matchCount++;
      const product: CuratedProduct = {
        barcode,
        brand,
        product_name: productName,
        quantity,
        image_url: imageUrl, // We'll update this after downloading
      };
      // Add nutrition data if available
      const kcal = parseFloat(energyKcal);
      const sugar = parseFloat(sugars);
      if (!isNaN(kcal) && kcal > 0) product.energy_kcal_100g = Math.round(kcal);
      if (!isNaN(sugar) && sugar >= 0) product.sugars_100g = Math.round(sugar * 10) / 10;
      products.push(product);
    }
  }

  console.log(`\nFound ${matchCount} baking-related products out of ${lineCount} total.`);
  return products;
}

async function downloadImages(products: CuratedProduct[]): Promise<CuratedProduct[]> {
  if (IMAGE_LIMIT > 0) {
    console.log(`\nDownloading product images to S3 (limited to ${IMAGE_LIMIT} images)...`);
  } else {
    console.log('\nDownloading product images to S3...');
  }

  const updatedProducts: CuratedProduct[] = [];
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];

    if ((i + 1) % 100 === 0) {
      console.log(`  Progress: ${i + 1}/${products.length} (downloaded: ${downloaded}, skipped: ${skipped}, failed: ${failed})`);
    }

    // Check if we've hit the image download limit
    if (IMAGE_LIMIT > 0 && downloaded >= IMAGE_LIMIT) {
      // Keep remaining products with original URLs
      updatedProducts.push(product);
      continue;
    }

    if (!product.image_url) {
      skipped++;
      // Keep product but with no image
      updatedProducts.push(product);
      continue;
    }

    const s3Url = await downloadImage(product.image_url, product.barcode);

    if (s3Url) {
      downloaded++;
      updatedProducts.push({
        ...product,
        image_url: s3Url,
      });
    } else {
      failed++;
      // Keep product but with original URL (or empty)
      updatedProducts.push({
        ...product,
        image_url: '',
      });
    }

    // Rate limit to avoid overwhelming Open Food Facts servers
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  console.log(`\nImage download complete:`);
  console.log(`  Downloaded: ${downloaded}`);
  console.log(`  Skipped (no image): ${skipped}`);
  console.log(`  Failed: ${failed}`);
  if (IMAGE_LIMIT > 0 && downloaded >= IMAGE_LIMIT) {
    console.log(`  (Limited to ${IMAGE_LIMIT} images - remaining products kept with original URLs)`);
  }

  return updatedProducts;
}

async function main() {
  console.log('=== Open Food Facts Product Curation ===\n');

  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No cloud operations will be performed\n');

    const stats = await processCSVDryRun();

    // Calculate estimated file size (approx 150 bytes per product)
    const estimatedSizeBytes = stats.matchCount * 150;
    const estimatedSizeMB = (estimatedSizeBytes / (1024 * 1024)).toFixed(2);

    // Get top brands
    const topBrands = Array.from(stats.brandCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);

    console.log('\n' + '='.repeat(50));
    console.log('DRY RUN SUMMARY');
    console.log('='.repeat(50));
    console.log(`\n📊 Product Statistics:`);
    console.log(`   Total lines scanned: ${stats.totalLines.toLocaleString()}`);
    console.log(`   Matching products: ${stats.matchCount.toLocaleString()}`);
    console.log(`   With images: ${stats.withImages.toLocaleString()}`);
    console.log(`   Without images: ${stats.withoutImages.toLocaleString()}`);
    console.log(`\n💾 Estimated File Size:`);
    console.log(`   JSON (products.json): ~${estimatedSizeMB} MB`);
    console.log(`\n☁️  S3 Upload Estimate:`);
    console.log(`   Images to upload: ${stats.withImages.toLocaleString()}`);
    console.log(`   Est. storage (assuming ~20KB/image): ~${((stats.withImages * 20) / 1024).toFixed(1)} MB`);
    console.log(`   Est. S3 cost: ~$${((stats.withImages * 20 / 1024 / 1024) * 0.023).toFixed(2)}/month`);

    console.log(`\n📝 Sample Products:`);
    stats.samples.slice(0, 15).forEach((p, i) => {
      const name = p.brand ? `${p.brand} - ${p.product_name}` : p.product_name;
      console.log(`   ${i + 1}. ${name.substring(0, 60)}${name.length > 60 ? '...' : ''}`);
    });

    console.log(`\n🏷️  Top 15 Brands:`);
    topBrands.forEach(([brand, count], i) => {
      console.log(`   ${i + 1}. ${brand}: ${count.toLocaleString()} products`);
    });

    console.log('\n' + '='.repeat(50));
    console.log('To proceed with full run (including S3 upload):');
    console.log('  npx ts-node scripts/curate-products.ts');
    console.log('='.repeat(50));

    return;
  }

  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Process CSV and filter products
  const products = await processCSV();

  // Download images to S3
  const productsWithImages = await downloadImages(products);

  // Save curated products
  console.log(`\nSaving ${productsWithImages.length} products to ${OUTPUT_FILE}...`);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(productsWithImages, null, 2));

  console.log('\nDone! Next steps:');
  console.log('  1. Run: npx ts-node scripts/build-search-db.ts');
  console.log('  2. Deploy: npm run deploy');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
