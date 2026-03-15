import OpenAI from 'openai';
import type {
  AiParseIngredientsRequest,
  AiParseIngredientsResponse,
  ParsedIngredientResult,
  MeasurementSystem,
} from '@proofed/shared';
import { getOpenAIApiKey } from '../lib/secrets';

function buildSystemPrompt(measurementSystem: MeasurementSystem): string {
  const conversionInstructions =
    measurementSystem === 'metric'
      ? `
MEASUREMENT CONVERSION (user prefers metric):
- Convert cups to grams:
  - 1 cup flour ≈ 120g
  - 1 cup sugar ≈ 200g
  - 1 cup butter ≈ 227g
  - 1 cup liquid ≈ 240ml
- Convert oz to g: 1 oz ≈ 28g
- Convert lb to kg: 1 lb ≈ 454g
- Keep tsp/tbsp as-is (universal)`
      : `
MEASUREMENT CONVERSION (user prefers imperial):
- Convert grams to cups/oz as appropriate:
  - 120g flour ≈ 1 cup
  - 200g sugar ≈ 1 cup
  - 227g butter ≈ 1 cup
  - 28g ≈ 1 oz
- Convert ml to fl oz or cups
- Keep tsp/tbsp as-is (universal)`;

  return `You are an expert baking ingredient parser. Parse each line and extract structured data.

INPUT FORMAT EXAMPLES:
- "600g Self Raising Flour" → quantity: 600, unit: "g", name: "Self Raising Flour"
- "1/4 tsp Sea Salt" → quantity: 0.25, unit: "tsp", name: "Sea Salt"
- "180g Buttermilk" → quantity: 180, unit: "g", name: "Buttermilk"
- "1.5tsp Vanilla Extract" → quantity: 1.5, unit: "tsp", name: "Vanilla Extract"
- "9 Large Eggs" → quantity: 9, unit: "large", name: "Eggs"
- "420g Unsalted Butter, Softened" → quantity: 420, unit: "g", name: "Unsalted Butter, Softened"
- "2 cups all-purpose flour" → quantity: 2, unit: "cup", name: "All-Purpose Flour"
- "a pinch of salt" → quantity: 1, unit: "pinch", name: "Salt"
- "salt to taste" → quantity: 0, unit: "to taste", name: "Salt"

PARSING RULES:
1. Handle stuck units (no space): "600g" → 600, "g"
2. Handle fractions: "1/4" → 0.25, "1 1/2" → 1.5, "½" → 0.5
3. Handle size descriptors: "Large", "Medium", "Small" become the unit
4. Capitalize ingredient names properly
5. Keep modifiers like "Softened", "Room Temperature" as part of name
${conversionInstructions}
Mark wasConverted: true if you converted the measurement.

OUTPUT JSON FORMAT:
{
  "ingredients": [
    {
      "name": "Self Raising Flour",
      "quantity": 600,
      "unit": "g",
      "originalLine": "600g Self Raising Flour",
      "confidence": "high",
      "wasConverted": false
    }
  ],
  "warnings": ["optional warnings about ambiguous inputs"]
}

CONFIDENCE LEVELS:
- "high": Clear quantity, unit, and name
- "medium": Minor ambiguity (e.g., assumed unit)
- "low": Significant ambiguity (e.g., "some flour")

IMPORTANT:
- Always return valid JSON
- Process each non-empty line as a separate ingredient
- Skip empty lines
- If a line cannot be parsed at all, skip it and add a warning`;
}

export async function parseIngredients(
  request: AiParseIngredientsRequest
): Promise<AiParseIngredientsResponse> {
  const { rawText, measurementSystem } = request;

  console.log('AI Parse Ingredients Request:', {
    rawText: rawText.slice(0, 200),
    measurementSystem,
  });

  if (!rawText.trim()) {
    return { ingredients: [], warnings: ['No text provided'] };
  }

  // Get OpenAI API key from Secrets Manager
  const apiKey = await getOpenAIApiKey();
  const openai = new OpenAI({ apiKey });

  try {
    const systemPrompt = buildSystemPrompt(measurementSystem);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Parse these ingredients:\n\n${rawText}`,
        },
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: 4000,
    });

    console.log('OpenAI response received');

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from AI');
    }

    const parsed = JSON.parse(responseContent) as {
      ingredients: ParsedIngredientResult[];
      warnings?: string[];
    };

    // Validate and sanitize the response
    const validatedIngredients: ParsedIngredientResult[] = (parsed.ingredients || [])
      .filter((ing) => ing.name && typeof ing.quantity === 'number')
      .map((ing) => ({
        name: String(ing.name).trim(),
        quantity: Number(ing.quantity) || 0,
        unit: String(ing.unit || '').trim(),
        originalLine: String(ing.originalLine || '').trim(),
        confidence: (['high', 'medium', 'low'].includes(ing.confidence) ? ing.confidence : 'medium') as
          | 'high'
          | 'medium'
          | 'low',
        wasConverted: Boolean(ing.wasConverted),
      }));

    return {
      ingredients: validatedIngredients,
      warnings: parsed.warnings,
    };
  } catch (error: any) {
    console.error('AI Parse Ingredients Error:', {
      message: error.message,
      status: error.status,
      code: error.code,
    });
    throw error;
  }
}
