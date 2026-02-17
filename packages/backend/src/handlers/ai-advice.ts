import OpenAI from 'openai';
import type { AiAdviceRequest, AiAdviceResponse, AiAdviceTip, Ingredient } from '@proofed/shared';
import { getOpenAIApiKey } from '../lib/secrets';
import { getItem, updateItem } from '../lib/dynamo';
import type { Attempt } from '@proofed/shared';

const ATTEMPTS_TABLE = process.env.ATTEMPTS_TABLE!;

/**
 * Validates and filters AI tips to ensure they only reference components that exist in the bake.
 * Also corrects itemUsageIndex if a tip mentions a different component than assigned.
 * Filters out tips where ingredientOverrides reference ingredients not in the target component.
 */
function validateTips(
  tips: AiAdviceTip[],
  itemUsages: Array<{ itemName: string; ingredients: Ingredient[] }>
): AiAdviceTip[] {
  const itemNames = itemUsages.map((u) => u.itemName.toLowerCase());
  const itemKeywords = itemUsages.map((u) =>
    u.itemName
      .toLowerCase()
      .split(' ')
      .filter((w) => w.length > 3)
  );

  // Common baking items that might be mentioned but not in this bake
  // Group synonyms together - if tip mentions any term in a group, check if ANY synonym is in the bake
  const synonymGroups: string[][] = [
    ['frosting', 'icing', 'buttercream'],  // These terms are often used interchangeably
    ['ganache'],
    ['glaze'],
    ['filling'],
    ['sponge', 'cake'],  // Cake and sponge are related
    ['meringue'],
    ['caramel'],
    ['custard'],
    ['mousse'],
    ['fondant'],
  ];

  // Flatten for quick lookup of which group a term belongs to
  const termToGroup = new Map<string, string[]>();
  for (const group of synonymGroups) {
    for (const term of group) {
      termToGroup.set(term, group);
    }
  }

  return tips
    .filter((tip) => {
      const tipText = `${tip.title} ${tip.suggestion}`.toLowerCase();

      for (const [term, synonyms] of termToGroup) {
        if (tipText.includes(term)) {
          // Check if ANY synonym from this group is in our bake
          const isInBake = synonyms.some(
            (syn) =>
              itemNames.some((name) => name.includes(syn)) ||
              itemKeywords.some((keywords) => keywords.includes(syn))
          );
          if (!isInBake) {
            // Tip mentions an item not in this bake - filter it out
            console.log(`Filtering out tip "${tip.title}" - mentions "${term}" which is not in the bake`);
            return false;
          }
        }
      }
      return true;
    })
    .map((tip) => {
      // Correct index if tip mentions a different component than assigned
      const tipText = `${tip.title} ${tip.suggestion}`.toLowerCase();
      for (let i = 0; i < itemUsages.length; i++) {
        const keywords = itemKeywords[i];
        if (keywords.some((kw) => tipText.includes(kw)) && i !== tip.itemUsageIndex) {
          console.log(`Correcting tip "${tip.title}" index from ${tip.itemUsageIndex} to ${i}`);
          return { ...tip, itemUsageIndex: i };
        }
      }
      return tip;
    })
    // Filter out tips where ingredientOverrides reference ingredients not in the target component
    .filter((tip) => {
      if (!tip.ingredientOverrides || tip.ingredientOverrides.length === 0) {
        return true;
      }
      const targetUsage = itemUsages[tip.itemUsageIndex];
      if (!targetUsage) {
        console.log(`Filtering tip "${tip.title}" - invalid itemUsageIndex ${tip.itemUsageIndex}`);
        return false;
      }
      const targetIngredientNames = targetUsage.ingredients.map((i) => i.name.toLowerCase());
      for (const override of tip.ingredientOverrides) {
        if (!targetIngredientNames.includes(override.name.toLowerCase())) {
          console.log(`Filtering tip "${tip.title}" - "${override.name}" not in ${targetUsage.itemName}`);
          return false;
        }
      }
      return true;
    });
}

