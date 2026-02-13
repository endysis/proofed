import OpenAI from 'openai';
import type { AiContainerScaleRequest, AiContainerScaleResponse, ContainerInfo, ContainerType, MuffinCupSize } from '@proofed/shared';
import { getOpenAIApiKey } from '../lib/secrets';

// Container type display names
const CONTAINER_NAMES: Record<ContainerType, string> = {
  round_cake_tin: 'round cake tin',
  square_cake_tin: 'square cake tin',
  loaf_tin: 'loaf tin',
  bundt_tin: 'bundt tin',
  sheet_pan: 'sheet pan',
  muffin_tin: 'muffin tin',
  other: 'container', // kept for backwards compatibility
};

// Muffin cup volumes in cups (the unit)
const MUFFIN_CUP_VOLUMES: Record<MuffinCupSize, number> = {
  mini: 0.125,    // 1/8 cup per mini muffin
  standard: 0.5,  // 1/2 cup per standard muffin
  jumbo: 0.625,   // 5/8 cup per jumbo muffin
};

// Standard volumes for round cake tins at 2" depth (cups)
const ROUND_TIN_VOLUMES: Record<number, number> = {
  6: 4,
  7: 5,
  8: 6,
  9: 8,
  10: 11,
  12: 14,
};

// Standard volumes for square tins at 2" depth (cups)
const SQUARE_TIN_VOLUMES: Record<number, number> = {
  8: 8,
  9: 10,
  10: 12,
};

// Calculate container volume in CUPS for fair comparison
function calculateContainerVolume(container: ContainerInfo): number {
  const { type, count } = container;

  switch (type) {
    case 'round_cake_tin':
      // Use standard volumes, fallback to calculation
      const roundSize = container.size || 8;
      const roundVolume = ROUND_TIN_VOLUMES[roundSize] || (Math.PI * Math.pow(roundSize / 2, 2) * 2 / 14.4);
      return roundVolume * count;

    case 'square_cake_tin':
      // Use standard volumes, fallback to calculation
      const squareSize = container.size || 8;
      const squareVolume = SQUARE_TIN_VOLUMES[squareSize] || (Math.pow(squareSize, 2) * 2 / 14.4);
      return squareVolume * count;

    case 'loaf_tin':
      // Standard loaf volumes: 8x4=4cups, 8.5x4.5=6cups, 9x5=8cups
      const loafLength = container.length || 9;
      const loafWidth = container.width || 5;
      if (loafLength <= 8 && loafWidth <= 4) return 4 * count;
      if (loafLength <= 8.5 && loafWidth <= 4.5) return 6 * count;
      return 8 * count;

    case 'sheet_pan':
      // 9x13=14cups, 11x7=10cups, 13x18=24cups (half sheet)
      const sheetLength = container.length || 13;
      const sheetWidth = container.width || 9;
      if (sheetLength <= 9 && sheetWidth <= 13) return 14 * count;
      if (sheetLength <= 11 && sheetWidth <= 7) return 10 * count;
      return 24 * count; // half sheet

    case 'bundt_tin':
      // Already in cups!
      return (container.capacity || 10) * count;

    case 'muffin_tin':
      // Volume per cup × cups per tray × number of trays
      const cupVolume = MUFFIN_CUP_VOLUMES[container.cupSize || 'standard'];
      const cupsPerTray = container.cupsPerTray || 12;
      const totalCups = cupsPerTray * count;
      return cupVolume * totalCups;

    default:
      // Fallback: assume 8" round
      return 6 * count;
  }
}

function formatContainer(container: ContainerInfo): string {
  const typeName = CONTAINER_NAMES[container.type];
  const plural = container.count > 1 ? 's' : '';

  switch (container.type) {
    case 'round_cake_tin':
    case 'square_cake_tin':
      return `${container.count} × ${container.size}" ${typeName}${plural}`;

    case 'loaf_tin':
    case 'sheet_pan':
      return `${container.count} × ${container.length}"×${container.width}" ${typeName}${plural}`;

    case 'bundt_tin':
      return `${container.count} × ${container.capacity}-cup ${typeName}${plural}`;

    case 'muffin_tin':
      const cupLabel = container.cupSize === 'mini' ? 'mini' : container.cupSize === 'jumbo' ? 'jumbo' : 'standard';
      const cupsPerTray = container.cupsPerTray || 12;
      const totalCups = cupsPerTray * container.count;
      const trayText = container.count > 1 ? `(${container.count} trays)` : '(1 tray)';
      return `${totalCups} ${cupLabel} cups ${trayText}`;

    default:
      return `${container.count} × ${typeName}${plural}`;
  }
}

