import * as fs from "fs";
import * as readline from "readline";
import * as path from "path";

interface Product {
  barcode: string;
  brand: string;
  product_name: string;
  quantity: string;
  image_url: string;
  nutrition?: {
    calories_per_100g: number;
    sugar_per_100g: number;
  };
}

interface NutritionData {
  calories: number;
  sugar: number;
}

const CSV_PATH = path.join(__dirname, "en.openfoodfacts.org.products.csv");
const PRODUCTS_PATH = path.join(
  __dirname,
  "../packages/backend/products.json"
);

// Column indices (0-based) from the CSV header
const CODE_COL = 0; // code (barcode)
const ENERGY_KCAL_COL = 89; // energy-kcal_100g (column 90 = index 89)
const SUGARS_COL = 130; // sugars_100g (column 131 = index 130)

async function buildNutritionMap(
  targetBarcodes: Set<string>
): Promise<Map<string, NutritionData>> {
  const nutritionMap = new Map<string, NutritionData>();

  console.log(`Loading nutrition data from CSV...`);
  console.log(`Looking for ${targetBarcodes.size} barcodes`);

  const fileStream = fs.createReadStream(CSV_PATH);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let lineCount = 0;
  let matchCount = 0;
  let headerSkipped = false;

  for await (const line of rl) {
    if (!headerSkipped) {
      headerSkipped = true;
      continue;
    }

    lineCount++;
    if (lineCount % 500000 === 0) {
      console.log(
        `  Processed ${(lineCount / 1000000).toFixed(1)}M rows, found ${matchCount} matches...`
      );
    }

    const columns = line.split("\t");
    const barcode = columns[CODE_COL];

    // Skip if not in our target set
    if (!targetBarcodes.has(barcode)) {
      continue;
    }

    const caloriesStr = columns[ENERGY_KCAL_COL];
    const sugarStr = columns[SUGARS_COL];

    const calories = parseFloat(caloriesStr);
    const sugar = parseFloat(sugarStr);

    // Only add if we have at least one valid nutrition value
    if (!isNaN(calories) || !isNaN(sugar)) {
      nutritionMap.set(barcode, {
        calories: isNaN(calories) ? 0 : calories,
        sugar: isNaN(sugar) ? 0 : sugar,
      });
      matchCount++;
    }

    // Early exit if we found all products
    if (matchCount >= targetBarcodes.size) {
      console.log(`  Found all ${matchCount} products, stopping early`);
      break;
    }
  }

  console.log(
    `Finished: processed ${(lineCount / 1000000).toFixed(1)}M rows, found ${matchCount} matches`
  );

  return nutritionMap;
}

async function main() {
  console.log("=== Enriching Products with Nutrition Data ===\n");

  // Load products
  console.log("Loading products.json...");
  const productsJson = fs.readFileSync(PRODUCTS_PATH, "utf-8");
  const products: Product[] = JSON.parse(productsJson);
  console.log(`Loaded ${products.length} products\n`);

  // Build set of target barcodes for fast lookup
  const targetBarcodes = new Set(products.map((p) => p.barcode));

  // Stream CSV and build nutrition map
  const nutritionMap = await buildNutritionMap(targetBarcodes);

  // Enrich products
  console.log("\nEnriching products...");
  let enrichedCount = 0;

  for (const product of products) {
    const nutrition = nutritionMap.get(product.barcode);
    if (nutrition) {
      product.nutrition = {
        calories_per_100g: nutrition.calories,
        sugar_per_100g: nutrition.sugar,
      };
      enrichedCount++;
    }
  }

  console.log(`Enriched ${enrichedCount} out of ${products.length} products`);
  console.log(
    `Coverage: ${((enrichedCount / products.length) * 100).toFixed(1)}%`
  );

  // Write enriched products
  console.log("\nWriting enriched products.json...");
  fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(products, null, 2));
  console.log("Done!");

  // Sample some enriched products
  console.log("\n=== Sample Enriched Products ===");
  const enriched = products.filter((p) => p.nutrition);
  for (let i = 0; i < Math.min(5, enriched.length); i++) {
    const p = enriched[i];
    console.log(
      `${p.product_name}: ${p.nutrition!.calories_per_100g} kcal, ${p.nutrition!.sugar_per_100g}g sugar`
    );
  }
}

main().catch(console.error);
