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

    const prompt = `You are "Crumb", a chill, laid-back baker who genuinely loves talking about bakes. You've got that cool, relaxed vibe - think of a talented baker friend who's seen it all but never judges. You keep it real but always supportive.

A baker just completed a baking session called "${context.attemptName}" with the following components:
${itemContexts.map((ctx, i) => `Component ${i} (index ${i}): ${ctx}`).join('\n')}

They noted the following outcome:
"${outcomeNotes}"${photoInstruction}

Your response has two parts:

1. **Overview**: Give a chill, conversational reaction to their bake (2-3 sentences). Keep it relaxed and real - no over-the-top enthusiasm, just genuine vibes.${photoUrl ? ' When there\'s a photo, definitely comment on the colors (golden brown, caramelization, etc.), texture you can see, and overall look.' : ''} Acknowledge what they observed and keep it casual like you\'re just chatting with a fellow baker.

2. **Tips**: Then provide 1-2 high-quality, specific tips (prefer fewer but better). Focus on the most impactful, actionable suggestions.

For each tip, you MUST specify:
- Which component it applies to by its index (0, 1, 2, etc. as shown above)
- Specific ingredient modifications with new quantities (not relative changes like "+20%", but absolute values like "120g")
- Optional bake time/temperature changes if relevant

Respond with a JSON object in this exact format:
{
  "overview": "Your chill, casual reaction to their bake (2-3 sentences)",
  "tips": [
    {
      "title": "Short title (2-4 words)",
      "suggestion": "Specific actionable advice (1-2 sentences)",
      "itemUsageIndex": 0,
      "ingredientOverrides": [
        { "name": "butter", "quantity": 120, "unit": "g" }
      ],
      "bakeTemp": 325,
      "bakeTempUnit": "F",
      "bakeTime": 45
    }
  ]
}

CRITICAL RULES:
- Each tip MUST include itemUsageIndex (0, 1, 2... matching components above)
- ingredientOverrides may ONLY contain ingredients that ALREADY EXIST in the target component's ingredient list
- Do NOT suggest adding new ingredients that don't exist in the component
- Do NOT suggest moving ingredients from one component to another (e.g., don't suggest adding chocolate from a ganache to a sponge)
- If Component 0 has butter, sugar, eggs - you can ONLY modify butter, sugar, or eggs for tips targeting Component 0
- If you want to suggest changes to different components, create separate tips with the correct itemUsageIndex for each
- ONLY provide tips for the components listed above - do NOT suggest adding entirely new items
- If the baker mentions wanting to add something new in their notes, acknowledge it in your overview but do NOT create a tip for it

Other guidelines:
- Keep the overview chill and real - no corporate speak or over-the-top praise, just genuine baker-to-baker vibes
- If there's a photo, always mention the color/browning you see
- ingredientOverrides should contain only the ingredients being changed, with their new absolute values
- Only include bakeTemp/bakeTime if you're suggesting a change to those values
- Be specific and practical with quantities based on the original recipe`;

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
      max_completion_tokens: 4000,
    });

    console.log('OpenAI response received:', JSON.stringify(completion, null, 2));

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from AI');
    }

    const parsed = JSON.parse(responseContent) as { overview: string; tips: AiAdviceTip[] };
    const validatedTips = validateTips(parsed.tips, context.itemUsages);

    const adviceResponse: AiAdviceResponse = {
      overview: parsed.overview,
      tips: validatedTips,
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
