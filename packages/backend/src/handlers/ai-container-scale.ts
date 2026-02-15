import OpenAI from 'openai';
import type { AiContainerScaleRequest, AiContainerScaleResponse, ContainerInfo, ContainerType, MuffinCupSize } from '@proofed/shared';
import { getOpenAIApiKey } from '../lib/secrets';
import { getConversionMultiplier, formatMultiplier } from '../constants/cake-conversions';

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

// Calculate deterministic scale factor based on area (for round/square tins)
// or volume (for other container types)
function calculateDeterministicScaleFactor(
  sourceContainer: ContainerInfo,
  targetContainer: ContainerInfo
): { scaleFactor: number; scaleFactorDisplay: string } {
  const sourceType = sourceContainer.type;
  const targetType = targetContainer.type;

  // For round and square cake tins, use area-based calculation
  if (
    (sourceType === 'round_cake_tin' || sourceType === 'square_cake_tin') &&
    (targetType === 'round_cake_tin' || targetType === 'square_cake_tin')
  ) {
    const sourceSize = sourceContainer.size || 8;
    const targetSize = targetContainer.size || 8;
    const sourceShape = sourceType === 'round_cake_tin' ? 'round' : 'square';
    const targetShape = targetType === 'round_cake_tin' ? 'round' : 'square';

    // Calculate base multiplier for single tin
    const baseMultiplier = getConversionMultiplier(sourceSize, targetSize, sourceShape, targetShape);

    // Adjust for container count
    const scaleFactor = Math.round((baseMultiplier * targetContainer.count / sourceContainer.count) * 100) / 100;
    const scaleFactorDisplay = `${formatMultiplier(scaleFactor)} (${scaleFactor}×)`;

    return { scaleFactor, scaleFactorDisplay };
  }

  // For other container types, fall back to volume-based calculation
  const sourceVolume = calculateContainerVolume(sourceContainer);
  const targetVolume = calculateContainerVolume(targetContainer);
  const scaleFactor = Math.round((targetVolume / sourceVolume) * 100) / 100;
  const scaleFactorDisplay = `${formatMultiplier(scaleFactor)} (${scaleFactor}×)`;

  return { scaleFactor, scaleFactorDisplay };
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

  // Calculate deterministic scale factor based on area/volume
  const { scaleFactor, scaleFactorDisplay } = calculateDeterministicScaleFactor(sourceContainer, targetContainer);

  console.log('Deterministic scale calculation:', {
    sourceContainer,
    targetContainer,
    scaleFactor,
    scaleFactorDisplay,
  });

  // Get OpenAI API key from Secrets Manager
  const apiKey = await getOpenAIApiKey();
  const openai = new OpenAI({ apiKey });

  const ingredientList = context.ingredients
    .map((ing) => `${ing.quantity} ${ing.unit} ${ing.name}`)
    .join(', ');

  // AI prompt focuses only on baking tips, not scale factor calculation
  const prompt = `You are "Crumb", a chill, laid-back baker who genuinely loves talking about bakes. You've got that relaxed vibe - think of a talented baker friend who's seen it all but never judges.

A baker is scaling their recipe from one container to another. The scale factor has already been calculated:

**Recipe**: ${context.recipeName} for ${context.itemName}
**Item Type**: ${context.itemType}
**Current Container**: ${formatContainer(sourceContainer)}
**Target Container**: ${formatContainer(targetContainer)}
**Scale Factor**: ${scaleFactorDisplay}
**Ingredients**: ${ingredientList}
${context.bakeTime ? `**Current Bake Time**: ${context.bakeTime} minutes` : ''}
${context.bakeTemp ? `**Current Bake Temp**: ${context.bakeTemp}°${context.bakeTempUnit || 'F'}` : ''}

Your job is to provide baking recommendations for this container change, considering:
1. Batter depth implications - deeper batter cooks differently than shallow
2. Rise patterns - different item types rise differently, depth affects dome
3. Heat distribution - container shape affects how heat reaches the center
4. Recipe type - ${context.itemType}s have specific characteristics

Respond with a JSON object in this exact format:
{
  "explanation": "Your chill, casual explanation of what to expect with this container change (2-3 sentences). Mention key considerations like batter depth or heat distribution.",
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
- DO NOT include scaleFactor or scaleFactorDisplay - those are already calculated
- Keep the explanation chill and conversational - no corporate speak
- Include 1-2 practical tips specific to this container change
- Only include adjustedBakeTime/adjustedBakeTemp if you're suggesting changes
- Only include warning for extreme cases (e.g., scaling by 3x or more, going from very shallow to very deep)`;

  console.log('Prompt being sent to AI:', prompt);

  try {
    console.log('Calling OpenAI API for baking tips...');

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
      max_tokens: 500,
    });

    console.log('OpenAI response received:', JSON.stringify(completion, null, 2));

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from AI');
    }

    const parsed = JSON.parse(responseContent) as {
      explanation: string;
      tips: Array<{ title: string; suggestion: string }>;
      adjustedBakeTime?: number;
      adjustedBakeTemp?: number;
      adjustedBakeTempUnit?: 'F' | 'C';
      warning?: string;
    };

    // Combine deterministic scale factor with AI-generated tips
    return {
      scaleFactor,
      scaleFactorDisplay,
      explanation: parsed.explanation,
      tips: parsed.tips,
      adjustedBakeTime: parsed.adjustedBakeTime,
      adjustedBakeTemp: parsed.adjustedBakeTemp,
      adjustedBakeTempUnit: parsed.adjustedBakeTempUnit,
      warning: parsed.warning,
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