export async function getAiContainerScale(request: AiContainerScaleRequest): Promise<AiContainerScaleResponse> {
  const { sourceContainer, targetContainer, context } = request;

  console.log('AI Container Scale Request:', JSON.stringify(request, null, 2));

  // Get OpenAI API key from Secrets Manager
  const apiKey = await getOpenAIApiKey();
  const openai = new OpenAI({ apiKey });

  // Calculate volume ratio for AI context (all in cups)
  const sourceVolume = calculateContainerVolume(sourceContainer);
  const targetVolume = calculateContainerVolume(targetContainer);
  const volumeRatio = targetVolume / sourceVolume;

  console.log('Volume calculations:', {
    sourceContainer,
    targetContainer,
    sourceVolume: `${sourceVolume} cups`,
    targetVolume: `${targetVolume} cups`,
    volumeRatio,
  });

  const ingredientList = context.ingredients
    .map((ing) => `${ing.quantity} ${ing.unit} ${ing.name}`)
    .join(', ');

  const prompt = `You are "Crumb", a chill, laid-back baker who genuinely loves talking about bakes. You've got that relaxed vibe - think of a talented baker friend who's seen it all but never judges.

A baker wants to scale their recipe from one container to another:

**Recipe**: ${context.recipeName} for ${context.itemName}
**Item Type**: ${context.itemType}
**Current Container**: ${formatContainer(sourceContainer)}
**Target Container**: ${formatContainer(targetContainer)}
**Ingredients**: ${ingredientList}
${context.bakeTime ? `**Current Bake Time**: ${context.bakeTime} minutes` : ''}
${context.bakeTemp ? `**Current Bake Temp**: ${context.bakeTemp}°${context.bakeTempUnit || 'F'}` : ''}

**Volume Calculation**: The target container holds ${(volumeRatio * 100).toFixed(0)}% of the source container's volume (ratio: ${volumeRatio.toFixed(3)}, source: ${sourceVolume.toFixed(1)} cups, target: ${targetVolume.toFixed(1)} cups)

Your job is to recommend a scale factor, considering:
1. Volume difference (already calculated above in cups)
2. Batter depth implications - deeper batter cooks differently than shallow
3. Rise patterns - different item types rise differently, depth affects dome
4. Heat distribution - container shape affects how heat reaches the center
5. Recipe type - ${context.itemType}s have specific characteristics

The volume ratio is ${volumeRatio.toFixed(3)}. Use this as your starting point for the scale factor, then adjust slightly based on the factors above. For example, if the ratio is 0.42, the scale factor should be close to 0.42 (scaling down to ~42% of original). If the ratio is 2.5, the scale factor should be close to 2.5 (scaling up to 250% of original).

IMPORTANT: Based on the volume calculation above (${volumeRatio.toFixed(3)}), the scale factor should be approximately ${volumeRatio.toFixed(2)}. You may adjust slightly based on baking considerations, but stay close to this ratio.

Respond with a JSON object in this exact format:
{
  "scaleFactor": <calculated decimal number based on area ratio, e.g., 0.35 for scaling down, 2.5 for scaling up>,
  "scaleFactorDisplay": "<human-friendly version like 'x0.35' or 'about 1/3' or 'x2.5'>",
  "explanation": "Your chill, casual explanation of the scaling recommendation (2-3 sentences). Mention key considerations like batter depth or heat distribution.",
  "tips": [
    {
      "title": "Short tip title",
      "suggestion": "Specific actionable advice for this container change."
    }
  ],
  "adjustedBakeTime": <optional: adjusted time in minutes if needed>,
  "adjustedBakeTemp": <optional: adjusted temp if needed>,
  "adjustedBakeTempUnit": "F",
  "warning": "<optional: only include if there's a significant concern>"
}

Important:
- scaleFactor MUST be based on the volume ratio (${volumeRatio.toFixed(3)}) - do not make up arbitrary numbers
- If volume ratio is less than 1 (e.g., 0.42), you are scaling DOWN - scaleFactor should be close to 0.42
- If volume ratio is greater than 1 (e.g., 2.5), you are scaling UP - scaleFactor should be close to 2.5
- scaleFactorDisplay should be human-friendly (e.g., "x0.35", "about 1/3", "x2.5", "almost double")
- Keep the explanation chill and conversational - no corporate speak
- Include 1-2 practical tips specific to this container change
- Only include adjustedBakeTime/adjustedBakeTemp if you're suggesting changes
- Only include warning for extreme cases (e.g., scaling by 3x or more, going from very shallow to very deep)`;

  console.log('Prompt being sent to AI:', prompt);

  try {
    console.log('Calling OpenAI API for container scale...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert baking advisor. Respond only with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 600,
    });

    console.log('OpenAI response received:', JSON.stringify(completion, null, 2));

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from AI');
    }

    const parsed = JSON.parse(responseContent) as Omit<AiContainerScaleResponse, 'generatedAt'>;

    return {
      ...parsed,
      generatedAt: new Date().toISOString(),
    };
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