export async function getAiAdvice(
  userId: string,
  attemptId: string,
  request: AiAdviceRequest
): Promise<AiAdviceResponse> {
  const { outcomeNotes, photoUrl, context } = request;

  console.log('AI Advice Request:', JSON.stringify(request, null, 2));
  console.log('Photo URL provided:', !!photoUrl);

  // Check if advice has already been requested for this attempt
  const attempt = await getItem<Attempt>(ATTEMPTS_TABLE, { userId, attemptId });
  if (!attempt) {
    throw new Error('Attempt not found');
  }
  if (attempt.aiAdvice) {
    const error = new Error('Advice already requested for this bake');
    (error as any).statusCode = 400;
    throw error;
  }

  // Get OpenAI API key from Secrets Manager
  const apiKey = await getOpenAIApiKey();
  const openai = new OpenAI({ apiKey });

  try {
    // Build context string from item usages
    const itemContexts = context.itemUsages.map((usage) => {
      const ingredientList = usage.ingredients
        .map((ing) => `${ing.quantity} ${ing.unit} ${ing.name}`)
        .join(', ');

      let description = `${usage.itemName} using ${usage.recipeName}`;
      if (usage.variantName) {
        description += ` (variant: ${usage.variantName})`;
      }
      if (usage.scaleFactor && usage.scaleFactor !== 1) {
        description += ` scaled to ${usage.scaleFactor}x`;
      }
      if (ingredientList) {
        description += `\n   Ingredients: ${ingredientList}`;
      }
      if (usage.bakeTime || usage.bakeTemp) {
        const bakeInfo = [];
        if (usage.bakeTime) bakeInfo.push(`${usage.bakeTime} minutes`);
        if (usage.bakeTemp) bakeInfo.push(`${usage.bakeTemp}°${usage.bakeTempUnit || 'F'}`);
        description += `\n   Baking: ${bakeInfo.join(' at ')}`;
      }
      return description;
    });

    const photoInstruction = photoUrl
      ? '\n\nI have also attached a photo of my bake. Check it out!'
      : '';

    const prompt = `You are "Crumb", a warm and encouraging baker with the personality of Mary Berry - that lovely, slightly posh British warmth combined with decades of baking wisdom. You're supportive but honest, using phrases like "scrummy," "lovely," "delightful," and "rather good." You have a gentle, grandmotherly charm and genuinely want to help bakers improve.

A baker just completed a baking session called "${context.attemptName}" with the following components:
${itemContexts.map((ctx, i) => `- ${ctx}`).join('\n')}

They noted the following outcome:
"${outcomeNotes}"${photoInstruction}

Give a warm, encouraging reaction to their bake in Mary Berry's style (3-4 sentences). Be genuinely supportive but honest - if something needs work, say so kindly.${photoUrl ? ' Comment on the appearance - the colour, the rise, the texture you can see.' : ''} Use British English spellings and Mary Berry's characteristic warmth. If they mention specific issues, offer a gentle suggestion for next time.

Respond with a JSON object in this exact format:
{
  "overview": "Your warm, Mary Berry-style reaction (3-4 sentences)"
}

Guidelines:
- Channel Mary Berry's warmth, supportive, encouraging, but honest when needed
- Use British English spellings (colour, favourite, flavour, marvellous)
- Use phrases like "scrummy," "lovely," "delightful," "rather good," "well done"
- If there's a photo, comment on the colour, rise, and overall appearance
- Keep it conversational and warm, like a gentle mentor
- NEVER use dashes or hyphens in your response. Write in natural flowing sentences instead`;

    console.log('Calling OpenAI API...');

    // Build message content - include image if photo URL provided
    const userContent: Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }> = [
      { type: 'text', text: prompt },
    ];

    if (photoUrl) {
      userContent.push({
        type: 'image_url',
        image_url: { url: photoUrl },
      });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert baking advisor. Respond only with valid JSON.',
        },
        {
          role: 'user',
          content: userContent,
        },
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: 2000,
    });

    console.log('OpenAI response received:', JSON.stringify(completion, null, 2));

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from AI');
    }

    const parsed = JSON.parse(responseContent) as { overview: string };

    const adviceResponse: AiAdviceResponse = {
      overview: parsed.overview,
      tips: [],  // Tips feature disabled for now - see docs/crumb-tips-prompt.md to re-enable
      generatedAt: new Date().toISOString(),
    };

    // Save the advice to the attempt record
    await updateItem<Attempt>(ATTEMPTS_TABLE, { userId, attemptId }, { aiAdvice: adviceResponse });
    console.log('Saved AI advice to attempt record');

    return adviceResponse;
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
