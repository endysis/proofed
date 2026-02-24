import OpenAI from 'openai';
import type { CalorieEstimateRequest, CalorieEstimateResponse } from '@proofed/shared';
import { getOpenAIApiKey } from '../lib/secrets';

/**
 * Estimate total calories for a list of ingredients using AI
 *
 * @param request - The calorie estimate request with scaled ingredients
 * @returns The estimated total calories
 */
export async function estimateCalories(
  request: CalorieEstimateRequest
): Promise<CalorieEstimateResponse> {
  const { ingredients } = request;

  console.log('Calorie Estimate Request:', JSON.stringify(request, null, 2));

  if (!ingredients || ingredients.length === 0) {
    return { totalCalories: 0 };
  }

  // Format ingredients for the prompt
  const ingredientList = ingredients
    .filter((ing) => ing.quantity > 0)
    .map((ing) => `- ${ing.quantity} ${ing.unit} ${ing.name}`)
    .join('\n');

  if (!ingredientList) {
    return { totalCalories: 0 };
  }

  // Get OpenAI API key from Secrets Manager
  const apiKey = await getOpenAIApiKey();
  const openai = new OpenAI({ apiKey });

  try {
    const prompt = `Estimate the total calories for these baking ingredients combined:

${ingredientList}

Calculate the total calories for all these ingredients combined. Consider standard caloric densities for baking ingredients:
- Flour: ~364 calories per 100g
- Sugar: ~387 calories per 100g
- Butter: ~717 calories per 100g
- Eggs: ~155 calories per 100g (~75 cal per large egg)
- Milk: ~42 calories per 100ml
- Cream: ~340 calories per 100ml (heavy cream)
- Oil: ~884 calories per 100ml
- Cocoa powder: ~228 calories per 100g
- Chocolate: ~546 calories per 100g

Return ONLY a JSON object with the total calories (rounded to nearest 10):
{ "totalCalories": 2450 }`;

    console.log('Calling OpenAI API for calorie estimation...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a nutrition calculator. Estimate total calories accurately based on ingredient quantities. Respond only with valid JSON containing totalCalories as an integer.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: 200,
    });

    console.log('OpenAI response received:', JSON.stringify(completion, null, 2));

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from AI');
    }

    const parsed = JSON.parse(responseContent) as { totalCalories: number };

    // Ensure we return a valid number
    const totalCalories = Math.round(parsed.totalCalories || 0);

    return { totalCalories };
  } catch (error: any) {
    console.error('OpenAI API Error:', {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type,
      error: error.error,
      stack: error.stack,
    });
    throw error;
  }
}
